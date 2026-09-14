import React from 'react';
import { Card } from '../common/Card';
import { CloudSun, Droplets, Wind } from 'lucide-react';
import { WeatherData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface WeatherCardProps {
  weather: WeatherData;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ weather }) => {
  const { t } = useLanguage();

  return (
    <Card className="hoverable border-sky-100 bg-gradient-to-br from-white to-sky-50/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
            <CloudSun className="w-5 h-5" />
          </span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
            {t('weather')}
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
          Today
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-2">
        <div>
          <span className="text-4xl font-black text-gray-900">{weather.temperature}°C</span>
          <p className="text-sm font-medium text-gray-600 mt-0.5">{weather.condition}</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1 text-sm font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/60">
            <Droplets className="w-4 h-4 text-sky-600" />
            <span>{weather.rainProbability}% Rain</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">High chance tomorrow</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-earth-100 grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-sky-500" />
          <span>Humidity: <strong>{weather.humidity}%</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-sky-500" />
          <span>Wind: <strong>{weather.windSpeedKmh} km/h</strong></span>
        </div>
      </div>
    </Card>
  );
};
