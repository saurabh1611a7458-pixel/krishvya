import React, { useState } from 'react';
import { Card } from '../common/Card';
import {
  Sprout,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  CloudSun,
  Layers,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface FarmHealthCardProps {
  score: number | null;
  status?: string;
  cropStatus?: 'Good' | 'Check' | 'Action needed' | string;
  soilStatus?: 'Good' | 'Check' | 'Action needed' | string;
  weatherStatus?: 'Normal' | 'Warning' | string;
  actionsCount?: number;
  cropSummary?: string;
  soilSummary?: string;
  weatherSummary?: string;
}

export const FarmHealthCard: React.FC<FarmHealthCardProps> = ({
  score,
  status = 'Optimal Growth',
  cropStatus = 'Good',
  soilStatus = 'Good',
  weatherStatus = 'Normal',
  actionsCount = 0,
  cropSummary,
  soilSummary,
  weatherSummary,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const isSetupNeeded = score === null || score === 0;

  if (isSetupNeeded) {
    return (
      <Card className="relative overflow-hidden border-earth-200/90 bg-gradient-to-br from-white via-white to-earth-50/40 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Farm Status: Setup Needed</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Register your standing crop and sowing date on the My Farm page to compute your real-time farm status.
              </p>
            </div>
          </div>
          <Link
            to="/farm"
            className="px-4 py-2 bg-krishi-700 hover:bg-krishi-800 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 transition-colors"
          >
            Configure Farm
          </Link>
        </div>
      </Card>
    );
  }

  const validScore = Math.min(100, Math.max(0, score));

  const getStatusBadge = (
    state: 'Good' | 'Check' | 'Action needed' | 'Normal' | 'Warning' | string
  ) => {
    switch (state) {
      case 'Action needed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            Action needed
          </span>
        );
      case 'Warning':
      case 'Check':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            {state}
          </span>
        );
      case 'Good':
      case 'Normal':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {state}
          </span>
        );
    }
  };

  return (
    <Card className="relative overflow-hidden border-krishi-200/90 bg-gradient-to-br from-white via-white to-krishi-50/30 p-5 sm:p-6 space-y-5">
      {/* Header Bar: Farm Status & Overall Health Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-earth-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-krishi-100 text-krishi-700">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Farm Status</h2>
            <p className="text-xs text-gray-500">Live command center condition for your farm</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-krishi-50 border border-krishi-200 text-krishi-900 text-xs font-bold">
            <span>Score: {validScore}/100</span>
            <span className="text-krishi-400">•</span>
            <span className="text-krishi-700">{status}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1 text-xs font-bold text-krishi-700 hover:text-krishi-800 py-1 px-2 rounded-lg hover:bg-earth-100 transition-colors"
          >
            {showDetails ? (
              <>
                <span>Hide Details</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>View Details</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Pillars Grid: Crop, Soil, Weather, Farm Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Crop Status */}
        <div className="p-3.5 rounded-2xl bg-white border border-earth-200/90 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
              <Sprout className="w-4 h-4 text-krishi-700" />
              Crop
            </span>
          </div>
          <div>
            {getStatusBadge(cropStatus)}
            {cropSummary && (
              <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{cropSummary}</p>
            )}
          </div>
          <Link
            to="/crop-health"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-krishi-700 hover:text-krishi-800 pt-1"
          >
            <span>My Crop</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 2. Soil Status */}
        <div className="p-3.5 rounded-2xl bg-white border border-earth-200/90 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-700" />
              Soil
            </span>
          </div>
          <div>
            {getStatusBadge(soilStatus)}
            {soilSummary && (
              <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{soilSummary}</p>
            )}
          </div>
          <Link
            to="/soil"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-krishi-700 hover:text-krishi-800 pt-1"
          >
            <span>My Soil</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 3. Weather Status */}
        <div className="p-3.5 rounded-2xl bg-white border border-earth-200/90 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
              <CloudSun className="w-4 h-4 text-blue-600" />
              Weather
            </span>
          </div>
          <div>
            {getStatusBadge(weatherStatus)}
            {weatherSummary && (
              <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{weatherSummary}</p>
            )}
          </div>
          <Link
            to="/weather"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-800 pt-1"
          >
            <span>Weather</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 4. Farm Actions Status */}
        <div className="p-3.5 rounded-2xl bg-white border border-earth-200/90 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-[#166534]" />
              Farm Actions
            </span>
          </div>
          <div>
            {actionsCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                {actionsCount} {actionsCount === 1 ? 'action' : 'actions'} needed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                All clear
              </span>
            )}
            <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
              {actionsCount > 0 ? 'Pending field operations' : 'Up to date'}
            </p>
          </div>
          <Link
            to="/alerts"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#166534] hover:text-[#14532D] pt-1"
          >
            <span>View Alerts</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Progressive Disclosure Details Drawer */}
      {showDetails && (
        <div className="pt-4 border-t border-earth-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in-50 duration-200">
          <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-100">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Crop Condition
            </div>
            <div className="text-xs font-bold text-gray-900">
              {cropSummary || 'Canopy and foliage are in nominal health condition.'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-100">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Soil & Moisture
            </div>
            <div className="text-xs font-bold text-gray-900">
              {soilSummary || 'Soil moisture & nutrient retention within standard parameters.'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-100">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Weather & Outlook
            </div>
            <div className="text-xs font-bold text-gray-900">
              {weatherSummary || 'Favorable microclimate conditions observed for current crop cycle.'}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

