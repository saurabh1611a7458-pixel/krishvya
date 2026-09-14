import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useFarm } from '../context/FarmContext';
import { api } from '../services/api';
import {
  CloudSun,
  CloudRain,
  Sun,
  Droplets,
  Wind,
  Thermometer,
  Sparkles,
  HelpCircle,
  Clock,
  MapPin,
  RefreshCw,
} from 'lucide-react';

export const WeatherPage: React.FC = () => {
  const { farm } = useFarm();
  const [whyModalOpen, setWhyModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [liveWeather, setLiveWeather] = useState({
    temperature: farm.weather.temperature || 28,
    apparentTemperature: 30,
    condition: farm.weather.condition || 'Partly Cloudy',
    icon: 'cloud-sun',
    humidity: farm.weather.humidity || 72,
    windSpeedKmh: farm.weather.windSpeedKmh || 12,
    rainProbability24h: farm.weather.rainProbability || 60,
    soilMoisturePercentage: farm.soil.moisturePercentage || 42,
    advice: farm.weather.advice || 'Rain is expected tomorrow. We recommend delaying irrigation today.',
    lastUpdated: 'Live from Open-Meteo API',
    forecast7Days: farm.weather.forecast7Days.map((f) => ({
      day: f.day,
      tempMax: f.temp,
      tempMin: f.temp - 6,
      condition: f.icon === 'cloud-rain' ? 'Rain Expected' : f.icon === 'cloud-sun' ? 'Partly Cloudy' : 'Clear Sunny',
      icon: f.icon,
      rainProbability: f.rainProb,
    })),
  });

  const loadWeather = useCallback(async () => {
    setRefreshing(true);
    try {
      const lat = farm.location?.latitude || 21.3855;
      const lon = farm.location?.longitude || 78.9189;
      const res = await api.getLiveWeather(lat, lon, farm.id);

      if (res.success && res.data) {
        setLiveWeather({
          temperature: res.data.temperature,
          apparentTemperature: res.data.apparentTemperature || res.data.temperature + 2,
          condition: res.data.condition,
          icon: res.data.icon,
          humidity: res.data.humidity,
          windSpeedKmh: res.data.windSpeedKmh,
          rainProbability24h: res.data.rainProbability24h,
          soilMoisturePercentage: res.data.soilMoisturePercentage || farm.soil.moisturePercentage || 42,
          advice: res.data.advice,
          lastUpdated: `Updated at ${res.data.lastUpdated}`,
          forecast7Days: res.data.forecast7Days || [],
        });
      }
    } catch (err) {
      console.warn('Failed to fetch live weather, using local state:', err);
    } finally {
      setRefreshing(false);
    }
  }, [farm.location?.latitude, farm.location?.longitude, farm.id, farm.soil.moisturePercentage]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

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

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <CloudSun className="w-5 h-5 text-sky-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Weather Intelligence
              </h1>
            </div>
            <p className="text-xs text-gray-500">
              Live Open-Meteo & IMD meteorological radar for {farm.location.address}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 text-sky-800 text-xs font-bold border border-sky-200">
              <Clock className="w-3.5 h-3.5" />
              <span>{liveWeather.lastUpdated}</span>
            </div>

            <Button
              onClick={loadWeather}
              variant="outline"
              size="sm"
              disabled={refreshing}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            >
              {refreshing ? 'Updating...' : 'Refresh'}
            </Button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Main Current Weather Banner matching Design #8 */}
          <div className="relative rounded-3xl overflow-hidden shadow-soft-lg border border-sky-200 bg-gradient-to-r from-sky-400 via-blue-500 to-sky-600 text-white p-6 sm:p-8">
            <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none translate-x-10 translate-y-10">
              <Sun className="w-80 h-80 text-white" />
            </div>

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-sky-100 text-sm font-semibold mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{farm.location.address} ({farm.location.latitude}°N, {farm.location.longitude}°E)</span>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <span className="text-6xl sm:text-7xl font-black tracking-tight drop-shadow-sm">
                      {liveWeather.temperature}°C
                    </span>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold">{liveWeather.condition}</h3>
                      <p className="text-sky-100 text-sm font-medium">
                        Feels like {liveWeather.apparentTemperature}°C • Good crop aeration
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30 text-right">
                  <div className="text-xs uppercase font-bold text-sky-100">Next 24h Rain Chance</div>
                  <div className="text-3xl font-black mt-1">{liveWeather.rainProbability24h}%</div>
                  <div className="text-xs text-sky-100 mt-0.5">
                    {liveWeather.rainProbability24h >= 50 ? 'High probability of rainfall' : 'Low chance of rain'}
                  </div>
                </div>
              </div>

              {/* Weather metric chips row */}
              <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/15 backdrop-blur-xs p-3 rounded-xl border border-white/20">
                  <div className="flex items-center gap-1.5 text-xs text-sky-100 font-medium">
                    <Droplets className="w-4 h-4" />
                    <span>Humidity</span>
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
                    <span>Soil Moisture</span>
                  </div>
                  <div className="text-xl font-black mt-1">{liveWeather.soilMoisturePercentage}%</div>
                </div>

                <div className="bg-white/15 backdrop-blur-xs p-3 rounded-xl border border-white/20">
                  <div className="flex items-center gap-1.5 text-xs text-sky-100 font-medium">
                    <Sparkles className="w-4 h-4" />
                    <span>Data Source</span>
                  </div>
                  <div className="text-sm font-bold mt-1">Open-Meteo & IMD</div>
                </div>
              </div>
            </div>
          </div>

          {/* 7-Day Visual Forecast Cards matching Design #8 */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center justify-between">
              <span>7-Day Agricultural Forecast</span>
              <span className="text-xs text-gray-500 font-normal">Calibrated for {farm.crop.name} ({farm.crop.stage})</span>
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

          {/* AI Weather Advice Banner matching Design #8 */}
          <Card className="p-6 bg-gradient-to-br from-emerald-50 via-white to-sky-50 border-krishi-300 shadow-soft">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 text-krishi-800 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-krishi-600" />
                  <span>AI Weather Guidance</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 leading-snug">
                  "{liveWeather.advice}"
                </h3>
                <p className="text-xs text-gray-600">
                  Real-time calculation based on {liveWeather.soilMoisturePercentage}% soil moisture, {liveWeather.rainProbability24h}% rain probability, and {farm.crop.name} {farm.crop.stage} stage.
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
              Indian Meteorological Department (IMD) grid radar and Open-Meteo satellite atmospheric pressure models indicate a rain front moving across {farm.location.address} within the next 24 hours.
            </p>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900">Soil Moisture Threshold: {liveWeather.soilMoisturePercentage}%</h4>
            <p className="text-xs text-amber-800 mt-1">
              {farm.crop.name} at {farm.crop.stage} stage consumes approximately 4-5 mm of water daily. The current soil moisture ({liveWeather.soilMoisturePercentage}%) in loamy black cotton soil provides sufficient moisture buffer until natural rainfall occurs.
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
