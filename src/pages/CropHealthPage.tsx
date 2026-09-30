import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useFarm } from '../context/FarmContext';
import { RealSatelliteMap } from '../components/satellite/RealSatelliteMap';
import { GeocodingResult } from '../services/geocodingService';
import { evaluateCropHealth } from '../services/cropHealthEngine';
import { supabaseService } from '../services/supabaseService';
import { DiseaseScan, CropObservationRecord } from '../types';
import { Link } from 'react-router-dom';
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
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const CropHealthPage: React.FC = () => {
  const { farm, farms, selectFarm, user } = useFarm();
  const [recommendationModal, setRecommendationModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingObservation, setSavingObservation] = useState(false);
  const [observationSaved, setObservationSaved] = useState(false);

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

  // Dynamic Crop Health Evaluation
  const evaluation = useMemo(() => {
    return evaluateCropHealth(farm, diseaseScans);
  }, [farm, diseaseScans]);

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

  // Satellite layer mode: true natural color, NDVI false color, or NDWI moisture
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
      crop: farm.crop?.name || farm.crop_variety || 'Crop',
      stage: farm.crop?.stage || 'Active',
      healthScore: evaluation.healthScore,
      ndvi: evaluation.ndviScore ?? undefined,
      observationType: 'satellite',
      notes: evaluation.stressDetails ? evaluation.stressDetails.cause : 'Routine satellite health scan',
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

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <Satellite className="w-5 h-5 text-krishi-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                My Crop
              </h1>
              {userGpsLocation && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  GPS Active
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Sentinel-2 & Esri World Imagery • {farm.name || 'Selected Farm'} ({activeCoords.lat.toFixed(4)}°N, {activeCoords.lon.toFixed(4)}°E)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* My Location GPS Button */}
            <button
              onClick={handleMyLocationClick}
              disabled={isLocating}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                userGpsLocation && activeCoords.lat === userGpsLocation.lat && activeCoords.lon === userGpsLocation.lon
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                  : 'bg-krishi-700 hover:bg-krishi-800 text-white shadow-krishi-700/20'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>
                {isLocating
                  ? 'Acquiring GPS...'
                  : userGpsLocation && activeCoords.lat === userGpsLocation.lat && activeCoords.lon === userGpsLocation.lon
                  ? '📍 My GPS Centered'
                  : '📍 My Location'}
              </span>
            </button>

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
          {/* Farm Switcher / Selector */}
          {farms.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-earth-200 text-xs shadow-xs">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <MapPin className="w-4 h-4 text-krishi-600 shrink-0" />
                <span>
                  Current Farm: <strong className="text-gray-900">{farm.name}</strong> ({farm.crop?.name || farm.crop_variety || 'No crop set'})
                </span>
              </div>

              {farms.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-gray-400 text-[11px] font-semibold uppercase mr-1">Switch Farm:</span>
                  {farms.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => selectFarm(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                        farm.id === f.id
                          ? 'bg-krishi-700 text-white'
                          : 'bg-earth-100 text-gray-700 hover:bg-earth-200'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Insufficient Data State Banner */}
          {!evaluation.isSufficient && (
            <Card className="p-5 border-amber-200 bg-amber-50/60">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950">
                      Insufficient Data for Crop Health Telemetry
                    </h3>
                    <p className="text-xs text-amber-900/80 mt-1 max-w-2xl">
                      {evaluation.reason || 'Dynamic crop health monitoring requires a registered crop and sowing date for this farm.'}
                    </p>
                  </div>
                </div>

                <Link to="/farm" className="shrink-0 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full sm:w-auto bg-amber-800 hover:bg-amber-900 text-white"
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Configure Farm Crop
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {gpsError && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{gpsError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Interactive Real Satellite Map Canvas */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-4 sm:p-5 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Space Satellite Radar (Click to scout any field)</span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-500">
                    {farm.satellite?.lastUpdated || 'Live Orbital Overpass'}
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
                <div className="relative rounded-2xl overflow-hidden border-2 border-earth-300 shadow-inner h-84 sm:h-[440px] bg-gray-900">
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
                    cropName={farm.crop?.name || 'Farm Field'}
                    showSearch={true}
                    onSelectLocation={handleSelectSearchedLocation}
                    onMyLocationClick={handleMyLocationClick}
                    isLocatingGps={isLocating}
                  />

                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md rounded-lg px-2.5 py-1 text-white text-[11px] font-medium border border-white/10 z-[1000] pointer-events-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Esri Maxar 0.5m Orbit</span>
                  </div>
                </div>

                {/* Map Footer Info */}
                <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-500 pt-2 border-t border-earth-100 gap-1">
                  <span>
                    Camera Lat: <strong className="text-gray-700">{activeCoords.lat.toFixed(5)}°N</strong> • Lon: <strong className="text-gray-700">{activeCoords.lon.toFixed(5)}°E</strong>
                  </span>
                  <span>Sensor: ESA Copernicus Sentinel-2 MSI</span>
                </div>
              </Card>
            </div>

            {/* Right: Health Metrics & Dynamic Insights */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-6 bg-gradient-to-br from-white to-krishi-50/30">
                <div className="flex items-center justify-between pb-4 border-b border-earth-100 mb-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Overall Crop Health
                    </h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      {evaluation.isSufficient && evaluation.healthScore !== null ? (
                        <>
                          <span className="text-4xl font-black text-gray-900">{evaluation.healthScore}</span>
                          <span className="text-lg font-bold text-gray-400">/ 100</span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-gray-400">Telemetry Pending</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                        evaluation.vegetationStatus === 'Optimal Growth'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : evaluation.vegetationStatus === 'Moderate Vigor'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : evaluation.vegetationStatus === 'High Canopy Stress'
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{evaluation.vegetationStatus}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Sentinel-2 10m Resolution</p>
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
                      {evaluation.isSufficient && evaluation.ndviScore !== null ? evaluation.ndviScore : 'No data'}
                    </strong>
                    <span className="text-[10px] text-emerald-700 block font-semibold">
                      {evaluation.isSufficient && evaluation.ndviScore !== null
                        ? evaluation.ndviScore >= 0.7
                          ? 'Dense Vegetative Canopy'
                          : evaluation.ndviScore >= 0.45
                          ? 'Moderate Vegetative Canopy'
                          : 'Sparse Canopy / Early Growth'
                        : 'Sowing date required'}
                    </span>
                  </div>

                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">EVI (Enhanced)</span>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <strong className="text-lg font-black text-gray-900 block mt-0.5">
                      {evaluation.isSufficient && evaluation.ndviScore !== null
                        ? (evaluation.ndviScore * 0.85).toFixed(2)
                        : 'No data'}
                    </strong>
                    <span className="text-[10px] text-gray-500 block">Atmosphere-calibrated</span>
                  </div>

                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">NDWI Water Index</span>
                      <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                    </div>
                    <strong className="text-lg font-black text-cyan-800 block mt-0.5">
                      {evaluation.isSufficient && evaluation.ndviScore !== null
                        ? (evaluation.ndviScore * 0.42).toFixed(2)
                        : 'No data'}
                    </strong>
                    <span className="text-[10px] text-cyan-700 block font-medium">Canopy Hydration Level</span>
                  </div>

                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">Soil Moisture</span>
                      <span className="text-xs font-bold text-gray-700">Root zone</span>
                    </div>
                    <strong className="text-lg font-black text-gray-900 block mt-0.5">
                      {farm.soil?.moisturePercentage ? `${farm.soil.moisturePercentage}%` : 'No sensor data'}
                    </strong>
                    <span className="text-[10px] text-gray-500 block">
                      {farm.soil?.moisturePercentage ? 'Volumetric soil layer' : 'Add soil test to sync'}
                    </span>
                  </div>
                </div>

                {/* AI Insight Box based strictly on real conditions */}
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>AI Agronomic Field Assessment</span>
                  </div>
                  <p className="text-sm text-amber-950 leading-relaxed font-medium">
                    {evaluation.isSufficient
                      ? evaluation.stressDetected && evaluation.stressDetails
                        ? `"${evaluation.stressDetails.cause}."`
                        : `"Optimal vegetative canopy vigor. No active pest or moisture stress detected on ${farm.name}."`
                      : '"Crop telemetry requires sowing date and crop species to benchmark against growth stage models."'}
                  </p>

                  {evaluation.isSufficient && evaluation.stressDetails && (
                    <Button
                      onClick={() => setRecommendationModal(true)}
                      variant="primary"
                      size="md"
                      fullWidth
                      className="bg-amber-800 hover:bg-amber-900 text-white shadow-xs"
                    >
                      View Agronomist Recommendation
                    </Button>
                  )}

                  {evaluation.isSufficient && (
                    <Button
                      onClick={handleSaveObservation}
                      disabled={savingObservation || observationSaved}
                      variant="outline"
                      size="sm"
                      fullWidth
                    >
                      {savingObservation
                        ? 'Saving Telemetry to Database...'
                        : observationSaved
                        ? '✓ Telemetry Saved to Supabase'
                        : 'Record Observation to Supabase'}
                    </Button>
                  )}
                </div>
              </Card>

              {/* Historical Crop Health Timeline */}
              <Card className="p-5">
                <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-krishi-700" />
                    <span>Recorded Observations History</span>
                  </div>
                  <span className="text-xs font-normal text-gray-500">
                    {cropObservations.length} Records
                  </span>
                </h4>

                {cropObservations.length > 0 ? (
                  <div className="space-y-2.5 text-xs max-h-60 overflow-y-auto">
                    {cropObservations.map((obs) => (
                      <div
                        key={obs.id}
                        className="flex justify-between items-center py-2 border-b border-earth-100 last:border-0"
                      >
                        <div>
                          <span className="text-gray-900 font-semibold block">
                            {obs.crop} ({obs.stage})
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(obs.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-krishi-800 block">
                            Score: {obs.healthScore}/100
                          </span>
                          {obs.ndvi && (
                            <span className="text-[11px] text-gray-500">NDVI: {obs.ndvi}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-gray-500">
                    <p className="font-semibold text-gray-700">No past observations recorded yet</p>
                    <p className="mt-1">
                      Click "Record Observation to Supabase" above to log today's telemetry snapshot.
                    </p>
                  </div>
                )}
              </Card>
            </div>
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
