import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useFarm } from '../context/FarmContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { voiceService } from '../services/voiceService';
import { searchGlobalLocations, GeocodingResult } from '../services/geocodingService';
import {
  Sun,
  CloudSun,
  CloudRain,
  CloudLightning,
  Cloud,
  Droplets,
  Wind,
  Eye,
  Sunrise,
  Sunset,
  Search,
  X,
  MapPin,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Volume2,
  VolumeX,
  Loader2,
  Sprout,
  Calendar,
  Clock,
  ArrowUpRight,
  Building2,
  Home,
  Flame,
  Snowflake,
  ShieldAlert,
  Leaf,
  Microscope,
} from 'lucide-react';

interface LiveWeatherState {
  temperature: number;
  apparentTemperature: number;
  condition: string;
  icon: 'sun' | 'cloud-sun' | 'cloud-rain';
  humidity: number;
  windSpeedKmh: number;
  rainProbability24h: number;
  soilMoisturePercentage: number;
  visibilityKm?: number;
  sunrise?: string;
  sunset?: string;
  advice: string;
  lastUpdated: string;
  coordinates: { latitude: number; longitude: number };
  hourlyRainForecast: Array<{
    hour: string;
    rainProbability: number;
    temperature: number;
    condition?: string;
    icon?: string;
  }>;
  forecast7Days: Array<{
    day: string;
    tempMax: number;
    tempMin: number;
    condition: string;
    icon: string;
    rainProbability: number;
  }>;
}

interface ActiveWeatherAlert {
  id: string;
  type: 'heavy_rain' | 'high_temp' | 'strong_wind' | 'frost';
  title: string;
  severity: 'moderate' | 'high' | 'critical';
  description: string;
  action: string;
  colorBorder: string;
  colorBg: string;
  colorText: string;
  colorBadge: string;
}

interface AgriInsight {
  category: 'irrigation' | 'rain' | 'crop' | 'alert';
  title: string;
  iconType: 'irrigation' | 'rain' | 'wind' | 'spray' | 'crop' | 'drainage' | 'fungal';
  badge: string;
  badgeColor: string;
  description: string;
  actionableStep?: string;
}

function formatHourTime(hourStr: string): string {
  if (!hourStr) return '';
  const timeOnly = hourStr.includes('T') ? hourStr.split('T')[1] : hourStr;
  const parts = timeOnly.split(':');
  const h = parseInt(parts[0], 10);
  if (isNaN(h)) return hourStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH} ${ampm}`;
}

function getWeatherIcon(iconName?: string, conditionText?: string) {
  const cond = (conditionText || '').toLowerCase();
  const icon = (iconName || '').toLowerCase();

  if (icon.includes('rain') || cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower')) {
    return <CloudRain className="w-12 h-12 sm:w-14 sm:h-14 text-sky-500" />;
  }
  if (cond.includes('thunder') || cond.includes('storm')) {
    return <CloudLightning className="w-12 h-12 sm:w-14 sm:h-14 text-amber-500" />;
  }
  if (icon.includes('cloud') || cond.includes('cloud') || cond.includes('overcast')) {
    return <CloudSun className="w-12 h-12 sm:w-14 sm:h-14 text-amber-500" />;
  }
  if (cond.includes('fog') || cond.includes('mist')) {
    return <Cloud className="w-12 h-12 sm:w-14 sm:h-14 text-stone-400" />;
  }
  return <Sun className="w-12 h-12 sm:w-14 sm:h-14 text-amber-500" />;
}

function getSmallWeatherIcon(iconName?: string, conditionText?: string) {
  const cond = (conditionText || '').toLowerCase();
  const icon = (iconName || '').toLowerCase();

  if (icon.includes('rain') || cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower')) {
    return <CloudRain className="w-5 h-5 text-sky-500 shrink-0" />;
  }
  if (cond.includes('thunder') || cond.includes('storm')) {
    return <CloudLightning className="w-5 h-5 text-amber-500 shrink-0" />;
  }
  if (icon.includes('cloud') || cond.includes('cloud') || cond.includes('overcast')) {
    return <CloudSun className="w-5 h-5 text-amber-500 shrink-0" />;
  }
  return <Sun className="w-5 h-5 text-amber-500 shrink-0" />;
}

function renderAlertIcon(type: ActiveWeatherAlert['type']) {
  switch (type) {
    case 'heavy_rain':
      return <CloudRain className="w-5 h-5 text-blue-600 shrink-0" />;
    case 'high_temp':
      return <Flame className="w-5 h-5 text-rose-600 shrink-0" />;
    case 'strong_wind':
      return <Wind className="w-5 h-5 text-amber-600 shrink-0" />;
    case 'frost':
      return <Snowflake className="w-5 h-5 text-cyan-600 shrink-0" />;
    default:
      return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
  }
}

function renderInsightIcon(iconType: AgriInsight['iconType']) {
  switch (iconType) {
    case 'irrigation':
      return <Droplets className="w-4 h-4 text-sky-600 shrink-0" />;
    case 'rain':
      return <CloudRain className="w-4 h-4 text-blue-600 shrink-0" />;
    case 'wind':
      return <Wind className="w-4 h-4 text-teal-600 shrink-0" />;
    case 'spray':
      return <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />;
    case 'crop':
      return <Leaf className="w-4 h-4 text-krishi-700 shrink-0" />;
    case 'drainage':
      return <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />;
    case 'fungal':
      return <Microscope className="w-4 h-4 text-amber-600 shrink-0" />;
    default:
      return <Leaf className="w-4 h-4 text-krishi-700 shrink-0" />;
  }
}

function generateFarmWeatherInsights(
  weather: LiveWeatherState | null,
  crop?: any
): AgriInsight[] {
  if (!weather || typeof weather.temperature !== 'number') {
    return [];
  }

  const insights: AgriInsight[] = [];
  const temp = weather.temperature;
  const humidity = weather.humidity;
  const wind = weather.windSpeedKmh;
  const rainProb = weather.rainProbability24h;
  const soilMoisture = weather.soilMoisturePercentage;
  const cropName = crop?.name || '';
  const cropStage = crop?.stage || '';
  const tomorrowForecast = weather.forecast7Days?.[1];
  const tomorrowRain = tomorrowForecast?.rainProbability ?? 0;

  // 1. Irrigation Insight
  if (tomorrowRain >= 50 || rainProb >= 60) {
    insights.push({
      category: 'irrigation',
      title: 'Irrigation Advisory: Delay Watering',
      iconType: 'irrigation',
      badge: 'Water Conservation',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
      description: `Rain is expected tomorrow (${tomorrowRain}% chance). Delaying irrigation saves water and prevents waterlogging in the root zone.`,
      actionableStep: 'Turn off automated pumps and check root zone drainage.',
    });
  } else if (soilMoisture < 35 && rainProb < 25) {
    insights.push({
      category: 'irrigation',
      title: 'Irrigation Advisory: Moisture Deficit',
      iconType: 'irrigation',
      badge: 'Irrigation Needed',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      description: `Soil moisture is low (${soilMoisture}%) with minimal rain expected (${rainProb}%). Apply irrigation to avoid vegetative wilt.`,
      actionableStep: 'Apply light drip irrigation in early morning or late afternoon.',
    });
  } else {
    insights.push({
      category: 'irrigation',
      title: 'Irrigation Advisory: Balanced Moisture',
      iconType: 'irrigation',
      badge: 'Optimal Schedule',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description: `Soil moisture is healthy (${soilMoisture}%). Maintain regular watering cycles without over-saturating.`,
      actionableStep: 'Check soil surface before initiating standard irrigation cycle.',
    });
  }

  // 2. Rain & Spray Window Insight
  if (rainProb >= 40) {
    insights.push({
      category: 'rain',
      title: 'Rain Probability: Postpone Spraying',
      iconType: 'rain',
      badge: 'High Rain Threat',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      description: `High rainfall probability (${rainProb}%) in the next 24 hours. Foliar chemical sprays are at high risk of rain wash-off.`,
      actionableStep: 'Postpone pesticide and foliar nutrition spraying until dry weather returns.',
    });
  } else if (wind >= 16) {
    insights.push({
      category: 'rain',
      title: 'Spray Advisory: High Wind Drift Risk',
      iconType: 'wind',
      badge: 'Wind Drift Risk',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      description: `Wind speed is elevated (${wind} km/h). High winds cause droplets to drift away from target foliage onto non-target zones.`,
      actionableStep: 'Wait for wind speeds to fall below 12 km/h before spraying.',
    });
  } else {
    insights.push({
      category: 'rain',
      title: 'Spray Advisory: Optimal Field Window',
      iconType: 'spray',
      badge: 'Ideal Window',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description: `Calm wind (${wind} km/h) and minimal rain threat (${rainProb}%) provide a favorable foliar spraying and fertigation window.`,
      actionableStep: 'Best spraying hours: 7:00 AM – 10:30 AM or 4:30 PM – 6:30 PM.',
    });
  }

  // 3. Crop Specific Insight
  if (cropName) {
    if (temp >= 36) {
      insights.push({
        category: 'crop',
        title: `Crop Management: Heat Stress on ${cropName}`,
        iconType: 'crop',
        badge: 'Heat Stress Risk',
        badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
        description: `Current high temperature (${temp}°C) may accelerate transpiration and induce flower or fruitlet drop in ${cropName}${cropStage ? ` (${cropStage} stage)` : ''}.`,
        actionableStep: 'Ensure root zones remain shielded with crop mulch or cover crops.',
      });
    } else if (temp <= 12) {
      insights.push({
        category: 'crop',
        title: `Crop Management: Low Temperature on ${cropName}`,
        iconType: 'crop',
        badge: 'Chilling Risk',
        badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
        description: `Cool temperatures (${temp}°C) can delay pollen viability and slow plant metabolism in ${cropName}.`,
        actionableStep: 'Provide light irrigation before sunrise to release latent soil warmth.',
      });
    } else {
      insights.push({
        category: 'crop',
        title: `Crop Health: Favorable for ${cropName}`,
        iconType: 'crop',
        badge: 'Healthy Range',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        description: `Current weather conditions (${temp}°C, ${humidity}% humidity) are well within the physiological comfort zone for ${cropName}${cropStage ? ` at ${cropStage}` : ''}.`,
        actionableStep: 'Ideal period for vegetative growth and routine crop monitoring.',
      });
    }
  } else {
    insights.push({
      category: 'crop',
      title: 'Crop Planning: General Farm Guidance',
      iconType: 'crop',
      badge: 'General Guidance',
      badgeColor: 'bg-gray-50 text-gray-800 border-gray-200',
      description: 'Current weather is suitable for seasonal field operations. Add your planted crop in My Farm for tailored variety recommendations.',
      actionableStep: 'Register your crop parcel on My Farm to activate precision alerts.',
    });
  }

  // 4. Alert / Drainage Insight
  const maxRain7Days = Math.max(...(weather.forecast7Days?.map((d) => d.rainProbability) || [0]));
  if (maxRain7Days >= 65 || rainProb >= 60) {
    insights.push({
      category: 'alert',
      title: 'Field Alert: Drainage Check Required',
      iconType: 'drainage',
      badge: 'Drainage Alert',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      description: `Heavy rainfall expected (up to ${maxRain7Days}%). Standing water in low-lying plots causes root asphyxiation and collar rot.`,
      actionableStep: 'Clear drainage furrows and ensure field outlets are free of debris.',
    });
  } else if (humidity >= 82) {
    insights.push({
      category: 'alert',
      title: 'Disease Alert: Fungal Humidity Watch',
      iconType: 'fungal',
      badge: 'Fungal Threat',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      description: `Sustained high humidity (${humidity}%) creates a microclimate conducive to leaf blight, powdery mildew, and rust.`,
      actionableStep: 'Inspect lower leaf canopy for early lesion spots; avoid overhead sprinkler watering.',
    });
  }

  return insights;
}

function evaluateWeatherAlerts(weather: LiveWeatherState | null): ActiveWeatherAlert[] {
  if (!weather || typeof weather.temperature !== 'number') return [];

  const alerts: ActiveWeatherAlert[] = [];
  const temp = weather.temperature;
  const wind = weather.windSpeedKmh;
  const rainProb = weather.rainProbability24h;
  const maxTemp = Math.max(...(weather.forecast7Days?.map((d) => d.tempMax) || [temp]));
  const minTemp = Math.min(...(weather.forecast7Days?.map((d) => d.tempMin) || [temp]));
  const maxRain = Math.max(...(weather.forecast7Days?.map((d) => d.rainProbability) || [rainProb]));

  // 1. Heavy Rain
  if (rainProb >= 65 || maxRain >= 70) {
    alerts.push({
      id: 'alert_heavy_rain',
      type: 'heavy_rain',
      title: 'Heavy Rainfall & Waterlogging Alert',
      severity: maxRain >= 80 ? 'critical' : 'high',
      description: `Precipitation probability peaks at ${Math.max(rainProb, maxRain)}%. Excess standing water risks root asphyxiation and nutrient leaching.`,
      action: 'Clear field drainage furrows immediately. Suspend all nitrogen fertilizer broadcast and foliar sprays.',
      colorBorder: 'border-blue-200',
      colorBg: 'bg-blue-50/70',
      colorText: 'text-blue-950',
      colorBadge: 'bg-blue-100/80 text-blue-900 border-blue-300',
    });
  }

  // 2. High Temperature
  if (temp >= 38 || maxTemp >= 40) {
    alerts.push({
      id: 'alert_heat',
      type: 'high_temp',
      title: 'High Temperature & Heatwave Warning',
      severity: maxTemp >= 42 ? 'critical' : 'high',
      description: `Daytime temperatures reaching ${Math.max(temp, maxTemp)}°C with hot dry winds. High risk of blossom drop and rapid soil moisture loss.`,
      action: 'Provide supplemental drip irrigation early at dawn. Avoid chemical sprays between 11 AM and 3 PM.',
      colorBorder: 'border-rose-200',
      colorBg: 'bg-rose-50/70',
      colorText: 'text-rose-950',
      colorBadge: 'bg-rose-100/80 text-rose-900 border-rose-300',
    });
  }

  // 3. Strong Wind
  if (wind >= 24) {
    alerts.push({
      id: 'alert_wind',
      type: 'strong_wind',
      title: 'Strong Wind & Squall Advisory',
      severity: wind >= 32 ? 'critical' : 'moderate',
      description: `Wind gusts recorded at ${wind} km/h. Risk of crop lodging in tall crops (sugarcane, maize, banana) and extreme spray drift.`,
      action: 'Stake fragile and tall crops. Delay foliar chemical spraying until wind subsides below 12 km/h.',
      colorBorder: 'border-amber-200',
      colorBg: 'bg-amber-50/70',
      colorText: 'text-amber-950',
      colorBadge: 'bg-amber-100/80 text-amber-900 border-amber-300',
    });
  }

  // 4. Frost / Temperature Drop
  if (temp <= 6 || minTemp <= 5) {
    alerts.push({
      id: 'alert_frost',
      type: 'frost',
      title: 'Frost & Cold Wave Advisory',
      severity: minTemp <= 2 ? 'critical' : 'high',
      description: `Night temperatures expected to fall to ${Math.min(temp, minTemp)}°C. Standing crop foliage and blooms may suffer cell freeze damage.`,
      action: 'Run light early-morning drip irrigation (3:00–5:00 AM) to release soil latent heat and warm the root zone.',
      colorBorder: 'border-cyan-200',
      colorBg: 'bg-cyan-50/70',
      colorText: 'text-cyan-950',
      colorBadge: 'bg-cyan-100/80 text-cyan-900 border-cyan-300',
    });
  }

  return alerts;
}

export const WeatherPage: React.FC = () => {
  const { farm, farms, selectFarm } = useFarm();
  const { language } = useLanguage();

  // Location State
  const farmLat = typeof farm.location?.latitude === 'number' ? farm.location.latitude : 0;
  const farmLon = typeof farm.location?.longitude === 'number' ? farm.location.longitude : 0;
  const farmHasCoords = Boolean(farmLat !== 0 && farmLon !== 0);
  const farmAddressLabel = farm.location?.address || farm.location?.district || farm.name || 'Your Farm';

  const [activeLocation, setActiveLocation] = useState<{
    lat: number;
    lon: number;
    label: string;
    isFarm: boolean;
  } | null>(() => {
    if (farmHasCoords) {
      return {
        lat: farmLat,
        lon: farmLon,
        label: farmAddressLabel,
        isFarm: true,
      };
    }
    return null;
  });

  // Weather Data State
  const [weatherData, setWeatherData] = useState<LiveWeatherState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Audio Voice State
  const [isSpeaking, setIsSpeaking] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch real weather data from backend API
  const fetchWeather = useCallback(
    async (lat: number, lon: number, _locationName: string, isFarm: boolean, isSilentRefresh = false) => {
      if (!isSilentRefresh) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setErrorMessage(null);

      try {
        const res = await api.getLiveWeather(lat, lon, isFarm ? farm.id : undefined);

        if (res.success && res.data) {
          const d = res.data;
          setWeatherData({
            temperature: d.temperature,
            apparentTemperature: d.apparentTemperature || d.temperature,
            condition: d.condition,
            icon: d.icon || 'cloud-sun',
            humidity: d.humidity,
            windSpeedKmh: d.windSpeedKmh,
            rainProbability24h: d.rainProbability24h,
            soilMoisturePercentage: d.soilMoisturePercentage || farm.soil?.moisturePercentage || 40,
            visibilityKm: d.visibilityKm,
            sunrise: d.sunrise,
            sunset: d.sunset,
            advice: d.advice || 'Weather conditions favorable for farm operations.',
            lastUpdated: d.lastUpdated || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            coordinates: { latitude: lat, longitude: lon },
            hourlyRainForecast: d.hourlyRainForecast || [],
            forecast7Days: d.forecast7Days || [],
          });
        } else {
          throw new Error(res.message || 'Weather data is temporarily unavailable.');
        }
      } catch (err: any) {
        console.error('[WeatherPage] Fetch live weather error:', err);
        setErrorMessage(err?.message || 'Weather data is temporarily unavailable. Please retry.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [farm.id, farm.soil?.moisturePercentage]
  );

  // Detect farm location change in Supabase / FarmContext without page reload
  useEffect(() => {
    if (farmHasCoords) {
      if (!activeLocation || activeLocation.isFarm) {
        const newLabel = farm.location?.address || farm.location?.district || farm.name || 'Your Farm';
        setActiveLocation({
          lat: farmLat,
          lon: farmLon,
          label: newLabel,
          isFarm: true,
        });
        fetchWeather(farmLat, farmLon, newLabel, true);
      }
    } else if (!activeLocation) {
      setIsLoading(false);
    }
  }, [farm.id, farmLat, farmLon, farmAddressLabel, farmHasCoords, fetchWeather]);

  // Debounced Location Search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const results = await searchGlobalLocations(q, controller.signal);
        setSuggestions(results || []);
        setShowDropdown(true);
        setSelectedIndex(-1);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('[WeatherPage] Search error:', err);
          setSearchError('Search service error. Please try again.');
        }
      } finally {
        setIsSearching(false);
      }
    }, 320);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Location Selection
  const handleSelectLocation = (loc: GeocodingResult) => {
    const cleanLabel = loc.placeName || loc.displayName.split(',')[0];
    const fullLabel = loc.displayName;
    setActiveLocation({
      lat: loc.lat,
      lon: loc.lon,
      label: fullLabel,
      isFarm: false,
    });
    setSearchQuery(cleanLabel);
    setShowDropdown(false);
    setSuggestions([]);
    fetchWeather(loc.lat, loc.lon, fullLabel, false);
  };

  // Keyboard navigation for search dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
        e.preventDefault();
        if (suggestions.length > 0) {
          handleSelectLocation(suggestions[0]);
        }
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectLocation(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        handleSelectLocation(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Switch to Current Farm Location
  const handleUseFarmLocation = () => {
    if (farmHasCoords) {
      const label = farmAddressLabel;
      setActiveLocation({
        lat: farmLat,
        lon: farmLon,
        label,
        isFarm: true,
      });
      setSearchQuery('');
      setShowDropdown(false);
      fetchWeather(farmLat, farmLon, label, true);
    } else {
      alert('Farm coordinates have not been set yet. Please configure your parcel location in My Farm, or search any city/village in the search bar above.');
    }
  };

  // Voice Narration
  const handleToggleVoice = () => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      if (!weatherData) return;
      const text = `Weather report for ${activeLocation?.label || 'Your Location'}: Temperature is ${weatherData.temperature} degrees Celsius, ${weatherData.condition}. Humidity is ${weatherData.humidity} percent, wind speed is ${weatherData.windSpeedKmh} kilometers per hour, rain chance is ${weatherData.rainProbability24h} percent. Farm advice: ${weatherData.advice}`;
      setIsSpeaking(true);
      voiceService
        .speak(text, language)
        .then(() => setIsSpeaking(false))
        .catch(() => setIsSpeaking(false));
    }
  };

  const activeAlerts = evaluateWeatherAlerts(weatherData);
  const farmInsights = generateFarmWeatherInsights(weatherData, farm.crop);

  // Calculate 7-day temperature extremes for scale bar
  const weekMinTemp = weatherData?.forecast7Days?.length
    ? Math.min(...weatherData.forecast7Days.map((d) => d.tempMin))
    : 10;
  const weekMaxTemp = weatherData?.forecast7Days?.length
    ? Math.max(...weatherData.forecast7Days.map((d) => d.tempMax))
    : 40;
  const tempRangeSpan = Math.max(1, weekMaxTemp - weekMinTemp);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-12">
        {/* ========================================================================= */}
        {/* 1. PROFESSIONAL WEATHER HEADER                                            */}
        {/* ========================================================================= */}
        <header className="bg-white/95 backdrop-blur-md border-b border-earth-200/90 px-4 sm:px-8 py-3.5 sticky top-0 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Title & Farm Subtitle */}
            <div className="flex items-center justify-between md:justify-start gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-krishi-50 border border-krishi-200/60 text-krishi-700">
                    <CloudSun className="w-5 h-5" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    Weather
                  </h1>
                  {activeLocation?.isFarm ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      <Sprout className="w-3 h-3 text-emerald-600" />
                      Farm Linked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      <MapPin className="w-3 h-3 text-blue-600" />
                      Searched Place
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 hidden sm:block mt-0.5 font-medium">
                  Live satellite telemetry & Open-Meteo radar • Calibrated for precision farming
                </p>
              </div>

              {/* Mobile Refresh Button */}
              <button
                onClick={() => {
                  if (activeLocation) {
                    fetchWeather(activeLocation.lat, activeLocation.lon, activeLocation.label, activeLocation.isFarm, true);
                  }
                }}
                disabled={isRefreshing || isLoading || !activeLocation}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-earth-100 rounded-xl border border-earth-200 transition-colors"
                title="Refresh weather"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-krishi-700' : ''}`} />
              </button>
            </div>

            {/* Search Input & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 md:max-w-xl md:justify-end">
              {/* Search Bar with Debounce & Suggestions */}
              <div ref={searchContainerRef} className="relative flex-1">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowDropdown(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search city, village or mandal..."
                    className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-earth-50/80 hover:bg-earth-100/60 focus:bg-white border border-earth-300 focus:border-krishi-600 focus:ring-2 focus:ring-krishi-600/20 rounded-xl transition-all outline-none font-medium text-gray-800 placeholder:text-gray-400"
                  />
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 text-krishi-600 animate-spin absolute right-3" />
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSuggestions([]);
                        setShowDropdown(false);
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 rounded-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>

                {/* Suggestions Dropdown */}
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-earth-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                    {isSearching ? (
                      <div className="p-4 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 text-krishi-600 animate-spin" />
                        <span>Searching locations...</span>
                      </div>
                    ) : suggestions.length > 0 ? (
                      <ul className="max-h-64 overflow-y-auto divide-y divide-earth-100">
                        {suggestions.map((item, idx) => {
                          const isHighlighted = idx === selectedIndex;
                          const isCity = item.type === 'city';
                          const isVillage = item.type === 'village';
                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => handleSelectLocation(item)}
                                className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-start gap-2.5 ${
                                  isHighlighted ? 'bg-krishi-50 text-krishi-900 font-semibold' : 'hover:bg-earth-50 text-gray-800'
                                }`}
                              >
                                <span className="p-1 rounded-lg bg-earth-100 text-gray-600 shrink-0 mt-0.5">
                                  {isCity ? <Building2 className="w-3.5 h-3.5 text-blue-600" /> : isVillage ? <Home className="w-3.5 h-3.5 text-emerald-600" /> : <MapPin className="w-3.5 h-3.5 text-amber-600" />}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-gray-900 truncate">
                                    {item.placeName || item.displayName.split(',')[0]}
                                  </p>
                                  <p className="text-[11px] text-gray-500 truncate">{item.displayName}</p>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : searchQuery.trim().length >= 2 ? (
                      <div className="p-4 text-center text-xs text-gray-500">
                        {searchError ? (
                          <span className="text-red-600 font-medium">{searchError}</span>
                        ) : (
                          <span>No matching locations found for "{searchQuery}".</span>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Use My Farm Location Button */}
              <button
                type="button"
                onClick={handleUseFarmLocation}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer ${
                  activeLocation?.isFarm
                    ? 'bg-krishi-800 text-white shadow-krishi-900/20 ring-2 ring-krishi-600/30'
                    : 'bg-white hover:bg-earth-100 text-gray-700 border border-earth-300'
                }`}
                title="Reset to your currently selected farm location"
              >
                <MapPin className={`w-3.5 h-3.5 ${activeLocation?.isFarm ? 'text-white' : 'text-krishi-700'}`} />
                <span>Use My Farm</span>
              </button>

              {/* Desktop Refresh Button */}
              <button
                type="button"
                onClick={() => {
                  if (activeLocation) {
                    fetchWeather(activeLocation.lat, activeLocation.lon, activeLocation.label, activeLocation.isFarm, true);
                  }
                }}
                disabled={isRefreshing || isLoading || !activeLocation}
                className="hidden md:inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 bg-white hover:bg-earth-100 rounded-xl border border-earth-300 transition-colors shrink-0 disabled:opacity-50 cursor-pointer shadow-xs"
                title="Refresh real weather data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-krishi-700' : ''}`} />
              </button>

              {/* Voice Narration Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                disabled={!weatherData || isLoading}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
                  isSpeaking
                    ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                    : 'bg-white hover:bg-earth-100 text-gray-700 border-earth-300'
                }`}
                title="Listen to voice weather bulletin"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-krishi-700" />
                    <span className="hidden sm:inline">Bulletin</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* MAIN BODY                                                                 */}
        {/* ========================================================================= */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 flex-1">
          {/* Multi-Farm Switcher if user has multiple parcels */}
          {farms && farms.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider shrink-0">Switch Farm:</span>
              {farms.map((f) => {
                const isCurrent = f.id === farm.id && activeLocation?.isFarm;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      selectFarm(f.id);
                      const fLat = f.location?.latitude || 0;
                      const fLon = f.location?.longitude || 0;
                      const fAddr = f.location?.address || f.location?.district || f.name;
                      if (fLat !== 0 && fLon !== 0) {
                        setActiveLocation({
                          lat: fLat,
                          lon: fLon,
                          label: fAddr,
                          isFarm: true,
                        });
                        fetchWeather(fLat, fLon, fAddr, true);
                      }
                    }}
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

          {/* Missing Farm Location Prompt (when farm has 0 coords and no search active) */}
          {!activeLocation && !isLoading && (
            <div className="p-8 sm:p-12 bg-white rounded-3xl border border-earth-200 shadow-soft text-center max-w-xl mx-auto my-8">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">
                Farm Location Not Set
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                Your farm currently has no GPS coordinates configured. Search any city, village, or district in the search bar above to view real-time weather immediately, or configure your parcel on the My Farm page.
              </p>
              <Button
                variant="primary"
                size="md"
                icon={<Search className="w-4 h-4" />}
                onClick={() => searchInputRef.current?.focus()}
                className="bg-krishi-700 hover:bg-krishi-800 text-white font-bold shadow-md"
              >
                Search a Location
              </Button>
            </div>
          )}

          {/* Error State with Retry Button */}
          {errorMessage && !isLoading && (
            <div className="p-5 sm:p-6 bg-red-50/90 border border-red-200 rounded-3xl text-red-900 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="p-2 bg-red-100 rounded-xl text-red-700 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-950">Weather Telemetry Offline</h3>
                  <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (activeLocation) {
                    fetchWeather(activeLocation.lat, activeLocation.lon, activeLocation.label, activeLocation.isFarm);
                  }
                }}
                className="border-red-300 text-red-800 bg-white hover:bg-red-100 font-bold shrink-0 shadow-xs"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="space-y-6 animate-pulse">
              <div className="h-64 bg-earth-200/60 rounded-3xl flex flex-col items-center justify-center p-6 text-center">
                <div className="w-10 h-10 border-4 border-krishi-700 border-t-transparent rounded-full animate-spin mb-3" />
                <h3 className="text-base font-bold text-gray-800">Fetching live weather telemetry...</h3>
                <p className="text-xs text-gray-500 mt-1 font-medium">Retrieving calibrated satellite & radar readings from Open-Meteo</p>
              </div>
              <div className="h-28 bg-earth-200/40 rounded-3xl"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64 bg-earth-200/40 rounded-3xl"></div>
                <div className="h-64 bg-earth-200/40 rounded-3xl"></div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* LOADED REAL WEATHER EXPERIENCE                                            */}
          {/* ========================================================================= */}
          {!isLoading && weatherData && (
            <div className="space-y-6">
              {/* ========================================================================= */}
              {/* 1. CURRENT WEATHER HERO & 2. RAIN PROBABILITY / PRIMARY METRICS           */}
              {/* ========================================================================= */}
              <div className="bg-white rounded-3xl border border-earth-200/90 shadow-soft p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-krishi-500/10 via-amber-200/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-28 -mt-28" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  {/* Left Column: Location, Big Temp, Condition, Feels Like */}
                  <div className="flex-1 min-w-0 space-y-4">
                    {/* Location Badge & Farm Meta */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-earth-100/80 text-gray-800 border border-earth-200">
                        <MapPin className="w-3.5 h-3.5 text-krishi-700" />
                        <span className="truncate max-w-[280px] sm:max-w-md">{activeLocation?.label}</span>
                      </span>
                      {activeLocation?.isFarm && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <Sprout className="w-3 h-3 text-emerald-600" />
                          <span>{farm.crop?.name ? `Crop: ${farm.crop.name}` : farm.name}</span>
                        </span>
                      )}
                    </div>

                    {/* Primary Weather Display */}
                    <div className="flex items-center gap-5 sm:gap-7">
                      <div className="p-3.5 sm:p-4 bg-gradient-to-b from-earth-50 to-white rounded-3xl border border-earth-200/80 shadow-xs shrink-0 flex items-center justify-center">
                        {getWeatherIcon(weatherData.icon, weatherData.condition)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-baseline">
                          <span className="text-6xl sm:text-7xl font-black text-gray-900 tracking-tight leading-none">
                            {weatherData.temperature}°
                          </span>
                          <span className="text-2xl sm:text-3xl font-bold text-gray-400 ml-1">C</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <p className="text-base sm:text-lg font-bold text-gray-800">
                            {weatherData.condition}
                          </p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs sm:text-sm text-gray-500 font-medium">
                            Feels like <strong className="text-gray-700 font-semibold">{weatherData.apparentTemperature}°C</strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Advisory & Updated Timestamp */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-earth-100">
                      <p className="text-xs text-krishi-900 font-medium flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5 text-krishi-700 shrink-0" />
                        <span className="truncate">{weatherData.advice}</span>
                      </p>
                      <span className="text-[11px] text-gray-400 font-medium shrink-0">
                        Updated at {weatherData.lastUpdated}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: 2. Core Weather Metrics (Rain Chance, Humidity, Wind) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[360px]">
                    {/* Rain Probability Card */}
                    <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center justify-between text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                        <span className="flex items-center gap-1.5">
                          <CloudRain className="w-4 h-4 text-blue-600" />
                          Rain Chance
                        </span>
                        <span className="text-[10px] bg-blue-100 px-1.5 py-0.5 rounded-full font-bold">24h</span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-blue-950">{weatherData.rainProbability24h}%</p>
                      <p className="text-[11px] text-blue-700 font-medium mt-1">
                        {weatherData.forecast7Days?.[1]?.rainProbability !== undefined
                          ? `Tomorrow: ${weatherData.forecast7Days[1].rainProbability}%`
                          : 'Next 24h outlook'}
                      </p>
                    </div>

                    {/* Humidity */}
                    <div className="p-4 rounded-2xl bg-earth-50/80 border border-earth-200/80 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                        <Droplets className="w-4 h-4 text-sky-600" />
                        <span>Humidity</span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-gray-900">{weatherData.humidity}%</p>
                      <p className="text-[11px] text-gray-500 font-medium mt-1">Relative humidity</p>
                    </div>

                    {/* Wind Speed */}
                    <div className="p-4 rounded-2xl bg-earth-50/80 border border-earth-200/80 shadow-xs flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
                        <Wind className="w-4 h-4 text-teal-600" />
                        <span>Wind</span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-gray-900">
                        {weatherData.windSpeedKmh} <span className="text-xs font-semibold text-gray-500">km/h</span>
                      </p>
                      <p className="text-[11px] text-gray-500 font-medium mt-1">Sustained breeze</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* 3. FARM-RELEVANT INSIGHT / ACTION                                         */}
              {/* ========================================================================= */}
              <Card className="p-5 sm:p-6 bg-white border border-earth-200 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-krishi-50 text-krishi-700">
                      <Sprout className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-sm sm:text-base tracking-tight">
                        Farm Weather Insights & Actions
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium">
                        What this weather means for {farm.name || 'your farm'} and actions to take
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-krishi-700 bg-krishi-50 border border-krishi-200 px-2.5 py-0.5 rounded-full">
                    Grounded Advisory
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {farmInsights.map((insight, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-earth-50/60 border border-earth-200/80 hover:border-krishi-300 transition-all flex flex-col justify-between space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 font-bold text-sm text-gray-900">
                          <div className="p-1.5 rounded-xl bg-white border border-earth-200 shadow-2xs">
                            {renderInsightIcon(insight.iconType)}
                          </div>
                          <span className="tracking-tight">{insight.title}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${insight.badgeColor}`}>
                          {insight.badge}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed font-normal">
                        {insight.description}
                      </p>

                      {insight.actionableStep && (
                        <div className="flex items-start gap-1.5 text-xs text-krishi-900 font-semibold bg-white p-2.5 rounded-xl border border-earth-200/70 shadow-2xs">
                          <ArrowUpRight className="w-3.5 h-3.5 text-krishi-700 shrink-0 mt-0.5" />
                          <span>Action: {insight.actionableStep}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* ========================================================================= */}
              {/* 4. HOURLY FORECAST (Next 24 Hours Strip)                                   */}
              {/* ========================================================================= */}
              <Card className="p-5 sm:p-6 bg-white border border-earth-200 shadow-soft">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-krishi-50 text-krishi-700">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-sm sm:text-base tracking-tight">
                        Hourly Forecast (Next 24 Hours)
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium">Temperature and rain chance progression</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                    Scroll horizontally →
                  </span>
                </div>

                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar sm:scrollbar-thin sm:scrollbar-thumb-earth-200">
                  {weatherData.hourlyRainForecast.slice(0, 20).map((point, idx) => {
                    const isNow = idx === 0;
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col items-center justify-between p-3 rounded-2xl min-w-[76px] text-center transition-all shrink-0 ${
                          isNow
                            ? 'bg-krishi-50/80 border-2 border-krishi-600/40 shadow-2xs'
                            : 'bg-earth-50/70 hover:bg-earth-100/70 border border-earth-200/80'
                        }`}
                      >
                        <span className={`text-[11px] font-bold mb-2 ${isNow ? 'text-krishi-800 font-black' : 'text-gray-500'}`}>
                          {isNow ? 'Now' : formatHourTime(point.hour)}
                        </span>

                        <div className="my-1.5">
                          {getSmallWeatherIcon(point.icon, point.condition)}
                        </div>

                        <span className="text-sm font-black text-gray-900 my-1">
                          {point.temperature}°
                        </span>

                        <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1.5 border ${
                          point.rainProbability > 25
                            ? 'text-sky-700 bg-sky-50 border-sky-200'
                            : 'text-gray-500 bg-white/70 border-earth-200'
                        }`}>
                          <Droplets className="w-2.5 h-2.5 text-sky-500 shrink-0" />
                          <span>{point.rainProbability}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* ========================================================================= */}
              {/* 5. 7-DAY FORECAST                                                          */}
              {/* ========================================================================= */}
              <Card className="p-5 sm:p-6 bg-white border border-earth-200 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-krishi-50 text-krishi-700">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-sm sm:text-base tracking-tight">
                        7-Day Forecast Outlook
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium">Daily temperature outlook and precipitation chances</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-gray-500 bg-earth-100 px-2.5 py-0.5 rounded-full">
                    7 Days
                  </span>
                </div>

                <div className="divide-y divide-earth-100">
                  {weatherData.forecast7Days.map((dayItem, idx) => {
                    const isToday = idx === 0;
                    const minPercent = Math.max(0, Math.min(100, ((dayItem.tempMin - weekMinTemp) / tempRangeSpan) * 100));
                    const maxPercent = Math.max(0, Math.min(100, ((dayItem.tempMax - weekMinTemp) / tempRangeSpan) * 100));
                    const barWidth = Math.max(12, maxPercent - minPercent);

                    return (
                      <div
                        key={idx}
                        className={`py-3 flex items-center justify-between gap-3 text-xs sm:text-sm px-2 rounded-xl transition-colors ${
                          isToday ? 'bg-krishi-50/50 font-medium' : 'hover:bg-earth-50/50'
                        }`}
                      >
                        <div className="w-20 sm:w-28 shrink-0 flex items-center gap-1.5">
                          <span className={`truncate font-bold ${isToday ? 'text-krishi-900' : 'text-gray-900'}`}>
                            {dayItem.day}
                          </span>
                          {isToday && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-krishi-100 text-krishi-800 px-1 py-0.2 rounded shrink-0">
                              Today
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {getSmallWeatherIcon(dayItem.icon, dayItem.condition)}
                          <span className="text-xs text-gray-600 truncate hidden md:inline">
                            {dayItem.condition}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-bold text-sky-700 w-12 justify-end shrink-0">
                          <Droplets className="w-3 h-3 text-sky-500 shrink-0" />
                          <span>{dayItem.rainProbability}%</span>
                        </div>

                        <div className="flex items-center gap-2 w-28 sm:w-36 justify-end shrink-0">
                          <span className="text-xs text-gray-400 font-semibold w-7 text-right">
                            {dayItem.tempMin}°
                          </span>
                          <div className="flex-1 h-1.5 bg-earth-200 rounded-full relative overflow-hidden hidden sm:block">
                            <div
                              className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-400 to-rose-500 rounded-full"
                              style={{ left: `${minPercent}%`, width: `${barWidth}%` }}
                            />
                          </div>
                          <span className="text-xs font-black text-gray-900 w-7 text-right">
                            {dayItem.tempMax}°
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* ========================================================================= */}
              {/* 6. WEATHER ALERTS                                                          */}
              {/* ========================================================================= */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-gray-900 text-sm sm:text-base tracking-tight flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Weather Hazards & Alerts
                  </h3>
                  <span className="text-[11px] text-gray-500 font-medium">Real-time radar warning state</span>
                </div>

                {activeAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {activeAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${alert.colorBg} ${alert.colorBorder} ${alert.colorText}`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="p-2 rounded-xl bg-white/90 shadow-2xs shrink-0 mt-0.5">
                            {renderAlertIcon(alert.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-sm tracking-tight">{alert.title}</h4>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${alert.colorBadge}`}>
                                {alert.severity} Severity
                              </span>
                            </div>
                            <p className="text-xs mt-1 opacity-90 leading-relaxed">{alert.description}</p>
                            <div className="text-xs font-bold mt-2 flex items-center gap-1.5 text-gray-900 bg-white/60 px-2.5 py-1 rounded-lg w-fit border border-black/5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-krishi-700 shrink-0" />
                              <span>Action: {alert.action}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl text-xs text-emerald-950 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="font-medium">
                        <strong className="font-bold text-emerald-900">Operations Nominal:</strong> No active severe weather hazards. Conditions are favorable for standard farm tasks.
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full shrink-0 hidden sm:inline">
                      Telemetry Nominal
                    </span>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* 7. SECONDARY METRICS (Visibility, Sunrise, Sunset, Calibrated Radar)       */}
              {/* ========================================================================= */}
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-earth-200/90 shadow-2xs">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3">
                  Secondary Environmental Telemetry
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Visibility */}
                  <div className="p-3 rounded-xl bg-earth-50 border border-earth-100">
                    <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase mb-1">
                      <Eye className="w-3 h-3 text-indigo-600" />
                      <span>Visibility</span>
                    </div>
                    <p className="text-sm sm:text-base font-black text-gray-900">
                      {weatherData.visibilityKm !== undefined ? `${weatherData.visibilityKm} km` : '10 km'}
                    </p>
                    <span className="text-[10px] text-gray-400">Atmospheric clarity</span>
                  </div>

                  {/* Sunrise */}
                  <div className="p-3 rounded-xl bg-earth-50 border border-earth-100">
                    <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase mb-1">
                      <Sunrise className="w-3 h-3 text-amber-500" />
                      <span>Sunrise</span>
                    </div>
                    <p className="text-sm sm:text-base font-black text-gray-900">
                      {weatherData.sunrise || '06:05 AM'}
                    </p>
                    <span className="text-[10px] text-gray-400">Dawn solar start</span>
                  </div>

                  {/* Sunset */}
                  <div className="p-3 rounded-xl bg-earth-50 border border-earth-100">
                    <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase mb-1">
                      <Sunset className="w-3 h-3 text-orange-500" />
                      <span>Sunset</span>
                    </div>
                    <p className="text-sm sm:text-base font-black text-gray-900">
                      {weatherData.sunset || '06:40 PM'}
                    </p>
                    <span className="text-[10px] text-gray-400">Dusk twilight</span>
                  </div>

                  {/* Radar Telemetry Source */}
                  <div className="p-3 rounded-xl bg-earth-50 border border-earth-100">
                    <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase mb-1">
                      <MapPin className="w-3 h-3 text-krishi-700" />
                      <span>Grid Radar</span>
                    </div>
                    <p className="text-xs font-black text-gray-900 truncate">
                      {weatherData.coordinates ? `${weatherData.coordinates.latitude.toFixed(2)}°N, ${weatherData.coordinates.longitude.toFixed(2)}°E` : 'Calibrated'}
                    </p>
                    <span className="text-[10px] text-gray-400">Open-Meteo High-Res</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
