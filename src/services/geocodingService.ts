export interface GeocodingResult {
  id: string;
  displayName: string;
  placeName: string;
  address: string;
  lat: number;
  lon: number;
  type: 'city' | 'village' | 'landmark' | 'address' | 'postcode' | 'coordinate' | 'region' | 'place';
  boundingBox?: [number, number, number, number];
}

/**
 * Checks if user entered raw coordinates (e.g. "18.5204, 73.8567", "18.5204 73.8567", "-33.8688, 151.2093")
 */
export function parseCoordinates(query: string): GeocodingResult | null {
  if (!query) return null;
  const clean = query.trim();

  // Match: optional +/- followed by digits and optional decimals, separated by comma or whitespace
  const coordRegex = /^\s*([+-]?\d+(?:\.\d+)?)\s*[, ]\s*([+-]?\d+(?:\.\d+)?)\s*$/;
  const match = clean.match(coordRegex);

  if (match) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);

    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      const latDir = lat >= 0 ? 'N' : 'S';
      const lonDir = lon >= 0 ? 'E' : 'W';
      return {
        id: `coord_${lat.toFixed(4)}_${lon.toFixed(4)}`,
        displayName: `GPS: ${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`,
        placeName: `Coordinates (${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir})`,
        address: `Direct Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`,
        lat,
        lon,
        type: 'coordinate',
        boundingBox: [lat - 0.01, lat + 0.01, lon - 0.01, lon + 0.01],
      };
    }
  }

  return null;
}

function mapOsmType(item: any): GeocodingResult['type'] {
  const t = (item.type || item.class || '').toLowerCase();
  if (t === 'city' || t === 'administrative' || t === 'municipality') return 'city';
  if (t === 'village' || t === 'hamlet' || t === 'town') return 'village';
  if (t === 'postcode') return 'postcode';
  if (t === 'monument' || t === 'attraction' || t === 'tourism' || t === 'historic') return 'landmark';
  if (t === 'country' || t === 'state') return 'region';
  return 'place';
}

/**
 * Searches global locations with debouncing and abort signals
 */
export async function searchGlobalLocations(
  query: string,
  signal?: AbortSignal
): Promise<GeocodingResult[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  // 1. Check for instantaneous client-side coordinate parsing
  const directCoord = parseCoordinates(q);
  if (directCoord) {
    return [directCoord];
  }

  // 2. Try backend geocoding proxy first (handles caching, User-Agent, and rate limiting)
  try {
    const backendUrl = `/api/geocoding/search?q=${encodeURIComponent(q)}`;
    const res = await fetch(backendUrl, { signal });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.results) && data.results.length > 0) {
        return data.results;
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    // Fall back to direct Nominatim if backend is unreachable
  }

  // 3. Fallback: Direct OpenStreetMap Nominatim request from browser
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      q
    )}&addressdetails=1&limit=6&accept-language=en`;

    const res = await fetch(osmUrl, { signal });
    if (!res.ok) return [];

    const data = (await res.json()) as any[];
    return (data || []).map((item, index) => {
      const addr = item.address || {};
      const placeName =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.hamlet ||
        addr.suburb ||
        addr.county ||
        addr.state ||
        item.name ||
        item.display_name.split(',')[0];

      return {
        id: `osm_${item.place_id || index}`,
        displayName: item.display_name,
        placeName: placeName,
        address: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: mapOsmType(item),
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
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    console.warn('Geocoding search error:', err);
    return [];
  }
}
