import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useFarm } from '../context/FarmContext';
import { api } from '../services/api';
import { RealSatelliteMap } from '../components/satellite/RealSatelliteMap';
import {
  Satellite,
  Sparkles,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Navigation,
  Layers,
  MapPin,
  Droplets,
  Activity,
  AlertTriangle,
  Eye,
} from 'lucide-react';

interface SatelliteDataState {
  ndviScore: number;
  healthScore: number;
  eviScore?: number;
  ndwiScore?: number;
  rawSoilMoisturePercentage?: number;
  vegetationStatus: string;
  lastUpdated: string;
  satelliteProvider: string;
  resolutionMeters: number;
  coordinates?: { latitude: number; longitude: number };
  fieldBoundary?: Array<[number, number]>;
  stressDetected: boolean;
  stressDetails: {
    zone: string;
    areaPercentage: number;
    probableCause: string;
    recommendedAction: string;
  };
  timeframeTrends: {
    twoWeeks: Array<{ week: string; ndvi: number }>;
    fourWeeks: Array<{ week: string; ndvi: number }>;
    fullSeason: Array<{ month: string; ndvi: number }>;
  };
}

// Key agricultural hubs across India for easy scouting
const PRESET_FARM_ZONES = [
  { name: 'Nagpur (Central MH)', crop: 'Soybean / Cotton', lat: 21.3855, lon: 78.9189 },
  { name: 'Ludhiana (Punjab)', crop: 'Wheat / Paddy', lat: 30.901, lon: 75.8573 },
  { name: 'Guntur (Andhra)', crop: 'Chilli / Spices', lat: 16.3067, lon: 80.4365 },
  { name: 'Rajkot (Gujarat)', crop: 'Groundnut / Cotton', lat: 22.3039, lon: 70.8022 },
];

export const CropHealthPage: React.FC = () => {
  const { farm } = useFarm();
  const [timeframe, setTimeframe] = useState<'4weeks' | '2weeks' | 'season'>('4weeks');
  const [recommendationModal, setRecommendationModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Live coordinate state (defaults to farm or Nagpur hub)
  const [coords, setCoords] = useState<{
    lat: number;
    lon: number;
    label: string;
    isLiveGps: boolean;
  }>({
    lat: farm.location?.latitude || 21.3855,
    lon: farm.location?.longitude || 78.9189,
    label: farm.name || 'Primary Farm',
    isLiveGps: false,
  });

  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Satellite layer mode: true natural color, NDVI false color, or NDWI moisture
  const [layerMode, setLayerMode] = useState<'true_color' | 'ndvi_spectrum' | 'moisture_ndwi'>('ndvi_spectrum');

  const [satelliteData, setSatelliteData] = useState<SatelliteDataState>({
    ndviScore: farm.satellite?.ndvi || 0.78,
    healthScore: farm.satellite?.healthScore || 82,
    eviScore: 0.65,
    ndwiScore: 0.33,
    rawSoilMoisturePercentage: 38,
    vegetationStatus: 'Good',
    lastUpdated: farm.satellite?.lastUpdated || 'Today at 6:15 AM IST',
    satelliteProvider: 'ESA Copernicus Sentinel-2 MSI (10m Multi-Spectral)',
    resolutionMeters: 10,
    fieldBoundary: [
      [21.385, 78.918],
      [21.3862, 78.9182],
      [21.3861, 78.9198],
      [21.3848, 78.9196],
      [21.385, 78.918],
    ],
    stressDetected: true,
    stressDetails: {
      zone: 'North-East Field Margin (Zone B2)',
      areaPercentage: 12.5,
      probableCause: 'Localized lower soil moisture and mild moisture stress',
      recommendedAction: 'Inspect northern boundary drip lines and apply localized bio-fungicide spray',
    },
    timeframeTrends: {
      twoWeeks: [
        { week: '14 Days Ago', ndvi: 0.72 },
        { week: '10 Days Ago', ndvi: 0.74 },
        { week: '7 Days Ago', ndvi: 0.76 },
        { week: '3 Days Ago', ndvi: 0.77 },
        { week: 'Today', ndvi: 0.78 },
      ],
      fourWeeks: [
        { week: 'Week 1', ndvi: 0.68 },
        { week: 'Week 2', ndvi: 0.72 },
        { week: 'Week 3', ndvi: 0.76 },
        { week: 'Week 4 (Current)', ndvi: 0.78 },
      ],
      fullSeason: [
        { month: 'Sowing (Jun)', ndvi: 0.28 },
        { month: 'Vegetative (Jul)', ndvi: 0.58 },
        { month: 'Flowering (Aug)', ndvi: 0.78 },
        { month: 'Pod Fill (Sep)', ndvi: 0.82 },
      ],
    },
  });

  const loadSatelliteData = useCallback(async (targetLat?: number, targetLon?: number) => {
    setRefreshing(true);
    try {
      const lat = targetLat !== undefined ? targetLat : coords.lat;
      const lon = targetLon !== undefined ? targetLon : coords.lon;
      const res = await api.getLiveSatellite(lat, lon, farm.id);

      if (res.success && res.data) {
        setSatelliteData(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch live satellite data:', err);
    } finally {
      setRefreshing(false);
    }
  }, [coords.lat, coords.lon, farm.id]);

  useEffect(() => {
    loadSatelliteData(coords.lat, coords.lon);
  }, [coords.lat, coords.lon, loadSatelliteData]);

  // Handler to request farmer's live GPS coordinates via browser Geolocation API
  const handleUseLiveLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({
          lat: latitude,
          lon: longitude,
          label: `Live GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          isLiveGps: true,
        });
        setIsLocating(false);
      },
      (error) => {
        console.warn('GPS location request error:', error.message);
        setGpsError(
          error.code === 1
            ? 'GPS access permission denied. Please allow location access in your browser.'
            : 'Unable to acquire satellite GPS fix. Please select a preset farm zone below.'
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Handler when user clicks on map to inspect a specific spot
  const handleMapClick = (lat: number, lon: number) => {
    setCoords({
      lat,
      lon,
      label: `Pinned Point (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      isLiveGps: false,
    });
  };

  const currentTrendList =
    timeframe === '2weeks'
      ? satelliteData.timeframeTrends.twoWeeks.map((t) => ({
          label: t.week,
          value: `${Math.round(t.ndvi * 100)}/100 (NDVI: ${t.ndvi})`,
        }))
      : timeframe === 'season'
      ? satelliteData.timeframeTrends.fullSeason.map((t) => ({
          label: t.month,
          value: `${Math.round(t.ndvi * 100)}/100 (NDVI: ${t.ndvi})`,
        }))
      : satelliteData.timeframeTrends.fourWeeks.map((t) => ({
          label: t.week,
          value: `${Math.round(t.ndvi * 100)}/100 (NDVI: ${t.ndvi})`,
        }));

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <Satellite className="w-5 h-5 text-krishi-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Crop Health (Live Satellite)
              </h1>
              {coords.isLiveGps && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Live GPS
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              ArcGIS High-Res Orbit Tiles & Sentinel-2 Multispectral monitoring for {farm.name} ({coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Live GPS Button */}
            <button
              onClick={handleUseLiveLocation}
              disabled={isLocating}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                coords.isLiveGps
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                  : 'bg-krishi-700 hover:bg-krishi-800 text-white shadow-krishi-700/20'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Acquiring GPS...' : coords.isLiveGps ? '📍 Live GPS Active' : '📍 Use Live GPS'}</span>
            </button>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-earth-100 p-1 rounded-xl text-xs font-bold text-gray-700">
              <button
                onClick={() => setTimeframe('2weeks')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  timeframe === '2weeks' ? 'bg-white text-krishi-900 shadow-xs' : 'hover:text-gray-900'
                }`}
              >
                2 Weeks
              </button>
              <button
                onClick={() => setTimeframe('4weeks')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  timeframe === '4weeks' ? 'bg-white text-krishi-900 shadow-xs' : 'hover:text-gray-900'
                }`}
              >
                4 Weeks
              </button>
              <button
                onClick={() => setTimeframe('season')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  timeframe === 'season' ? 'bg-white text-krishi-900 shadow-xs' : 'hover:text-gray-900'
                }`}
              >
                Season
              </button>
            </div>

            <Button
              onClick={() => loadSatelliteData()}
              variant="outline"
              size="sm"
              disabled={refreshing}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            >
              {refreshing ? 'Syncing...' : 'Sync'}
            </Button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Geolocation Notice / Preset Agricultural Hubs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-earth-200 text-xs shadow-xs">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <MapPin className="w-4 h-4 text-krishi-600 shrink-0" />
              <span>
                Active Target: <strong className="text-gray-900">{coords.label}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-gray-400 text-[11px] font-semibold uppercase mr-1">Agricultural Hubs:</span>
              {PRESET_FARM_ZONES.map((zone) => (
                <button
                  key={zone.name}
                  onClick={() =>
                    setCoords({
                      lat: zone.lat,
                      lon: zone.lon,
                      label: `${zone.name} (${zone.crop})`,
                      isLiveGps: false,
                    })
                  }
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    coords.lat === zone.lat && coords.lon === zone.lon
                      ? 'bg-krishi-700 text-white'
                      : 'bg-earth-100 text-gray-700 hover:bg-earth-200'
                  }`}
                >
                  {zone.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {gpsError && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Interactive Real Satellite Map Canvas */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Live Space Orbit Satellite Map (Click to scout any farm)</span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-500">
                    {satelliteData.lastUpdated}
                  </span>
                </div>

                {/* Layer Mode Switcher */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 bg-earth-100 p-1 rounded-xl text-xs font-semibold text-gray-700 w-full sm:w-auto">
                    <button
                      onClick={() => setLayerMode('true_color')}
                      className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                        layerMode === 'true_color'
                          ? 'bg-white text-gray-900 shadow-xs font-bold'
                          : 'hover:text-gray-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>True Color (Natural)</span>
                    </button>
                    <button
                      onClick={() => setLayerMode('ndvi_spectrum')}
                      className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                        layerMode === 'ndvi_spectrum'
                          ? 'bg-white text-emerald-800 shadow-xs font-bold'
                          : 'hover:text-gray-900'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      <span>NDVI Spectrum</span>
                    </button>
                    <button
                      onClick={() => setLayerMode('moisture_ndwi')}
                      className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                        layerMode === 'moisture_ndwi'
                          ? 'bg-white text-cyan-800 shadow-xs font-bold'
                          : 'hover:text-gray-900'
                      }`}
                    >
                      <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                      <span>NDWI Moisture</span>
                    </button>
                  </div>
                </div>

                {/* Real Interactive Leaflet Satellite Container */}
                <div className="relative rounded-2xl overflow-hidden border-2 border-earth-300 shadow-inner h-84 sm:h-[420px] bg-gray-900">
                  <RealSatelliteMap
                    latitude={coords.lat}
                    longitude={coords.lon}
                    fieldBoundary={satelliteData.fieldBoundary}
                    layerMode={layerMode}
                    ndviScore={satelliteData.ndviScore}
                    onMapClick={handleMapClick}
                    cropName={farm.crop?.name || 'Farm Field'}
                  />

                  {/* Satellite Info Pill */}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md rounded-lg px-2.5 py-1 text-white text-[11px] font-medium border border-white/10 z-[1000] pointer-events-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Esri Maxar 0.5m Orbit</span>
                  </div>
                </div>

                {/* Map Footer Info */}
                <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-500 pt-2 border-t border-earth-100 gap-1">
                  <span>
                    Lat: <strong className="text-gray-700">{coords.lat.toFixed(5)}°N</strong> • Lon: <strong className="text-gray-700">{coords.lon.toFixed(5)}°E</strong>
                  </span>
                  <span>Sensor: {satelliteData.satelliteProvider}</span>
                </div>
              </Card>
            </div>

            {/* Right: Health Metrics & AI Insight */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-6 bg-gradient-to-br from-white to-krishi-50/30">
                <div className="flex items-center justify-between pb-4 border-b border-earth-100 mb-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Overall Crop Health
                    </h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl font-black text-gray-900">{satelliteData.healthScore}</span>
                      <span className="text-lg font-bold text-gray-400">/ 100</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        satelliteData.vegetationStatus === 'Good'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : satelliteData.vegetationStatus === 'Fair'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{satelliteData.vegetationStatus} Vigor</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Resolution: {satelliteData.resolutionMeters}m</p>
                  </div>
                </div>

                {/* Dynamic Scientific Indices Matrix */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">NDVI Index</span>
                      <Activity className="w-3.5 h-3.5 text-krishi-600" />
                    </div>
                    <strong className="text-lg font-black text-krishi-800 block mt-0.5">
                      {satelliteData.ndviScore}
                    </strong>
                    <span className="text-[10px] text-emerald-700 block font-semibold">
                      {satelliteData.ndviScore >= 0.7
                        ? 'High Vegetative Density'
                        : satelliteData.ndviScore >= 0.5
                        ? 'Moderate Canopy Density'
                        : 'Sparse / Stressed Canopy'}
                    </span>
                  </div>

                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">EVI (Enhanced)</span>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <strong className="text-lg font-black text-gray-900 block mt-0.5">
                      {satelliteData.eviScore || 0.65}
                    </strong>
                    <span className="text-[10px] text-gray-500 block">Atmosphere-calibrated</span>
                  </div>

                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">NDWI Water Index</span>
                      <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                    </div>
                    <strong className="text-lg font-black text-cyan-800 block mt-0.5">
                      {satelliteData.ndwiScore || 0.33}
                    </strong>
                    <span className="text-[10px] text-cyan-700 block font-medium">Canopy Hydration Level</span>
                  </div>

                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">Soil Moisture (0-7cm)</span>
                      <span className="text-xs font-bold text-gray-700">Live</span>
                    </div>
                    <strong className="text-lg font-black text-gray-900 block mt-0.5">
                      {satelliteData.rawSoilMoisturePercentage || 38}%
                    </strong>
                    <span className="text-[10px] text-gray-500 block">Volumetric soil layer</span>
                  </div>
                </div>

                {/* AI Insight Box matching Design */}
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>AI Satellite Insight</span>
                  </div>
                  <p className="text-sm text-amber-950 leading-relaxed font-medium">
                    "{satelliteData.stressDetails.probableCause} detected on {satelliteData.stressDetails.zone}."
                  </p>
                  <Button
                    onClick={() => setRecommendationModal(true)}
                    variant="primary"
                    size="md"
                    fullWidth
                    className="bg-amber-800 hover:bg-amber-900 text-white shadow-xs"
                  >
                    Get Agronomist Recommendation
                  </Button>
                </div>
              </Card>

              {/* Historical Crop Health Timeline */}
              <Card className="p-5">
                <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-krishi-700" />
                    <span>NDVI Progression ({timeframe})</span>
                  </div>
                  <span className="text-xs font-normal text-gray-500">Sentinel-2 Orbit Pass</span>
                </h4>
                <div className="space-y-2.5 text-xs">
                  {currentTrendList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-1.5 border-b border-earth-100 last:border-0"
                    >
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-bold text-krishi-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNav />

      {/* Recommendation Modal */}
      <Modal
        isOpen={recommendationModal}
        onClose={() => setRecommendationModal(false)}
        title="Agronomist Recommendation for Stress Zone"
      >
        <div className="space-y-4 text-sm text-gray-700">
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900">Detected Zone: {satelliteData.stressDetails.zone}</h4>
            <p className="text-xs text-amber-800 mt-1">
              Affecting approximately {satelliteData.stressDetails.areaPercentage}% of your total field acreage.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
              Immediate Mitigation Steps:
            </h5>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
                <strong>1. {satelliteData.stressDetails.recommendedAction}</strong>
                <p className="text-gray-600 mt-0.5">Ensure even pressure across all emitter lines along the boundary.</p>
              </div>
              <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
                <strong>2. Foliar Micronutrient Boost</strong>
                <p className="text-gray-600 mt-0.5">Apply 19:19:19 soluble NPK @ 5g/L during early morning hours.</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => setRecommendationModal(false)}
              variant="primary"
              size="md"
              fullWidth
            >
              Acknowledge & Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
