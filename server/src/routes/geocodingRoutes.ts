import { Router, Request, Response } from 'express';

export const geocodingRoutes = Router();

interface GeocodeCacheEntry {
  data: any[];
  timestamp: number;
}

const cache = new Map<string, GeocodeCacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Fast coordinate detector
function checkCoordinate(q: string) {
  const coordRegex = /^\s*(-?\d+(\.\d+)?)\s*[, ]\s*(-?\d+(\.\d+)?)\s*$/;
  const match = q.trim().match(coordRegex);
  if (!match) return null;

  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[3]);

  if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    return {
      id: `coord_${lat}_${lon}`,
      displayName: `Coordinates: ${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`,
      placeName: `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`,
      address: `Latitude: ${lat.toFixed(6)}, Longitude: ${lon.toFixed(6)}`,
      lat,
      lon,
      type: 'coordinate',
      boundingBox: [lat - 0.01, lat + 0.01, lon - 0.01, lon + 0.01],
    };
  }
  return null;
}

// Map Nominatim class / type to user-friendly category
function mapPlaceType(item: any): string {
  const t = item.type || item.class || '';
  if (t === 'city' || t === 'administrative' || t === 'municipality') return 'city';
  if (t === 'village' || t === 'hamlet' || t === 'town') return 'village';
  if (t === 'postcode') return 'postcode';
  if (t === 'monument' || t === 'attraction' || t === 'tourism' || t === 'historic') return 'landmark';
  if (t === 'country' || t === 'state') return 'region';
  return 'place';
}

/**
 * GET /api/geocoding/search?q=query
 * Global geocoding search for cities, villages, landmarks, PIN codes, addresses, or coordinates
 */
geocodingRoutes.get('/search', async (req: Request, res: Response) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    if (!query || query.length < 2) {
      return res.json({ success: true, results: [] });
    }

    // 1. Direct coordinate match?
    const coordResult = checkCoordinate(query);
    if (coordResult) {
      return res.json({ success: true, results: [coordResult] });
    }

    // 2. Check cache
    const cacheKey = query.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({ success: true, results: cached.data, cached: true });
    }

    // 3. Query OpenStreetMap Nominatim with standard User-Agent
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&addressdetails=1&limit=6&accept-language=en`;

    const fetchResponse = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Krishvya-Smart-Agri/1.0 (contact@krishvya.org)',
        Accept: 'application/json',
      },
    });

    if (!fetchResponse.ok) {
      throw new Error(`Nominatim upstream error: status ${fetchResponse.status}`);
    }

    const rawData = (await fetchResponse.json()) as any[];

    const results = (rawData || []).map((item, index) => {
      const address = item.address || {};
      const placeName =
        address.city ||
        address.town ||
        address.village ||
        address.hamlet ||
        address.suburb ||
        address.county ||
        address.state ||
        item.name ||
        item.display_name.split(',')[0];

      return {
        id: `osm_${item.place_id || index}`,
        displayName: item.display_name,
        placeName: placeName,
        address: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: mapPlaceType(item),
        boundingBox: item.boundingbox
          ? [
              parseFloat(item.boundingbox[0]),
              parseFloat(item.boundingbox[1]),
              parseFloat(item.boundingbox[2]),
              parseFloat(item.boundingbox[3]),
            ]
          : undefined,
      };
    });

    // Store in cache
    cache.set(cacheKey, { data: results, timestamp: Date.now() });

    return res.json({ success: true, results });
  } catch (err: any) {
    console.warn('Geocoding search failed:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to search location. Please try again or check your query.',
      results: [],
    });
  }
});

/**
 * GET /api/geocoding/reverse?lat=latitude&lon=longitude
 * Reverse geocoding to resolve address, district, state from coordinates
 */
geocodingRoutes.get('/reverse', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    const cacheKey = `rev_${lat.toFixed(4)}_${lon.toFixed(4)}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({ success: true, data: cached.data[0] });
    }

    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=en`;
    const response = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'KRISHVYA-Smart-Farming-App/1.0',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ success: false, message: 'OSM reverse geocoding failed' });
    }

    const item = (await response.json()) as any;
    const addr = item.address || {};
    const district = addr.county || addr.district || addr.state_district || addr.city || '';
    const state = addr.state || '';
    const village = addr.village || addr.hamlet || addr.town || addr.suburb || '';
    const placeName = village || district || item.name || item.display_name?.split(',')?.[0] || 'Selected Location';

    const result = {
      displayName: item.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      placeName,
      district,
      state,
      village,
      lat,
      lon,
    };

    cache.set(cacheKey, { data: [result], timestamp: Date.now() });
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

