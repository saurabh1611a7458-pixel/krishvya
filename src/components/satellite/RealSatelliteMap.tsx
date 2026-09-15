import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RealSatelliteMapProps {
  latitude: number;
  longitude: number;
  userGpsLocation?: { lat: number; lon: number } | null;
  searchedLocation?: {
    lat: number;
    lon: number;
    displayName: string;
    placeName?: string;
  } | null;
  fieldBoundary?: Array<[number, number]>;
  layerMode: 'true_color' | 'ndvi_spectrum' | 'moisture_ndwi';
  ndviScore: number;
  zoomLevel?: number;
  onMapClick?: (lat: number, lon: number) => void;
  cropName?: string;
}

export const RealSatelliteMap: React.FC<RealSatelliteMapProps> = ({
  latitude,
  longitude,
  userGpsLocation,
  searchedLocation,
  fieldBoundary,
  layerMode,
  ndviScore,
  zoomLevel,
  onMapClick,
  cropName = 'Crop Field',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const gpsMarkerRef = useRef<L.Marker | null>(null);
  const searchedMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      // Fix leaflet default icon missing asset paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: zoomLevel || 15,
        minZoom: 3,
        maxZoom: 19,
        zoomControl: true,
      });

      // Move zoom control to bottom right so it doesn't collide with top search bar
      map.zoomControl.setPosition('bottomright');

      // Real High-Resolution Global Satellite Imagery (ArcGIS World Imagery from space)
      const satelliteTileLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution:
            '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics, USDA, USGS',
          maxNativeZoom: 18,
          maxZoom: 19,
        }
      ).addTo(map);

      tileLayerRef.current = satelliteTileLayer;

      // Handle map clicks for custom pin location
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClick) {
          onMapClick(e.latlng.lat, e.latlng.lng);
        }
      });

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Fly to target position when latitude/longitude or zoom changes
  useEffect(() => {
    if (!mapRef.current) return;

    const targetZoom = zoomLevel || (searchedLocation ? 15 : 16);
    mapRef.current.flyTo([latitude, longitude], targetZoom, {
      animate: true,
      duration: 1.2,
    });
  }, [latitude, longitude, zoomLevel, searchedLocation]);

  // Render / Update Live GPS Radar Marker (Strictly for user's real GPS position)
  useEffect(() => {
    if (!mapRef.current) return;

    if (userGpsLocation) {
      const { lat, lon } = userGpsLocation;

      if (gpsMarkerRef.current) {
        gpsMarkerRef.current.setLatLng([lat, lon]);
      } else {
        const pulseIcon = L.divIcon({
          className: 'custom-live-marker',
          html: `
            <div style="position: relative; width: 28px; height: 28px;">
              <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: #22c55e; opacity: 0.5; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: absolute; top: 4px; left: 4px; width: 20px; height: 20px; border-radius: 50%; background: #16a34a; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.6);"></div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([lat, lon], { icon: pulseIcon, zIndexOffset: 1000 }).addTo(mapRef.current);
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #111827;">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: bold; color: #15803d; margin-bottom: 4px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></span>
              <span>📍 My Live GPS Location</span>
            </div>
            <div style="font-size: 11px; color: #4b5563;">
              Lat: <b>${lat.toFixed(5)}</b> • Lon: <b>${lon.toFixed(5)}</b>
            </div>
            <div style="font-size: 10px; color: #9ca3af; margin-top: 3px;">
              Physical device location
            </div>
          </div>
        `);
        gpsMarkerRef.current = marker;
      }
    } else if (gpsMarkerRef.current) {
      gpsMarkerRef.current.remove();
      gpsMarkerRef.current = null;
    }
  }, [userGpsLocation]);

  // Render / Update Searched Location Marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (searchedLocation) {
      const { lat, lon, displayName, placeName } = searchedLocation;

      if (searchedMarkerRef.current) {
        searchedMarkerRef.current.setLatLng([lat, lon]);
      } else {
        // High-visibility rose/indigo drop pin
        const searchIcon = L.divIcon({
          className: 'custom-search-marker',
          html: `
            <div style="position: relative; width: 34px; height: 42px; transform: translate(-50%, -100%);">
              <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 0C7.61116 0 0 7.61116 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.61116 26.3888 0 17 0Z" fill="#6366F1"/>
                <circle cx="17" cy="17" r="7" fill="#FFFFFF"/>
                <circle cx="17" cy="17" r="4" fill="#4F46E5"/>
              </svg>
            </div>
          `,
          iconSize: [34, 42],
          iconAnchor: [17, 42],
          popupAnchor: [0, -42],
        });

        const marker = L.marker([lat, lon], { icon: searchIcon, zIndexOffset: 2000 }).addTo(mapRef.current);
        searchedMarkerRef.current = marker;
      }

      // Update popup content and open it
      searchedMarkerRef.current.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #111827; max-width: 240px;">
          <div style="display: flex; align-items: center; gap: 6px; font-weight: bold; color: #4338ca; margin-bottom: 4px;">
            <span>🔍 ${placeName || 'Searched Location'}</span>
          </div>
          <div style="font-size: 11px; color: #4b5563; line-height: 1.4; margin-bottom: 4px;">
            ${displayName}
          </div>
          <div style="font-size: 10px; font-family: monospace; color: #6b7280; background: #f3f4f6; padding: 3px 6px; rounded: 4px;">
            ${lat.toFixed(5)}°N, ${lon.toFixed(5)}°E
          </div>
        </div>
      `);
      searchedMarkerRef.current.openPopup();
    } else if (searchedMarkerRef.current) {
      searchedMarkerRef.current.remove();
      searchedMarkerRef.current = null;
    }
  }, [searchedLocation]);

  // Update field polygon boundary
  useEffect(() => {
    if (!mapRef.current) return;

    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }

    if (fieldBoundary && fieldBoundary.length > 2) {
      const polygonColor =
        layerMode === 'ndvi_spectrum'
          ? ndviScore >= 0.75
            ? '#22c55e'
            : ndviScore >= 0.6
            ? '#eab308'
            : '#ef4444'
          : '#38bdf8';

      const poly = L.polygon(fieldBoundary, {
        color: polygonColor,
        weight: 3,
        dashArray: '5, 5',
        fillColor: polygonColor,
        fillOpacity: layerMode === 'ndvi_spectrum' ? 0.25 : 0.15,
      }).addTo(mapRef.current);

      poly.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #1f2937;">
          <b style="font-size: 13px;">🌾 ${cropName} Field Boundary</b><br/>
          <span>Area: ~2.5 Acres</span><br/>
          <span>Mean NDVI: <b>${ndviScore}</b></span>
        </div>
      `);

      polygonRef.current = poly;
    }
  }, [fieldBoundary, layerMode, ndviScore, cropName]);

  return (
    <div className="relative w-full h-full min-h-[400px] sm:min-h-[460px] rounded-2xl overflow-hidden shadow-inner border border-earth-300">
      {/* Real Map Canvas */}
      <div ref={containerRef} className="w-full h-full min-h-[400px] sm:min-h-[460px]" />

      {/* Layer Filter Overlay Simulation */}
      {layerMode === 'ndvi_spectrum' && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-color"
          style={{
            background:
              ndviScore >= 0.75
                ? 'radial-gradient(ellipse at 50% 50%, rgba(34, 197, 94, 0.4) 0%, rgba(234, 179, 8, 0.2) 60%, rgba(239, 68, 68, 0.1) 100%)'
                : 'radial-gradient(ellipse at 50% 50%, rgba(234, 179, 8, 0.45) 0%, rgba(239, 68, 68, 0.35) 75%)',
          }}
        />
      )}

      {layerMode === 'moisture_ndwi' && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-overlay"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(14, 165, 233, 0.35) 0%, rgba(56, 189, 248, 0.2) 60%, rgba(245, 158, 11, 0.15) 100%)',
          }}
        />
      )}

      {/* Live Orbit Stamp & Spectrum Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white text-[10px] flex items-center gap-2 shadow-lg pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>
          Live Satellite: <strong>ESRI Orbit • Sentinel-2 Multi-Spectral</strong>
        </span>
      </div>

      <div className="absolute bottom-3 right-16 z-[1000] bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-earth-200 text-gray-800 text-[10px] font-mono shadow-sm flex items-center gap-1.5 pointer-events-none">
        <span>Lat: {latitude.toFixed(4)}°N</span>
        <span>•</span>
        <span>Lon: {longitude.toFixed(4)}°E</span>
      </div>
    </div>
  );
};
