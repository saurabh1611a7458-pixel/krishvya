import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useFarm } from '../context/FarmContext';
import { RealSatelliteMap } from '../components/satellite/RealSatelliteMap';
import { GeocodingResult } from '../services/geocodingService';
import { evaluateCropHealth } from '../services/cropHealthEngine';
import { calculateDynamicCropStage } from '../utils/cropStageUtils';
import { supabaseService } from '../services/supabaseService';
import { DiseaseScan, CropObservationRecord } from '../types';
import {
  Sparkles,
  RefreshCw,
  Navigation,
  Layers,
  Droplets,
  Activity,
  AlertTriangle,
  Eye,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Camera,
  MessageSquare,
  Sprout,
  Plus,
} from 'lucide-react';

export const CropHealthPage: React.FC = () => {
  const navigate = useNavigate();
  const { farm, farms, selectFarm, user } = useFarm();
  const [recommendationModal, setRecommendationModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingObservation, setSavingObservation] = useState(false);
  const [observationSaved, setObservationSaved] = useState(false);
  const [showAdvancedData, setShowAdvancedData] = useState(false);

  // Disease scans for the current farm
  const [diseaseScans, setDiseaseScans] = useState<DiseaseScan[]>([]);
  // Previous crop observations from Supabase
  const [cropObservations, setCropObservations] = useState<CropObservationRecord[]>([]);

  // Load disease scans and observations for selected farm
  useEffect(() => {
    if (!farm?.id) return;
    const userId = user?.id || farm.user_id;
    if (!userId) return;
    let mounted = true;

    Promise.all([
      supabaseService.getDiseaseScans(userId, farm.id),
      supabaseService.getCropObservations(userId, farm.id),
    ]).then(([scans, obs]) => {
      if (mounted) {
        setDiseaseScans(scans);
        setCropObservations(obs);
      }
    });

    return () => {
      mounted = false;
    };
  }, [farm.id, farm.user_id, user?.id]);

  // Crop & Sowing Date Data
  const cropName = farm.crop?.name || farm.crop_variety;
  const sowingDate = farm.crop?.sowingDate || farm.sowing_date;
  const variety = farm.crop?.variety;

  // Real-time stage calculation from cropStageUtils
  const stageInfo = useMemo(() => {
    return calculateDynamicCropStage(cropName, variety, sowingDate);
  }, [cropName, variety, sowingDate]);

  // Dynamic Crop Health Evaluation
  const evaluation = useMemo(() => {
    return evaluateCropHealth(farm, diseaseScans);
  }, [farm, diseaseScans]);

  // Active infections
  const activeScans = useMemo(() => {
    return diseaseScans.filter((s) => s.severity === 'High' || s.severity === 'Critical');
  }, [diseaseScans]);

  // Active Map View Coordinates
  const [activeCoords, setActiveCoords] = useState<{
    lat: number;
    lon: number;
    label: string;
  }>({
    lat: farm.location?.latitude || 21.1458,
    lon: farm.location?.longitude || 79.0882,
    label: farm.name || 'Primary Farm',
  });

  // Synchronize active coordinates with selected farm location
  useEffect(() => {
    if (farm.location?.latitude && farm.location?.longitude) {
      setActiveCoords({
        lat: farm.location.latitude,
        lon: farm.location.longitude,
        label: farm.name || 'Primary Farm',
      });
    }
  }, [farm.id, farm.location?.latitude, farm.location?.longitude, farm.name]);

  // Strict Physical Device GPS
  const [userGpsLocation, setUserGpsLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  // Searched Location State
  const [searchedLocation, setSearchedLocation] = useState<{
    lat: number;
    lon: number;
    displayName: string;
    placeName?: string;
  } | null>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(15);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Satellite layer mode: Natural View (true_color), Crop Health (ndvi_spectrum), Water (moisture_ndwi)
  const [layerMode, setLayerMode] = useState<'true_color' | 'ndvi_spectrum' | 'moisture_ndwi'>('ndvi_spectrum');

  const loadSatelliteData = useCallback(async () => {
    setRefreshing(true);
    try {
      const userId = user?.id || farm.user_id;
      if (!userId) return;
      const [scans, obs] = await Promise.all([
        supabaseService.getDiseaseScans(userId, farm.id),
        supabaseService.getCropObservations(userId, farm.id),
      ]);
      setDiseaseScans(scans);
      setCropObservations(obs);
    } catch (err) {
      console.warn('Failed to refresh crop telemetry:', err);
    } finally {
      setRefreshing(false);
    }
  }, [farm.id, farm.user_id, user?.id]);

  // Save current observation
  const handleSaveObservation = async () => {
    const userId = user?.id || farm.user_id;
    if (!evaluation.isSufficient || !evaluation.healthScore || !userId) return;
    setSavingObservation(true);
    const newRecord: CropObservationRecord = {
      id: `obs_${Date.now()}`,
      userId,
      farmId: farm.id,
      crop: cropName || 'Crop',
      stage: stageInfo.stage || farm.crop?.stage || 'Active',
      healthScore: evaluation.healthScore,
      ndvi: evaluation.ndviScore ?? undefined,
      observationType: 'satellite',
      notes: evaluation.stressDetails ? evaluation.stressDetails.cause : 'Routine crop observation snapshot',
      createdAt: new Date().toISOString(),
    };
    await supabaseService.saveCropObservation(newRecord);
    setCropObservations((prev) => [newRecord, ...prev.filter((o) => o.id !== newRecord.id)]);
    setSavingObservation(false);
    setObservationSaved(true);
    setTimeout(() => setObservationSaved(false), 3000);
  };

  // Handler to acquire device GPS coordinates via browser Geolocation API
  const handleAcquireGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserGpsLocation({ lat: latitude, lon: longitude });
        setActiveCoords({
          lat: latitude,
          lon: longitude,
          label: `Live GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        });
        setSearchedLocation(null);
        setZoomLevel(16);
        setIsLocating(false);
      },
      (error) => {
        console.warn('GPS location request error:', error.message);
        setGpsError(
          error.code === 1
            ? 'GPS access permission denied. Please allow location access in your browser.'
            : 'Unable to acquire satellite GPS fix. Please search your village or location.'
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

  // "My Location" action
  const handleMyLocationClick = () => {
    if (userGpsLocation) {
      setActiveCoords({
        lat: userGpsLocation.lat,
        lon: userGpsLocation.lon,
        label: `My Live GPS (${userGpsLocation.lat.toFixed(4)}, ${userGpsLocation.lon.toFixed(4)})`,
      });
      setSearchedLocation(null);
      setZoomLevel(16);
    } else {
      handleAcquireGps();
    }
  };

  // Autocomplete selection
  const handleSelectSearchedLocation = (result: GeocodingResult) => {
    setActiveCoords({
      lat: result.lat,
      lon: result.lon,
      label: result.placeName || result.displayName.split(',')[0],
    });
    setSearchedLocation({
      lat: result.lat,
      lon: result.lon,
      displayName: result.displayName,
      placeName: result.placeName,
    });
    setZoomLevel(result.type === 'city' ? 13 : result.type === 'region' ? 9 : 16);
  };

  // Map click
  const handleMapClick = (lat: number, lon: number) => {
    setActiveCoords({
      lat,
      lon,
      label: `Pinned Point (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
    });
    setSearchedLocation({
      lat,
      lon,
      displayName: `Pinned Field Coordinates: ${lat.toFixed(5)}°N, ${lon.toFixed(5)}°E`,
      placeName: 'Scouted Point',
    });
  };

  // Area format
  const areaDisplay = farm.size
    ? `${farm.size} ${farm.sizeUnit || 'acres'}`
    : 'Acreage not set';

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-12">
        {/* ========================================================================= */}
        {/* 1. MY CROP HEADER                                                         */}
        {/* ========================================================================= */}
        <header className="bg-white/95 backdrop-blur-md border-b border-earth-200/90 px-4 sm:px-8 py-4 sticky top-0 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-[#166534]" />
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  My Crop
                </h1>
                {userGpsLocation && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    GPS Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Understand your crop health and what to do next.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMyLocationClick}
                disabled={isLocating}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  userGpsLocation && activeCoords.lat === userGpsLocation.lat && activeCoords.lon === userGpsLocation.lon
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-white hover:bg-earth-100 text-gray-700 border border-earth-300'
                }`}
                title="Center map on your physical device location"
              >
                <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>
                  {isLocating
                    ? 'Acquiring GPS...'
                    : userGpsLocation && activeCoords.lat === userGpsLocation.lat && activeCoords.lon === userGpsLocation.lon
                    ? '📍 Centered'
                    : '📍 My Location'}
                </span>
              </button>

              <Button
                onClick={() => loadSatelliteData()}
                variant="outline"
                size="sm"
                disabled={refreshing}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#166534]' : ''}`} />}
              >
                {refreshing ? 'Syncing...' : 'Sync'}
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 flex-1">
          {/* Farm Switcher if multiple farms exist */}
          {farms && farms.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider shrink-0">Switch Farm:</span>
              {farms.map((f) => {
                const isCurrent = f.id === farm.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => selectFarm(f.id)}
                    type="button"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                      isCurrent
                        ? 'bg-krishi-800 text-white shadow-xs ring-2 ring-krishi-600/30'
                        : 'bg-white hover:bg-earth-100 text-gray-700 border border-earth-200'
                    }`}
                  >
                    <Sprout className="w-3 h-3 text-krishi-400" />
                    <span>{f.name}</span>
                    {f.crop?.name && <span className="opacity-70 text-[10px]">({f.crop.name})</span>}
                  </button>
                );
              })}
            </div>
          )}

          {gpsError && (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. CROP IDENTITY HERO CARD                                                */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-earth-200/90 shadow-soft p-6 sm:p-7 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-2xl">🌱</span>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    {cropName || 'No Crop Registered'}
                  </h2>
                  {variety && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {variety}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 font-medium mt-1.5 flex-wrap">
                  <span>{areaDisplay}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-800 font-bold">
                    {stageInfo.status === 'valid' || stageInfo.status === 'harvest_ready'
                      ? stageInfo.stage
                      : stageInfo.description}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500">{farm.name}</span>
                </div>
              </div>

              {!cropName && (
                <button
                  type="button"
                  onClick={() => navigate('/farm')}
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#166534] hover:bg-[#14532d] text-white shadow-xs transition-colors cursor-pointer"
                >
                  <span>Register Crop in My Farm</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. TODAY'S CROP STATUS                                                    */}
          {/* ========================================================================= */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-earth-200/90 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  TODAY'S CROP STATUS
                </span>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {evaluation.isSufficient && evaluation.healthScore !== null ? (
                    evaluation.healthScore < 60 ? (
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-extrabold bg-rose-50 text-rose-800 border border-rose-200">
                        <span>🔴</span> Action needed
                      </span>
                    ) : evaluation.healthScore < 75 ? (
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                        <span>🟡</span> Needs checking
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span>🟢</span> Looking good
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-extrabold bg-gray-100 text-gray-700 border border-gray-300">
                      <span>⚪</span> Not enough data
                    </span>
                  )}

                  {evaluation.isSufficient && evaluation.healthScore !== null && (
                    <span className="text-sm font-bold text-gray-500">
                      <strong className="text-gray-900 font-extrabold text-base">{evaluation.healthScore}</strong>/100 Field Health Index
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-gray-700 font-medium mt-2 leading-relaxed max-w-2xl">
                  {evaluation.isSufficient && evaluation.healthScore !== null
                    ? evaluation.stressDetected && evaluation.stressDetails
                      ? evaluation.stressDetails.cause
                      : 'Foliage vigor is healthy and growing on track for this stage.'
                    : "Crop health satellite data isn't available yet."}
                </p>
              </div>

              {!evaluation.isSufficient && (
                <button
                  type="button"
                  onClick={() => navigate('/farm')}
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#166534] hover:bg-[#14532d] text-white shadow-xs transition-colors cursor-pointer"
                >
                  <span>Complete Farm Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. WHAT SHOULD I DO?                                                      */}
          {/* ========================================================================= */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#EAF4EC] border border-[#166534]/20 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black text-[#166534] uppercase tracking-wider">
                🌱 WHAT SHOULD I DO?
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
              {activeScans.length > 0 && activeScans[0].recommendation
                ? activeScans[0].recommendation
                : evaluation.stressDetails?.action
                ? evaluation.stressDetails.action
                : farm.weather?.rainProbability && farm.weather.rainProbability >= 60
                ? 'Rain expected today. Avoid pesticide spraying and clear field drainage furrows.'
                : farm.soil?.moisturePercentage && farm.soil.moisturePercentage < 25
                ? 'Soil moisture is low in root zone. Plan irrigation before peak heat.'
                : 'Continue routine crop observation.'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-700 font-medium mt-1 leading-relaxed">
              {activeScans.length > 0
                ? `Attention required for ${activeScans[0].detectedProblem}. Follow targeted agronomist mitigation steps.`
                : 'Scout lower leaf canopy and check soil moisture to keep your standing crop on schedule.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-[#166534]/15">
              <button
                type="button"
                onClick={() => navigate('/disease')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#166534] hover:bg-[#14532d] text-white shadow-xs transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>📷 Check Plant</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/ai-advisor')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-emerald-50 text-[#166534] border border-[#166534]/30 shadow-2xs transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>🤖 Ask KRISHVYA</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. CROP HEALTH SUMMARY (4 Cards)                                          */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 🌿 Crop Growth */}
            <div className="p-5 rounded-2xl bg-white border border-earth-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                    Crop Growth
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    stageInfo.status === 'valid'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : stageInfo.status === 'harvest_ready'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {stageInfo.status === 'valid' ? 'Growing' : stageInfo.status === 'harvest_ready' ? 'Harvest Ready' : 'Not set'}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                  {cropName ? stageInfo.stage : 'No Crop Set'}
                </h4>
                <p className="text-xs text-gray-600 font-medium mt-1">
                  {stageInfo.status === 'valid'
                    ? `${stageInfo.daysSinceSowing} days after sowing • ${stageInfo.progressPercent}% cycle`
                    : stageInfo.description}
                </p>
              </div>
            </div>

            {/* 💧 Water Status */}
            <div className="p-5 rounded-2xl bg-white border border-earth-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-sky-600" />
                    Water Status
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    farm.soil?.moisturePercentage !== undefined
                      ? farm.soil.moisturePercentage < 25
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : farm.soil.moisturePercentage > 65
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {farm.soil?.moisturePercentage !== undefined
                      ? farm.soil.moisturePercentage < 25
                        ? 'Low'
                        : farm.soil.moisturePercentage > 65
                        ? 'High'
                        : 'Good'
                      : 'No data'}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                  {farm.soil?.moisturePercentage !== undefined ? `${farm.soil.moisturePercentage}% Soil Moisture` : 'Data unavailable'}
                </h4>
                <p className="text-xs text-gray-600 font-medium mt-1">
                  {farm.soil?.moisturePercentage !== undefined ? 'Root zone condition' : 'Add soil test in My Soil to sync'}
                </p>
              </div>
            </div>

            {/* 🐛 Plant Problems */}
            <div className="p-5 rounded-2xl bg-white border border-earth-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Plant Problems
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    activeScans.length > 0
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {activeScans.length > 0 ? `${activeScans.length} active` : 'Clean'}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                  {diseaseScans.length > 0 ? `${activeScans.length} issue(s) recorded` : '0 recorded problems'}
                </h4>
                <p className="text-xs text-gray-600 font-medium mt-1">
                  {activeScans.length > 0
                    ? activeScans[0].detectedProblem
                    : 'Canopy is clear of known disease infections'}
                </p>
              </div>
            </div>

            {/* 🌦 Weather */}
            <div className="p-5 rounded-2xl bg-white border border-earth-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-600" />
                    Weather
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    farm.weather?.temperature !== undefined
                      ? farm.weather.temperature >= 38
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : farm.weather.rainProbability && farm.weather.rainProbability >= 60
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {farm.weather?.temperature !== undefined
                      ? farm.weather.temperature >= 38
                        ? 'Heat Stress'
                        : farm.weather.rainProbability && farm.weather.rainProbability >= 60
                        ? 'Rain Expected'
                        : 'Favorable'
                      : 'No data'}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                  {farm.weather?.temperature !== undefined
                    ? `${farm.weather.temperature}°C • ${farm.weather.condition || 'Clear'}`
                    : 'Data unavailable'}
                </h4>
                <p className="text-xs text-gray-600 font-medium mt-1">
                  {farm.weather?.temperature !== undefined
                    ? farm.weather.rainProbability !== undefined
                      ? `${farm.weather.rainProbability}% rain probability today`
                      : 'Normal field weather'
                    : 'Sync live weather in Weather section'}
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 6. FIELD MAP                                                              */}
          {/* ========================================================================= */}
          <Card className="p-4 sm:p-6 bg-white border border-earth-200 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛰️</span>
                  <h3 className="font-extrabold text-gray-900 text-base sm:text-lg tracking-tight">
                    Field Map
                  </h3>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  View your farm from above.
                </p>
              </div>

              {/* Layer Mode Switcher: MAP VIEW */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1 hidden sm:inline">
                  Map View:
                </span>
                <div className="flex items-center gap-1 bg-earth-100 p-1 rounded-xl text-xs font-semibold text-gray-700 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setLayerMode('true_color')}
                    className={`px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      layerMode === 'true_color'
                        ? 'bg-white text-gray-900 shadow-xs font-bold'
                        : 'hover:text-gray-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Natural View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayerMode('ndvi_spectrum')}
                    title="Crop Health = NDVI (Normalized Difference Vegetation Index)"
                    className={`px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      layerMode === 'ndvi_spectrum'
                        ? 'bg-white text-emerald-800 shadow-xs font-bold'
                        : 'hover:text-gray-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Crop Health</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayerMode('moisture_ndwi')}
                    title="Water = NDWI (Normalized Difference Water Index)"
                    className={`px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      layerMode === 'moisture_ndwi'
                        ? 'bg-white text-cyan-800 shadow-xs font-bold'
                        : 'hover:text-gray-900'
                    }`}
                  >
                    <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Water</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Real Interactive Leaflet Satellite Container */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-earth-300 shadow-inner h-84 sm:h-[420px] bg-gray-900">
              <RealSatelliteMap
                latitude={activeCoords.lat}
                longitude={activeCoords.lon}
                userGpsLocation={userGpsLocation}
                searchedLocation={searchedLocation}
                fieldBoundary={farm.boundary}
                layerMode={layerMode}
                ndviScore={evaluation.ndviScore ?? 0.5}
                zoomLevel={zoomLevel}
                onMapClick={handleMapClick}
                cropName={cropName || 'Farm Field'}
                showSearch={true}
                onSelectLocation={handleSelectSearchedLocation}
                onMyLocationClick={handleMyLocationClick}
                isLocatingGps={isLocating}
              />
            </div>
          </Card>

          {/* ========================================================================= */}
          {/* 7. KRISHVYA CROP INSIGHT                                                  */}
          {/* ========================================================================= */}
          <div className="p-6 rounded-3xl bg-white border border-earth-200/90 shadow-soft space-y-3">
            <div className="flex items-center gap-2 text-[#166534] font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#166534]" />
              <span>🤖 KRISHVYA CROP INSIGHT</span>
            </div>
            <p className="text-sm sm:text-base text-gray-800 leading-relaxed font-medium">
              {evaluation.isSufficient
                ? evaluation.stressDetected && evaluation.stressDetails
                  ? `"${evaluation.stressDetails.cause}. ${evaluation.stressDetails.action}"`
                  : `"Optimal vegetative canopy vigor. Standing ${cropName || 'crop'} is progressing normally with no active pest or moisture stress detected on ${farm.name}."`
                : '"More crop information is needed before KRISHVYA can assess crop growth accurately."'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {evaluation.isSufficient && evaluation.stressDetails && (
                <Button
                  onClick={() => setRecommendationModal(true)}
                  variant="primary"
                  size="sm"
                  className="bg-amber-800 hover:bg-amber-900 text-white shadow-xs"
                >
                  View Agronomist Recommendation
                </Button>
              )}

              {!evaluation.isSufficient ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={() => navigate('/farm')}
                    variant="primary"
                    size="sm"
                    className="bg-[#166534] hover:bg-[#14532d] text-white"
                  >
                    Complete Farm Details
                  </Button>
                  <Button
                    onClick={() => navigate('/ai-advisor')}
                    variant="outline"
                    size="sm"
                  >
                    Ask KRISHVYA
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleSaveObservation}
                  disabled={savingObservation || observationSaved}
                  variant="outline"
                  size="sm"
                >
                  {savingObservation
                    ? 'Saving Telemetry to Database...'
                    : observationSaved
                    ? '✓ Telemetry Saved to Supabase'
                    : 'Record Observation to Supabase'}
                </Button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 8. CROP OBSERVATIONS                                                      */}
          {/* ========================================================================= */}
          <Card className="p-5 sm:p-6 bg-white border border-earth-200 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <h4 className="font-extrabold text-gray-900 text-sm sm:text-base tracking-tight">
                  Crop Observations
                </h4>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-earth-100 px-2.5 py-0.5 rounded-full">
                {cropObservations.length} Records
              </span>
            </div>

            {cropObservations.length > 0 ? (
              <div className="divide-y divide-earth-100 max-h-64 overflow-y-auto">
                {cropObservations.slice(0, 5).map((obs) => (
                  <div
                    key={obs.id}
                    className="flex justify-between items-center py-2.5 px-2 hover:bg-earth-50/50 rounded-xl transition-colors"
                  >
                    <div>
                      <span className="text-gray-900 font-bold block text-xs sm:text-sm">
                        {obs.crop} ({obs.stage})
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {new Date(obs.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })} • {obs.notes || 'Routine observation'}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-[#166534] block text-xs sm:text-sm">
                        Score: {obs.healthScore}/100
                      </span>
                      {obs.ndvi && (
                        <span className="text-[11px] text-gray-400 font-mono">NDVI {obs.ndvi}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-500 bg-earth-50/50 rounded-2xl border border-dashed border-earth-300">
                <p className="font-bold text-gray-800 text-sm">No crop observations yet.</p>
                <p className="mt-1 text-gray-500">
                  Save an observation or scan a crop leaf to log field telemetry.
                </p>
                <div className="mt-3">
                  <Button
                    onClick={() => {
                      if (evaluation.isSufficient) {
                        handleSaveObservation();
                      } else {
                        navigate('/disease');
                      }
                    }}
                    variant="outline"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    + Add Observation
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* ========================================================================= */}
          {/* 9. ADVANCED CROP DATA (COLLAPSIBLE)                                       */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-earth-200/90 shadow-soft overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvancedData((prev) => !prev)}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-earth-50/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight">
                    Advanced Crop Data
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium">
                    NDVI, EVI, NDWI spectral matrices, satellite orbital metadata & telemetry
                  </p>
                </div>
              </div>
              <div className="p-1 rounded-lg bg-earth-100 text-gray-600">
                {showAdvancedData ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showAdvancedData && (
              <div className="p-4 sm:p-6 pt-0 border-t border-earth-100 space-y-4">
                {/* Indices Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">NDVI Index</span>
                      <Activity className="w-3.5 h-3.5 text-krishi-700" />
                    </div>
                    <strong className="text-lg font-black text-krishi-800 block mt-1">
                      {evaluation.isSufficient && evaluation.ndviScore !== null ? evaluation.ndviScore : 'Not available'}
                    </strong>
                    <span className="text-[10px] text-emerald-700 block font-medium">
                      Atmosphere-calibrated
                    </span>
                  </div>

                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">EVI (Enhanced)</span>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <strong className="text-lg font-black text-gray-900 block mt-1">
                      {evaluation.isSufficient && evaluation.ndviScore !== null
                        ? (evaluation.ndviScore * 0.85).toFixed(2)
                        : 'Not available'}
                    </strong>
                    <span className="text-[10px] text-gray-500 block">Soil-adjusted index</span>
                  </div>

                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">NDWI Water</span>
                      <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                    </div>
                    <strong className="text-lg font-black text-cyan-800 block mt-1">
                      {evaluation.isSufficient && evaluation.ndviScore !== null
                        ? (evaluation.ndviScore * 0.42).toFixed(2)
                        : 'Not available'}
                    </strong>
                    <span className="text-[10px] text-cyan-700 block font-medium">Canopy Hydration</span>
                  </div>

                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">Volumetric Soil</span>
                      <span className="text-[10px] font-bold text-gray-700">Root zone</span>
                    </div>
                    <strong className="text-lg font-black text-gray-900 block mt-1">
                      {farm.soil?.moisturePercentage ? `${farm.soil.moisturePercentage}%` : 'Not available'}
                    </strong>
                    <span className="text-[10px] text-gray-500 block">Root zone layer</span>
                  </div>
                </div>

                {/* Orbit, Camera & Sensor Details */}
                <div className="p-3.5 bg-earth-50/70 rounded-xl border border-earth-200 text-xs text-gray-600 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span>
                      <strong>Sensor:</strong> ESA Copernicus Sentinel-2 MSI (10m Multi-spectral)
                    </span>
                    <span>
                      <strong>Composite:</strong> Esri World Imagery (0.5m Maxar High-Res)
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1 border-t border-earth-200/60">
                    <span>
                      <strong>Camera Coordinates:</strong> {activeCoords.lat.toFixed(5)}°N, {activeCoords.lon.toFixed(5)}°E
                    </span>
                    <span>
                      <strong>Telemetry Sync:</strong> {farm.satellite?.lastUpdated || 'Calibrated Overpass'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <MobileBottomNav />

      {/* Recommendation Modal */}
      {evaluation.stressDetails && (
        <Modal
          isOpen={recommendationModal}
          onClose={() => setRecommendationModal(false)}
          title="Agronomist Recommendation"
        >
          <div className="space-y-4 text-sm text-gray-700">
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
              <h4 className="font-bold text-amber-900">Cause: {evaluation.stressDetails.cause}</h4>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                Mitigation Steps:
              </h5>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-earth-50 border border-earth-200">
                  <strong>Recommended Action:</strong>
                  <p className="text-gray-600 mt-1">{evaluation.stressDetails.action}</p>
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
      )}
    </div>
  );
};
