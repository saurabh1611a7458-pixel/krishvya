import React from 'react';
import { Card } from '../common/Card';
import { Crop } from '../../types';
import { Sprout, Calendar, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface CropCardProps {
  crop: Crop;
}

export const CropCard: React.FC<CropCardProps> = ({ crop }) => {
  const { t } = useLanguage();

  return (
    <Card className="hoverable border-krishi-100 bg-gradient-to-br from-white to-krishi-50/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-krishi-100 text-krishi-800">
            <Sprout className="w-5 h-5" />
          </span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
            {t('currentCrop')}
          </h3>
        </div>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
          {crop.stage}
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-2">
        <div>
          <span className="text-3xl font-black text-gray-900">{crop.name}</span>
          <p className="text-sm font-medium text-gray-600 mt-0.5">{crop.variety || 'Standard Variety'}</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-earth-100 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-krishi-600" />
          <span>Sown: {crop.sowingDate}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Harvest: ~45 days</span>
        </div>
      </div>
    </Card>
  );
};
