import React from 'react';
import { Card } from '../common/Card';
import { SatelliteData } from '../../types';
import { Satellite, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CropHealthCardProps {
  satellite?: SatelliteData;
}

export const CropHealthCard: React.FC<CropHealthCardProps> = ({ satellite }) => {
  const hasSatellite = Boolean(satellite && (satellite.healthScore > 0 || satellite.ndvi > 0));

  const getNdviStatus = (ndvi: number) => {
    if (ndvi >= 0.6) return 'High';
    if (ndvi >= 0.4) return 'Good';
    if (ndvi >= 0.2) return 'Moderate';
    return 'Sparse';
  };

  if (!hasSatellite) {
    return (
      <Card className="hoverable border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Satellite className="w-5 h-5" />
            </span>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
              Canopy Vigor
            </h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-earth-100 text-gray-600">
            Pending
          </span>
        </div>
        <div className="py-2">
          <p className="text-sm font-bold text-gray-800">Satellite Imagery</p>
          <p className="text-xs text-gray-500 mt-0.5">Capture observations to compute NDVI</p>
        </div>
        <div className="mt-4 pt-3 border-t border-earth-100 text-xs">
          <Link to="/crop-health" className="text-emerald-800 font-bold hover:underline inline-flex items-center gap-1">
            Check Crop Health <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </Card>
    );
  }

  const ndviLabel = getNdviStatus(satellite?.ndvi || 0);

  return (
    <Card className="hoverable border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
            <Satellite className="w-5 h-5" />
          </span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">
            Canopy Vigor
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-krishi-100 text-krishi-800">
          Vegetative
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-2">
        <div>
          <span className="text-3xl sm:text-4xl font-black text-gray-900">
            {satellite?.healthScore ? `${satellite.healthScore}%` : '--%'}
          </span>
          <p className="text-xs sm:text-sm font-medium text-gray-600 mt-0.5">Vegetative Density</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-gray-500">NDVI Index</div>
          <div className="text-base sm:text-lg font-bold text-krishi-700">
            {satellite?.ndvi ? `${satellite.ndvi} (${ndviLabel})` : '--'}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-earth-100 flex items-center justify-between text-xs text-gray-500">
        <span className="truncate">{satellite?.lastUpdated ? `Updated ${satellite.lastUpdated}` : 'Recent Pass'}</span>
        <Link to="/crop-health" className="inline-flex items-center gap-0.5 text-krishi-700 font-bold hover:underline shrink-0">
          Check My Crop <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
};
