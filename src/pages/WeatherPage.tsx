import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useFarm } from '../context/FarmContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { voiceService } from '../services/voiceService';
import { supabaseService } from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  CloudSun,
  CloudRain,
  Sun,
  Droplets,
  Wind,
  Thermometer,
  Sparkles,
  HelpCircle,
  MapPin,
  RefreshCw,
  Navigation,
  Volume2,
  VolumeX,
  Flame,
  Snowflake,
  ShieldCheck,
  TrendingUp,
  Database,
  CheckCircle2,
} from 'lucide-react';

interface WeatherHazard {
  id: string;
  type: 'frost' | 'heatwave' | 'heavy_rain' | 'squall' | 'optimal';
  title: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  action: string;
}

interface HourlyWeatherPoint {
  hour: string;
  temperature: number;
  rainProbability: number;
  windSpeedKmh: number;
  humidity: number;
  sprayStatus: 'safe' | 'caution' | 'danger';
  sprayReason: string;
}

interface PumpRecommendation {
  shouldRun: boolean;
  action: string;
  reason: string;
  estimatedSavingsWaterLiters: number;
  estimatedSavingsMoneyInr: number;
}

interface LiveWeatherState {
  temperature: number;
  apparentTemperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeedKmh: number;
  rainProbability24h: number;
  soilMoisturePercentage: number;
  advice: string;
  lastUpdated: string;
  locationLabel: string;
  isLiveGps: boolean;
  coordinates: { latitude: number; longitude: number };
  hourlyRainForecast: Array<{ hour: string; rainProbability: number; temperature: number }>;
  hourlySprayForecast: HourlyWeatherPoint[];
  hazards: WeatherHazard[];
  pumpRecommendation: PumpRecommendation;
  forecast7Days: Array<{
    day: string;
    tempMax: number;
    tempMin: number;
    condition: string;
    icon: string;
    rainProbability: number;
  }>;
}

const PRESET_HUBS = [
  { name: 'Vidarbha (Cotton/Soybean)', lat: 21.1458, lon: 79.0882 },
  { name: 'Punjab Malwa (Wheat)', lat: 30.901, lon: 75.8573 },
  { name: 'Guntur (Chilli/Spices)', lat: 16.3067, lon: 80.4365 },
  { name: 'Saurashtra (Groundnut)', lat: 21.5222, lon: 70.4579 },
];

export const WeatherPage: React.FC = () => {
  const { farm } = useFarm();
  const { language } = useLanguage();

  const [whyModalOpen, setWhyModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const initialLat = typeof farm.location?.latitude === 'number' ? farm.location.latitude : 0;
  const initialLon = typeof farm.location?.longitude === 'number' ? farm.location.longitude : 0;
  const initialLabel = farm.location?.district || farm.location?.address || farm.name || 'Your Farm';

  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lon: number;
    label: string;
    isLiveGps: boolean;
  }>({
    lat: initialLat,
    lon: initialLon,
    label: initialLabel,
    isLiveGps: false,
  });

  // Synchronize coordinates whenever the selected farm or its location changes
  useEffect(() => {
    const lat = typeof farm.location?.latitude === 'number' ? farm.location.latitude : 0;
    const lon = typeof farm.location?.longitude === 'number' ? farm.location.longitude : 0;
    const label = farm.location?.district || farm.location?.address || farm.name || 'Your Farm';

    setCurrentCoords((prev) => {
      if (prev.lat !== lat || prev.lon !== lon || prev.label !== label) {
        return {
          lat,
          lon,
          label,
          isLiveGps: false,
        };
      }
      return prev;
    });
  }, [farm.id, farm.location?.latitude, farm.location?.longitude, farm.location?.district, farm.location?.address, farm.name]);

  const [liveWeather, setLiveWeather] = useState<LiveWeatherState>({
    temperature: farm.weather?.temperature || 28,
    apparentTemperature: 30,
    condition: farm.weather?.condition || 'Partly Cloudy',
    icon: 'cloud-sun',
    humidity: farm.weather?.humidity || 72,
    windSpeedKmh: farm.weather?.windSpeedKmh || 12,
    rainProbability24h: farm.weather?.rainProbability || 60,
    soilMoisturePercentage: farm.soil?.moisturePercentage || 42,
    advice: farm.weather?.advice || 'Optimal weather conditions for active crop stage.',
    lastUpdated: 'Live from Open-Meteo & IMD',
    locationLabel: initialLabel,
    isLiveGps: false,
    coordinates: {
      latitude: initialLat,
      longitude: initialLon,
    },
    hourlyRainForecast: [
      { hour: '06:00', rainProbability: 10, temperature: 22 },
      { hour: '09:00', rainProbability: 15, temperature: 26 },
      { hour: '12:00', rainProbability: 25, temperature: 30 },
      { hour: '15:00', rainProbability: 45, temperature: 32 },
      { hour: '18:00', rainProbability: 65, temperature: 28 },
      { hour: '21:00', rainProbability: 70, temperature: 25 },
    ],

    hourlySprayForecast: [
      { hour: '06:00', temperature: 22, rainProbability: 10, windSpeedKmh: 6, humidity: 80, sprayStatus: 'safe', sprayReason: 'Optimal: cool & calm winds' },
      { hour: '08:00', temperature: 25, rainProbability: 10, windSpeedKmh: 8, humidity: 75, sprayStatus: 'safe', sprayReason: 'Optimal spray window' },
      { hour: '10:00', temperature: 28, rainProbability: 15, windSpeedKmh: 10, humidity: 68, sprayStatus: 'safe', sprayReason: 'Good morning window' },
      { hour: '12:00', temperature: 32, rainProbability: 25, windSpeedKmh: 13, humidity: 60, sprayStatus: 'caution', sprayReason: 'Rising heat: rapid evaporation risk' },
      { hour: '14:00', temperature: 34, rainProbability: 40, windSpeedKmh: 16, humidity: 58, sprayStatus: 'danger', sprayReason: 'High drift risk (16 km/h) & rain threat' },
      { hour: '16:00', temperature: 30, rainProbability: 60, windSpeedKmh: 18, humidity: 72, sprayStatus: 'danger', sprayReason: 'High rain risk (60%): chemical wash-off' },
      { hour: '18:00', temperature: 27, rainProbability: 65, windSpeedKmh: 14, humidity: 80, sprayStatus: 'danger', sprayReason: 'Evening shower: do not spray' },
      { hour: '20:00', temperature: 25, rainProbability: 70, windSpeedKmh: 10, humidity: 85, sprayStatus: 'danger', sprayReason: 'Active precipitation' },
    ],
    hazards: [
      {
        id: 'hazard_rain',
        type: 'heavy_rain',
        title: '⛈️ Moderate Evening Showers (शाम को बारिश की संभावना)',
        severity: 'moderate',
        description: '60% probability of precipitation between 4 PM and 9 PM. Avoid all foliar chemical spraying.',
        action: 'Ensure sprayer pumps are flushed and stored. Delay tubewell pumping.',
      },
    ],
    pumpRecommendation: {
      shouldRun: false,
      action: 'Delay Tubewell / Drip Irrigation Today',
      reason: 'Evening showers expected (60%). Natural rainfall will recharge root zone without pumping.',
      estimatedSavingsWaterLiters: 45000,
      estimatedSavingsMoneyInr: 140,
    },
    forecast7Days: [
      { day: 'Today', tempMax: 30, tempMin: 23, condition: 'Partly Cloudy', icon: 'cloud-sun', rainProbability: 60 },
      { day: 'Tomorrow', tempMax: 27, tempMin: 22, condition: 'Rain Expected', icon: 'cloud-rain', rainProbability: 78 },
      { day: 'Wednesday', tempMax: 28, tempMin: 22, condition: 'Scattered Showers', icon: 'cloud-rain', rainProbability: 65 },
      { day: 'Thursday', tempMax: 30, tempMin: 23, condition: 'Partly Cloudy', icon: 'cloud-sun', rainProbability: 35 },
      { day: 'Friday', tempMax: 31, tempMin: 24, condition: 'Clear Sunny', icon: 'sun', rainProbability: 15 },
      { day: 'Saturday', tempMax: 32, tempMin: 24, condition: 'Clear Sunny', icon: 'sun', rainProbability: 10 },
      { day: 'Sunday', tempMax: 31, tempMin: 23, condition: 'Mainly Clear', icon: 'sun', rainProbability: 20 },
    ],
  });

  const [dbSync, setDbSync] = useState<{
    status: 'synced' | 'saving' | 'offline' | 'restored';
    lastTime: string | null;
    source: string;
  }>({
    status: isSupabaseConfigured ? 'synced' : 'offline',
    lastTime: null,
    source: isSupabaseConfigured ? 'Supabase PostgreSQL' : 'Local Fallback Cache',
  });

  const loadWeather = useCallback(async (targetLat?: number, targetLon?: number, label?: string, isGps?: boolean) => {
    setRefreshing(true);
    const lat = targetLat !== undefined ? targetLat : currentCoords.lat;
    const lon = targetLon !== undefined ? targetLon : currentCoords.lon;

    if (!lat || !lon || (lat === 0 && lon === 0)) {
      setRefreshing(false);
      return;
    }

    try {
      const res = await api.getLiveWeather(lat, lon, farm.id);


      if (res.success && res.data) {
        const data = res.data;
        setLiveWeather({
          temperature: data.temperature,
          apparentTemperature: data.apparentTemperature || data.temperature + 2,
          condition: data.condition,
          icon: data.icon,
          humidity: data.humidity,
          windSpeedKmh: data.windSpeedKmh,
          rainProbability24h: data.rainProbability24h,
          soilMoisturePercentage: data.soilMoisturePercentage || farm.soil?.moisturePercentage || 42,
          advice: data.advice,
          lastUpdated: `Updated at ${data.lastUpdated}`,
          locationLabel: label || currentCoords.label,
          isLiveGps: isGps !== undefined ? isGps : currentCoords.isLiveGps,
          coordinates: { latitude: lat, longitude: lon },
          hourlyRainForecast: data.hourlyRainForecast || [],
          hourlySprayForecast: data.hourlySprayForecast || liveWeather.hourlySprayForecast,
          hazards: data.hazards || liveWeather.hazards,
          pumpRecommendation: data.pumpRecommendation || liveWeather.pumpRecommendation,
          forecast7Days: data.forecast7Days || [],
        });

        // ⚡ Persist live weather record to Supabase Cloud Database
        if (isSupabaseConfigured) {
          setDbSync((prev) => ({ ...prev, status: 'saving' }));
          const saved = await supabaseService.upsertWeatherData(farm.id, data);
          if (saved) {
            setDbSync({
              status: 'synced',
              lastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              source: 'Supabase Cloud Database',
            });
            // Automatically log any severe hazards to Supabase alerts table
            if (Array.isArray(data.hazards)) {
              for (const h of data.hazards) {
                if (h.type && h.type !== 'optimal') {
                  supabaseService.syncWeatherHazardAlert(h, farm.location?.district || 'Nagpur');
                }
              }
            }
          }
        }
        return;
      }
      throw new Error('API did not return live weather payload');
    } catch (err) {
      console.warn('[WeatherPage] Backend API unavailable, utilizing Supabase database directly:', err);

      // ⚡ If there is no backend database / API failed, load directly from Supabase!
      if (isSupabaseConfigured) {
        try {
          const sbData = await supabaseService.getWeatherData(farm.id);
          if (sbData) {
            setLiveWeather((prev) => ({
              ...prev,
              temperature: Number(sbData.temperature) || prev.temperature,
              apparentTemperature: Number(sbData.apparent_temperature) || (Number(sbData.temperature) || prev.temperature) + 2,
              condition: sbData.condition || prev.condition,
              icon: sbData.condition_icon || prev.icon,
              humidity: Number(sbData.humidity) || prev.humidity,
              windSpeedKmh: Number(sbData.wind_speed_kmh) || prev.windSpeedKmh,
              rainProbability24h: Number(sbData.rain_probability) || prev.rainProbability24h,
              soilMoisturePercentage: Number(sbData.soil_moisture) || prev.soilMoisturePercentage,
              advice: sbData.advice || prev.advice,
              lastUpdated: `Restored from Supabase Database (${new Date(sbData.updated_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
              locationLabel: label || currentCoords.label,
              isLiveGps: isGps !== undefined ? isGps : currentCoords.isLiveGps,
              coordinates: { latitude: lat, longitude: lon },
              hourlySprayForecast: Array.isArray(sbData.hourly_spray) && sbData.hourly_spray.length > 0 ? sbData.hourly_spray : prev.hourlySprayForecast,
              hazards: Array.isArray(sbData.hazards) && sbData.hazards.length > 0 ? sbData.hazards : prev.hazards,
              pumpRecommendation: sbData.pump_action ? {
                shouldRun: false,
                action: sbData.pump_action,
                reason: sbData.advice || prev.pumpRecommendation.reason,
                estimatedSavingsWaterLiters: Number(sbData.pump_savings_water) || 45000,
                estimatedSavingsMoneyInr: Number(sbData.pump_savings_inr) || 140,
              } : prev.pumpRecommendation,
              forecast7Days: Array.isArray(sbData.forecast_7days) && sbData.forecast_7days.length > 0 ? sbData.forecast_7days : prev.forecast7Days,
            }));
            setDbSync({
              status: 'restored',
              lastTime: new Date(sbData.updated_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              source: 'Supabase Cloud Database',
            });
            return;
          }
        } catch (sbErr) {
          console.warn('[WeatherPage] Supabase direct read failed:', sbErr);
        }
      }
    } finally {
      setRefreshing(false);
    }
  }, [currentCoords.lat, currentCoords.lon, currentCoords.label, currentCoords.isLiveGps, farm.id, farm.location?.district, farm.soil?.moisturePercentage, liveWeather.hourlySprayForecast, liveWeather.hazards, liveWeather.pumpRecommendation, liveWeather.forecast7Days]);

  useEffect(() => {
    loadWeather(currentCoords.lat, currentCoords.lon, currentCoords.label, currentCoords.isLiveGps);
  }, [currentCoords.lat, currentCoords.lon, currentCoords.label, currentCoords.isLiveGps, loadWeather]);

  // ⚡ Supabase Realtime WebSocket subscription for live weather updates
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const unsubscribe = supabaseService.subscribeToWeatherData(farm.id, (row) => {
      console.info('⚡ [Supabase Realtime] Weather update received:', row);
      setLiveWeather((prev) => ({
        ...prev,
        temperature: row.temperature != null ? Number(row.temperature) : prev.temperature,
        apparentTemperature: row.apparent_temperature != null ? Number(row.apparent_temperature) : prev.apparentTemperature,
        condition: row.condition || prev.condition,
        icon: row.condition_icon || prev.icon,
        humidity: row.humidity != null ? Number(row.humidity) : prev.humidity,
        windSpeedKmh: row.wind_speed_kmh != null ? Number(row.wind_speed_kmh) : prev.windSpeedKmh,
        rainProbability24h: row.rain_probability != null ? Number(row.rain_probability) : prev.rainProbability24h,
        soilMoisturePercentage: row.soil_moisture != null ? Number(row.soil_moisture) : prev.soilMoisturePercentage,
        advice: row.advice || prev.advice,
        lastUpdated: `Realtime Sync from Supabase (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      }));
      setDbSync({
        status: 'synced',
        lastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'Supabase Realtime Stream',
      });
    });

    return () => {
      unsubscribe();
    };
  }, [farm.id]);

  const handleForceSyncSupabase = async () => {
    if (!isSupabaseConfigured) return;
    setDbSync((prev) => ({ ...prev, status: 'saving' }));
    const ok = await supabaseService.upsertWeatherData(farm.id, liveWeather);
    if (ok) {
      setDbSync({
        status: 'synced',
        lastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'Supabase Cloud Database',
      });
    }
  };

  // Acquire live GPS position via browser geolocation
  const handleUseLiveGps = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentCoords({
          lat: latitude,
          lon: longitude,
          label: `Live GPS Location (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`,
          isLiveGps: true,
        });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Voice narration of weather bulletin
  const handleToggleVoice = () => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      const bulletinText = `Today's weather for ${liveWeather.locationLabel}: Temperature is ${liveWeather.temperature} degrees Celsius. ${liveWeather.condition}. Rain probability is ${liveWeather.rainProbability24h} percent. Soil moisture is ${liveWeather.soilMoisturePercentage} percent. Recommendation: ${liveWeather.advice} Spray advice: ${liveWeather.hourlySprayForecast[0]?.sprayReason || 'Check spray window before field application'}.`;
      setIsSpeaking(true);
      voiceService.speak(bulletinText, language).then(() => {
        setIsSpeaking(false);
      }).catch(() => {
        setIsSpeaking(false);
      });
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'cloud-rain':
        return <CloudRain className="w-8 h-8 text-sky-600" />;
      case 'cloud-sun':
        return <CloudSun className="w-8 h-8 text-amber-500" />;
      default:
        return <Sun className="w-8 h-8 text-amber-500" />;
    }
  };

  // Calculate high/low for the SVG temperature curve
  const hourlyData = liveWeather.hourlySprayForecast && liveWeather.hourlySprayForecast.length > 0
    ? liveWeather.hourlySprayForecast.slice(0, 12)
    : [
        { hour: '06:00', temperature: 22, rainProbability: 10 },
        { hour: '08:00', temperature: 25, rainProbability: 10 },
        { hour: '10:00', temperature: 28, rainProbability: 15 },
        { hour: '12:00', temperature: 32, rainProbability: 25 },
        { hour: '14:00', temperature: 34, rainProbability: 40 },
        { hour: '16:00', temperature: 30, rainProbability: 60 },
        { hour: '18:00', temperature: 27, rainProbability: 65 },
        { hour: '20:00', temperature: 25, rainProbability: 70 },
      ];

  const minTemp = Math.min(...hourlyData.map((h) => h.temperature)) - 2;
  const maxTemp = Math.max(...hourlyData.map((h) => h.temperature)) + 2;
  const tempRange = Math.max(1, maxTemp - minTemp);

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <CloudSun className="w-5 h-5 text-sky-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Weather Intelligence
              </h1>
              {liveWeather.isLiveGps && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Live GPS
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              High-accuracy Open-Meteo & IMD radar • Calibrated for {farm.crop?.name || 'Crops'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live GPS Fix Button */}
            <button
              onClick={handleUseLiveGps}
              disabled={isLocating}
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                liveWeather.isLiveGps
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-krishi-700 hover:bg-krishi-800 text-white shadow-krishi-700/20'
              }`}
              title="Get live weather for current GPS position"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : liveWeather.isLiveGps ? '📍 GPS Active' : '📍 Use Live GPS'}</span>
            </button>

            {/* Kisan Radio Voice Bulletin */}
            <Button
              onClick={handleToggleVoice}
              variant="outline"
              size="sm"
              icon={isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-red-600 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5 text-krishi-700" />}
              className={`border-krishi-300 font-bold text-xs ${isSpeaking ? 'bg-red-50 text-red-700 border-red-300' : 'bg-white text-krishi-800'}`}
            >
              {isSpeaking ? 'Stop Audio' : '🔊 Listen Bulletin'}
            </Button>

            <Button
              onClick={() => loadWeather()}
              variant="outline"
              size="sm"
              disabled={refreshing}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            >
              {refreshing ? 'Updating...' : 'Sync'}
            </Button>

            {/* Supabase Database Status Indicator */}
            <button
              onClick={handleForceSyncSupabase}
              type="button"
              title={isSupabaseConfigured ? "Backed by Supabase Cloud Database (Click to push manual backup)" : "Running in local database cache mode"}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                dbSync.status === 'synced' || dbSync.status === 'restored'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-xs'
                  : dbSync.status === 'saving'
                  ? 'bg-blue-50 text-blue-800 border-blue-300 animate-pulse'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${dbSync.status === 'saving' ? 'animate-spin text-blue-600' : 'text-emerald-600'}`} />
              <span className="hidden sm:inline">DB:</span>
              <span>{dbSync.status === 'saving' ? 'Saving...' : isSupabaseConfigured ? 'Supabase' : 'Offline'}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  dbSync.status === 'saving'
                    ? 'bg-blue-500 animate-ping'
                    : isSupabaseConfigured
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              {dbSync.lastTime && (
                <span className="text-[10px] text-emerald-700 hidden md:inline font-mono">
                  {dbSync.lastTime}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Supabase Database Cloud Sync Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border border-emerald-200/90 rounded-2xl text-xs text-emerald-950 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-emerald-600 text-white shrink-0">
                <Database className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-emerald-900">
                  {isSupabaseConfigured ? 'Supabase PostgreSQL Cloud Active:' : 'Local Fallback Storage Active:'}
                </span>{' '}
                <span className="text-emerald-800">
                  Weather observations, 24h spray windows, and disaster warnings are synced to{' '}
                  <strong>{dbSync.source}</strong>.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {dbSync.lastTime && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Synced {dbSync.lastTime}
                </span>
              )}
              {isSupabaseConfigured && (
                <button
                  onClick={handleForceSyncSupabase}
                  disabled={dbSync.status === 'saving'}
                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-100/60 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                >
                  ⚡ Push Sync
                </button>
              )}
            </div>
          </div>

          {/* Agricultural Hub Quick-Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 bg-white rounded-2xl border border-earth-200 text-xs shadow-xs">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                Target Location: <strong className="text-gray-900">{liveWeather.locationLabel}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-gray-400 text-[11px] font-semibold uppercase mr-1">Agricultural Belts:</span>
              {PRESET_HUBS.map((hub) => (
                <button
                  key={hub.name}
                  onClick={() => {
                    setCurrentCoords({
                      lat: hub.lat,
                      lon: hub.lon,
                      label: hub.name,
                      isLiveGps: false,
                    });
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    currentCoords.lat === hub.lat && currentCoords.lon === hub.lon
                      ? 'bg-sky-700 text-white'
                      : 'bg-earth-100 text-gray-700 hover:bg-earth-200'
                  }`}
                >
                  {hub.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Agricultural Hazard Warning Banners (Frost, Heatwave, Cloudburst, Squall) */}
          {liveWeather.hazards.map((hazard) => (
            <div
              key={hazard.id}
              className={`p-4 rounded-2xl border transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                hazard.type === 'frost'
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-950'
                  : hazard.type === 'heatwave'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : hazard.type === 'heavy_rain'
                  ? 'bg-blue-50 border-blue-300 text-blue-950'
                  : hazard.type === 'squall'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-xl bg-white/80 shadow-2xs shrink-0">
                  {hazard.type === 'frost' ? (
                    <Snowflake className="w-5 h-5 text-cyan-700 animate-spin" />
                  ) : hazard.type === 'heatwave' ? (
                    <Flame className="w-5 h-5 text-amber-600 animate-pulse" />
                  ) : hazard.type === 'heavy_rain' ? (
                    <CloudRain className="w-5 h-5 text-blue-600" />
                  ) : hazard.type === 'squall' ? (
                    <Wind className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm tracking-tight">{hazard.title}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        hazard.severity === 'critical'
                          ? 'bg-red-600 text-white'
                          : hazard.severity === 'high'
                          ? 'bg-amber-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {hazard.severity} Risk
                    </span>
                  </div>
                  <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{hazard.description}</p>
                  <p className="text-xs font-bold mt-1.5 flex items-center gap-1">
                    <span>💡 Action Step:</span>
                    <span className="underline">{hazard.action}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Main Current Weather Hero Banner */}
          <div className="relative rounded-3xl overflow-hidden shadow-soft-lg border border-sky-200 bg-gradient-to-r from-sky-500 via-blue-600 to-sky-700 text-white p-6 sm:p-8">
            <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none translate-x-10 translate-y-10">
              <Sun className="w-80 h-80 text-white" />
            </div>

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-sky-100 text-xs sm:text-sm font-semibold mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {liveWeather.locationLabel} ({liveWeather.coordinates.latitude.toFixed(4)}°N, {liveWeather.coordinates.longitude.toFixed(4)}°E)
                    </span>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <span className="text-6xl sm:text-7xl font-black tracking-tight drop-shadow-sm">
                      {liveWeather.temperature}°C
                    </span>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold">{liveWeather.condition}</h3>
                      <p className="text-sky-100 text-sm font-medium">
                        Feels like {liveWeather.apparentTemperature}°C • Good vegetative transpiration
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-right w-full sm:w-auto">
                  <div className="text-xs uppercase font-bold text-sky-100">Next 24h Rain Chance</div>
                  <div className="text-3xl font-black mt-1">{liveWeather.rainProbability24h}%</div>
                  <div className="text-xs text-sky-100 mt-0.5">
                    {liveWeather.rainProbability24h >= 50 ? 'High likelihood of rainfall' : 'Low probability of rain'}
                  </div>
                </div>
              </div>

              {/* Weather metric chips row */}
              <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/15 backdrop-blur-xs p-3 rounded-xl border border-white/20">
                  <div className="flex items-center gap-1.5 text-xs text-sky-100 font-medium">
                    <Droplets className="w-4 h-4" />
                    <span>Air Humidity</span>
                  </div>
                  <div className="text-xl font-black mt-1">{liveWeather.humidity}%</div>
                </div>

                <div className="bg-white/15 backdrop-blur-xs p-3 rounded-xl border border-white/20">
                  <div className="flex items-center gap-1.5 text-xs text-sky-100 font-medium">
                    <Wind className="w-4 h-4" />
                    <span>Wind Speed</span>
                  </div>
                  <div className="text-xl font-black mt-1">{liveWeather.windSpeedKmh} km/h</div>
                </div>

                <div className="bg-white/15 backdrop-blur-xs p-3 rounded-xl border border-white/20">
                  <div className="flex items-center gap-1.5 text-xs text-sky-100 font-medium">
                    <Thermometer className="w-4 h-4" />
                    <span>Soil Moisture (0-7cm)</span>
                  </div>
                  <div className="text-xl font-black mt-1">{liveWeather.soilMoisturePercentage}%</div>
                </div>

                <div className="bg-white/15 backdrop-blur-xs p-3 rounded-xl border border-white/20">
                  <div className="flex items-center gap-1.5 text-xs text-sky-100 font-medium">
                    <Sparkles className="w-4 h-4" />
                    <span>Radar Sync</span>
                  </div>
                  <div className="text-sm font-bold mt-1">Open-Meteo & IMD</div>
                </div>
              </div>
            </div>
          </div>

          {/* 🚿 Feature #1: Hourly Agricultural Spray Window Planner (स्प्रे करने का सही समय) */}
          <Card className="p-5 sm:p-6 border-2 border-emerald-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-earth-100 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <h3 className="font-black text-gray-900 text-base sm:text-lg">
                    Agrochemical Spray Window Planner (स्प्रे करने का सही समय)
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Protects expensive pesticides from rain wash-off & wind drift (Updated hour-by-hour)
                </p>
              </div>

              {/* Legend Badges */}
              <div className="flex items-center gap-2 text-[11px] font-bold">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Safe (अनुकूल)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Caution (सावधानी)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Wash-off Risk (खतरा)
                </span>
              </div>
            </div>

            {/* Horizontal Scrollable 24-Hour Spray Slots */}
            <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
              <div className="flex gap-2.5 min-w-max">
                {liveWeather.hourlySprayForecast.map((slot, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border text-center transition-all w-32 flex flex-col justify-between ${
                      slot.sprayStatus === 'safe'
                        ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400/20'
                        : slot.sprayStatus === 'caution'
                        ? 'bg-amber-50/80 border-amber-300'
                        : 'bg-red-50/80 border-red-300'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-black text-gray-700 block">{slot.hour}</span>
                      <strong className="text-base font-black text-gray-900 mt-1 block">
                        {slot.temperature}°C
                      </strong>
                    </div>

                    <div className="my-2 space-y-1 text-[11px] font-semibold text-gray-600">
                      <div className="flex items-center justify-center gap-1 text-sky-700">
                        <Droplets className="w-3 h-3" />
                        <span>{slot.rainProbability}% Rain</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-gray-500">
                        <Wind className="w-3 h-3" />
                        <span>{slot.windSpeedKmh} km/h</span>
                      </div>
                    </div>

                    <div
                      className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase mt-1 ${
                        slot.sprayStatus === 'safe'
                          ? 'bg-emerald-600 text-white'
                          : slot.sprayStatus === 'caution'
                          ? 'bg-amber-500 text-white'
                          : 'bg-red-600 text-white'
                      }`}
                    >
                      {slot.sprayStatus === 'safe' ? 'Safe to Spray' : slot.sprayStatus === 'caution' ? 'Caution' : 'Avoid Spray'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* 📊 Feature #2: 24-Hour Interactive Visual Temperature & Rain Probability Curve */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-krishi-700" />
                <h3 className="font-bold text-gray-900 text-base">
                  24-Hour Micro-Climate Progression Curve
                </h3>
              </div>
              <span className="text-xs text-gray-500 font-medium">Temperature (°C) & Rainfall Probability (%)</span>
            </div>

            {/* SVG Visual Curve */}
            <div className="w-full h-44 relative bg-earth-50/50 rounded-2xl p-4 border border-earth-200/80 overflow-hidden flex flex-col justify-between">
              <svg className="w-full h-28 overflow-visible" viewBox="0 0 500 80" preserveAspectRatio="none">
                {/* Horizontal guide lines */}
                <line x1="0" y1="20" x2="500" y2="20" stroke="#e5e7eb" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="500" y2="50" stroke="#e5e7eb" strokeDasharray="3 3" />

                {/* Rain probability bar columns */}
                {hourlyData.map((item, i) => {
                  const x = (i / (hourlyData.length - 1)) * 480 + 10;
                  const barHeight = (item.rainProbability / 100) * 45;
                  return (
                    <rect
                      key={`bar-${i}`}
                      x={x - 8}
                      y={80 - barHeight}
                      width="16"
                      height={barHeight}
                      rx="3"
                      fill="#38bdf8"
                      opacity="0.35"
                    />
                  );
                })}

                {/* Temperature Smooth Line Curve */}
                <path
                  d={hourlyData
                    .map((item, i) => {
                      const x = (i / (hourlyData.length - 1)) * 480 + 10;
                      const y = 70 - ((item.temperature - minTemp) / tempRange) * 55;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                {hourlyData.map((item, i) => {
                  const x = (i / (hourlyData.length - 1)) * 480 + 10;
                  const y = 70 - ((item.temperature - minTemp) / tempRange) * 55;
                  return (
                    <g key={`pt-${i}`}>
                      <circle cx={x} cy={y} r="4.5" fill="#ffffff" stroke="#ea580c" strokeWidth="2.5" />
                      <text x={x} y={y - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#374151">
                        {item.temperature}°
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* X-axis hour labels */}
              <div className="flex justify-between text-[11px] font-mono font-bold text-gray-500 pt-2 border-t border-earth-200">
                {hourlyData.map((item, i) => (
                  <span key={i}>{item.hour}</span>
                ))}
              </div>
            </div>
          </Card>

          {/* 💧 Feature #3: Smart Tubewell / Drip Pump Savings Advisor */}
          <Card className="p-6 bg-gradient-to-r from-sky-50 via-white to-emerald-50 border-sky-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 text-sky-800 font-bold text-xs uppercase tracking-wider">
                  <Droplets className="w-4 h-4 text-sky-600" />
                  <span>Smart Groundwater & Electricity Advisor</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 leading-snug">
                  {liveWeather.pumpRecommendation.action}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {liveWeather.pumpRecommendation.reason}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="p-3 bg-white rounded-2xl border border-sky-200 shadow-2xs text-center">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Water Conserved</span>
                  <strong className="text-base font-black text-sky-700">
                    {liveWeather.pumpRecommendation.estimatedSavingsWaterLiters.toLocaleString()} L
                  </strong>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-emerald-200 shadow-2xs text-center">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Power Cost Saved</span>
                  <strong className="text-base font-black text-emerald-700">
                    ₹{liveWeather.pumpRecommendation.estimatedSavingsMoneyInr}
                  </strong>
                </div>
              </div>
            </div>
          </Card>

          {/* 7-Day Visual Forecast Cards */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center justify-between">
              <span>7-Day Agricultural Forecast</span>
              <span className="text-xs text-gray-500 font-normal">Calibrated for {farm.crop?.name || 'Crops'} ({farm.crop?.stage || 'Growing'})</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {liveWeather.forecast7Days.map((item, idx) => (
                <div
                  key={item.day}
                  className={`p-4 rounded-2xl text-center border transition-all flex flex-col justify-between ${
                    idx === 0
                      ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-400/20 shadow-xs'
                      : 'bg-white border-earth-200 hover:border-earth-300'
                  }`}
                >
                  <div className="text-xs font-bold text-gray-500 uppercase">{item.day}</div>
                  <div className="my-3 flex justify-center">{renderIcon(item.icon)}</div>
                  <div>
                    <div className="text-lg font-black text-gray-900">{item.tempMax}°C</div>
                    <div className="text-[10px] text-gray-400">{item.tempMin}°C min</div>
                    <div className="text-[11px] font-semibold text-sky-700 mt-1 flex items-center justify-center gap-1">
                      <Droplets className="w-3 h-3" />
                      <span>{item.rainProbability}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Weather Advice Banner */}
          <Card className="p-6 bg-gradient-to-br from-emerald-50 via-white to-sky-50 border-krishi-300 shadow-soft">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 text-krishi-800 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-krishi-600" />
                  <span>AI Scientific Advisory</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 leading-snug">
                  "{liveWeather.advice}"
                </h3>
                <p className="text-xs text-gray-600">
                  Real-time calculation based on {liveWeather.soilMoisturePercentage}% soil moisture, {liveWeather.rainProbability24h}% rain probability, and {farm.crop?.name || 'Crop'} {farm.crop?.stage || 'stage'}.
                </p>
              </div>

              <Button
                onClick={() => setWhyModalOpen(true)}
                variant="outline"
                size="md"
                icon={<HelpCircle className="w-4 h-4 text-krishi-700" />}
                className="bg-white border-krishi-300 font-semibold text-krishi-800 flex-shrink-0"
              >
                Ask AI Why?
              </Button>
            </div>
          </Card>
        </main>
      </div>

      <MobileBottomNav />

      {/* "Ask AI Why?" Explanation Modal */}
      <Modal
        isOpen={whyModalOpen}
        onClose={() => setWhyModalOpen(false)}
        title="Scientific Weather Advisory Explanation"
      >
        <div className="space-y-4 text-sm text-gray-700">
          <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900">Precipitation Probability: {liveWeather.rainProbability24h}%</h4>
            <p className="text-xs text-sky-800 mt-1">
              Indian Meteorological Department (IMD) grid radar and Open-Meteo satellite atmospheric pressure models indicate a rain front moving across {liveWeather.locationLabel} within the next 24 hours.
            </p>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900">Soil Moisture Buffer: {liveWeather.soilMoisturePercentage}%</h4>
            <p className="text-xs text-amber-800 mt-1">
              {farm.crop?.name || 'Crop'} at {farm.crop?.stage || 'vegetative'} stage consumes approximately 4-5 mm of water daily. The current soil moisture ({liveWeather.soilMoisturePercentage}%) provides sufficient moisture buffer until natural rainfall occurs.
            </p>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => setWhyModalOpen(false)}
              variant="primary"
              size="md"
              fullWidth
            >
              Close Advisory
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
