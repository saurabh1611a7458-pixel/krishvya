import React from 'react';
import { Card } from '../common/Card';
import { Droplets, CheckCircle } from 'lucide-react';
import { SoilData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface SoilCardProps {
  soil: SoilData;
}

export const SoilCard: React.FC<SoilCardProps> = ({ soil }) => {
  const { t } = useLanguage();

  return (
    <Card className="hoverable border-amber-100 bg-gradient-to-br from-white to-amber-50/25">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
            <Droplets className="w-5 h-5" />
          </span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
            {t('soilMoisture')}
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-krishi-100 text-krishi-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {t('good')}
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-2">
        <div>
          <span className="text-4xl font-black text-gray-900">{soil.moisturePercentage}%</span>
          <p className="text-sm font-medium text-gray-600 mt-0.5">{soil.soilType}</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-gray-500">pH Level</div>
          <div className="text-lg font-bold text-gray-800">{soil.ph} (Balanced)</div>
        </div>
      </div>

      {/* Mini nutrient indicators */}
      <div className="mt-4 pt-3 border-t border-earth-100 flex items-center justify-between text-xs text-gray-600">
        <div>N: <strong className="text-krishi-700">{soil.nitrogen}</strong></div>
        <span className="text-gray-300">•</span>
        <div>P: <strong className="text-amber-700">{soil.phosphorus}</strong></div>
        <span className="text-gray-300">•</span>
        <div>K: <strong className="text-krishi-700">{soil.potassium}</strong></div>
      </div>
    </Card>
  );
};
