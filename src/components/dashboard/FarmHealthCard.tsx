import React from 'react';
import { Card } from '../common/Card';
import { Sprout, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface FarmHealthCardProps {
  score: number;
}

export const FarmHealthCard: React.FC<FarmHealthCardProps> = ({ score }) => {
  const { t } = useLanguage();

  // Score styling
  const circumference = 2 * Math.PI * 38;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="relative overflow-hidden border-krishi-200/90 bg-gradient-to-br from-white via-white to-krishi-50/40">
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
        {/* Left Score Details */}
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-krishi-100 text-krishi-700">
              <Sprout className="w-5 h-5" />
            </span>
            <span className="text-sm font-bold uppercase tracking-wider text-krishi-800">
              {t('farmHealth')}
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-center sm:justify-start gap-2">
            <span className="text-5xl font-black text-gray-900 tracking-tight">{score}</span>
            <span className="text-xl font-bold text-gray-400">/ 100</span>
          </div>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-krishi-100/90 text-krishi-800 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-krishi-600" />
            <span>{t('farmDoingWell')}</span>
          </div>
        </div>

        {/* Circular Ring Gauge */}
        <div className="relative flex items-center justify-center">
          <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r="38"
              stroke="#E2E8F0"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress value */}
            <circle
              cx="50"
              cy="50"
              r="38"
              stroke="#16a34a"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <TrendingUp className="w-6 h-6 text-krishi-600 mb-0.5" />
            <span className="text-xs font-bold text-gray-500 uppercase">Status</span>
          </div>
        </div>
      </div>

      {/* Mini metric bars below */}
      <div className="mt-6 pt-4 border-t border-earth-100 grid grid-cols-3 gap-2 text-center">
        <div className="bg-earth-50 rounded-xl p-2">
          <div className="text-[11px] font-medium text-gray-500">Soil</div>
          <div className="text-sm font-bold text-krishi-800">78% Good</div>
        </div>
        <div className="bg-earth-50 rounded-xl p-2">
          <div className="text-[11px] font-medium text-gray-500">Water</div>
          <div className="text-sm font-bold text-krishi-800">Optimal</div>
        </div>
        <div className="bg-earth-50 rounded-xl p-2">
          <div className="text-[11px] font-medium text-gray-500">Crop Canopy</div>
          <div className="text-sm font-bold text-krishi-800">82% High</div>
        </div>
      </div>
    </Card>
  );
};
