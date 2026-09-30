import React from 'react';
import { Card } from '../common/Card';
import { Crop } from '../../types';
import { Sprout, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CropCardProps {
  crop?: Crop;
}

export const CropCard: React.FC<CropCardProps> = ({ crop }) => {
  const hasCrop = Boolean(crop && crop.name);

  if (!hasCrop) {
    return (
      <Card className="hoverable border-krishi-100 bg-gradient-to-br from-white to-krishi-50/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-krishi-100 text-krishi-800">
              <Sprout className="w-5 h-5" />
            </span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
              My Crop
            </h3>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            Unset
          </span>
        </div>
        <div className="py-2">
          <p className="text-sm font-bold text-gray-800">No Crop Set</p>
          <p className="text-xs text-gray-500 mt-0.5">Register crop to monitor stages</p>
        </div>
        <div className="mt-4 pt-3 border-t border-earth-100 text-xs">
          <Link to="/farm" className="text-krishi-700 font-bold hover:underline inline-flex items-center gap-1">
            Configure Crop <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hoverable border-krishi-100 bg-gradient-to-br from-white to-krishi-50/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-krishi-100 text-krishi-800">
            <Sprout className="w-5 h-5" />
          </span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
            My Crop
          </h3>
        </div>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 truncate max-w-[110px]">
          {crop?.stage || 'Active Growth'}
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-2">
        <div className="min-w-0">
          <span className="text-2xl sm:text-3xl font-black text-gray-900 truncate block">
            {crop?.name}
          </span>
          <p className="text-xs sm:text-sm font-medium text-gray-600 mt-0.5 truncate">
            {crop?.variety ? `Var: ${crop.variety}` : 'Variety registered'}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-earth-100 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1 truncate">
          <Calendar className="w-3.5 h-3.5 text-krishi-600 shrink-0" />
          <span className="truncate">Sown: {crop?.sowingDate || 'Recent'}</span>
        </div>
        <Link to="/crop-health" className="text-krishi-700 font-bold hover:underline inline-flex items-center gap-0.5 shrink-0">
          Check My Crop <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </Card>
  );
};
