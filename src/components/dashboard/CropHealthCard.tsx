import React from 'react';
import { Card } from '../common/Card';
import { SatelliteData } from '../../types';
import { Satellite, CheckCircle, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { Link } from 'react-router-dom';

interface CropHealthCardProps {
  satellite: SatelliteData;
}

export const CropHealthCard: React.FC<CropHealthCardProps> = ({ satellite }) => {
  const { t } = useLanguage();

  return (
    <Card className="hoverable border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
            <Satellite className="w-5 h-5" />
          </span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
            {t('cropHealth')}
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-krishi-100 text-krishi-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {t('good')}
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-2">
        <div>
          <span className="text-4xl font-black text-gray-900">{satellite.healthScore}%</span>
          <p className="text-sm font-medium text-gray-600 mt-0.5">Vegetative Density</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-gray-500">NDVI Index</div>
          <div className="text-lg font-bold text-krishi-700">{satellite.ndvi} (High)</div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-earth-100 flex items-center justify-between text-xs text-gray-500">
        <span>Updated: {satellite.lastUpdated}</span>
        <Link to="/crop-health" className="inline-flex items-center gap-0.5 text-krishi-700 font-semibold hover:underline">
          Satellite Map <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};
