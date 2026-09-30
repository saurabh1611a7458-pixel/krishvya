import React from 'react';
import { Card } from '../common/Card';
import { CloudSun, Droplets, Wind, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WeatherCardProps {
  weather: any;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ weather }) => {
  const hasTemp = typeof weather?.temperature === 'number' && weather.temperature !== 0;
  const tomorrowForecast = weather?.forecast7Days?.[1];
  const tomorrowRain = tomorrowForecast?.rainProbability;

  return (
    <Card className="hoverable border-sky-100 bg-gradient-to-br from-white to-sky-50/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
            <CloudSun className="w-5 h-5" />
          </span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
            Weather
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
          Live Radar
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-2">
        <div>
          <span className="text-3xl sm:text-4xl font-black text-gray-900">
            {hasTemp ? `${weather.temperature}°C` : '--°C'}
          </span>
          <p className="text-xs sm:text-sm font-medium text-gray-600 mt-0.5 truncate max-w-[140px]">
            {weather?.condition || 'Telemetry Ready'}
          </p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/60">
            <Droplets className="w-3.5 h-3.5 text-sky-600" />
            <span>{typeof weather?.rainProbability === 'number' ? `${weather.rainProbability}% Rain` : '0% Rain'}</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 truncate">
            {typeof tomorrowRain === 'number' ? `${tomorrowRain}% rain tomorrow` : '24h forecast'}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-earth-100 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Wind className="w-3.5 h-3.5 text-sky-500" />
          <span>Wind: <strong>{weather?.windSpeedKmh || 0} km/h</strong></span>
        </div>
        <Link to="/weather" className="text-sky-700 font-bold hover:underline inline-flex items-center gap-0.5">
          Check Forecast <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </Card>
  );
};
