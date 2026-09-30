import React from 'react';
import { Card } from '../common/Card';
import { Droplets, ArrowRight } from 'lucide-react';
import { SoilData } from '../../types';
import { Link } from 'react-router-dom';

interface SoilCardProps {
  soil?: SoilData;
}

export const SoilCard: React.FC<SoilCardProps> = ({ soil }) => {
  const hasSoil = Boolean(soil && (soil.moisturePercentage > 0 || soil.ph > 0 || soil.soilType));

  const getPhClassification = (ph: number) => {
    if (ph < 6.0) return 'Acidic';
    if (ph > 7.8) return 'Alkaline';
    return 'Balanced';
  };

  const getMoistureStatus = (m: number) => {
    if (m < 25) return { label: 'Dry', color: 'bg-amber-100 text-amber-800' };
    if (m > 75) return { label: 'Wet', color: 'bg-blue-100 text-blue-800' };
    return { label: 'Optimal', color: 'bg-emerald-100 text-emerald-800' };
  };

  const moistureInfo = getMoistureStatus(soil?.moisturePercentage || 0);

  if (!hasSoil) {
    return (
      <Card className="hoverable border-amber-100 bg-gradient-to-br from-white to-amber-50/25">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <Droplets className="w-5 h-5" />
            </span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
              Soil Health
            </h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-earth-100 text-gray-600">
            Pending
          </span>
        </div>
        <div className="py-2">
          <p className="text-sm font-bold text-gray-800">No Soil Test</p>
          <p className="text-xs text-gray-500 mt-0.5">Record a soil test for NPK & moisture</p>
        </div>
        <div className="mt-4 pt-3 border-t border-earth-100 text-xs">
          <Link to="/soil" className="text-amber-800 font-bold hover:underline inline-flex items-center gap-1">
            Record Soil Test <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hoverable border-amber-100 bg-gradient-to-br from-white to-amber-50/25">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
            <Droplets className="w-5 h-5" />
          </span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
            My Soil
          </h3>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${moistureInfo.color}`}>
          {moistureInfo.label}
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-2">
        <div>
          <span className="text-3xl sm:text-4xl font-black text-gray-900">
            {soil?.moisturePercentage ? `${soil.moisturePercentage}%` : '--%'}
          </span>
          <p className="text-xs sm:text-sm font-medium text-gray-600 mt-0.5 truncate max-w-[130px]">
            {soil?.soilType || 'Soil Moisture'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-gray-500">pH Level</div>
          <div className="text-base sm:text-lg font-bold text-gray-800">
            {soil?.ph ? `${soil.ph} (${getPhClassification(soil.ph)})` : '--'}
          </div>
        </div>
      </div>

      {/* Mini nutrient indicators */}
      <div className="mt-4 pt-3 border-t border-earth-100 flex items-center justify-between text-xs text-gray-600">
        <div>N: <strong className="text-krishi-700">{soil?.nitrogen || 'Med'}</strong></div>
        <span className="text-gray-300">•</span>
        <div>P: <strong className="text-amber-700">{soil?.phosphorus || 'Med'}</strong></div>
        <span className="text-gray-300">•</span>
        <Link to="/soil" className="text-krishi-700 font-bold hover:underline inline-flex items-center gap-0.5">
          Check Soil <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </Card>
  );
};
