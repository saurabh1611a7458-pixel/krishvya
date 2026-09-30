import React, { useState } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { useFarm } from '../context/FarmContext';
import { useFarmIntelligence } from '../context/FarmIntelligenceContext';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Sprout,
  Droplets,
  ShieldCheck,
  Layers,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CropPlannerPage: React.FC = () => {
  const { farm } = useFarm();
  const { intelligence } = useFarmIntelligence();
  const [selectedSeason, setSelectedSeason] = useState<'rabi' | 'zaid'>('rabi');

  const hasCrop = Boolean(farm.crop?.name || farm.crop_variety);

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case 'irrigation':
        return <Droplets className="w-4 h-4 text-blue-600" />;
      case 'protection':
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
      case 'fertilizer':
        return <Layers className="w-4 h-4 text-emerald-600" />;
      default:
        return <Sprout className="w-4 h-4 text-krishi-700" />;
    }
  };

  // Rotation plans based on soil suitability
  const rotationOptions = {
    rabi: [
      {
        crop: 'Chickpea / Bengal Gram (Chana)',
        duration: '100 - 110 days',
        waterReq: 'Low (2 irrigations)',
        benefit: 'Restores up to 40 kg/ha nitrogen to soil for next Kharif season',
        recommended: true,
      },
      {
        crop: 'Wheat (High-Yield Grain)',
        duration: '115 - 125 days',
        waterReq: 'Medium-High (4-5 irrigations)',
        benefit: 'Stable grain yield and assured local procurement',
        recommended: farm.soil?.soilType?.toLowerCase().includes('clay') || false,
      },
      {
        crop: 'Mustard / Rapeseed',
        duration: '90 - 100 days',
        waterReq: 'Low (1-2 irrigations)',
        benefit: 'Natural bio-fumigation effect reducing soil-borne root wilt fungi',
        recommended: false,
      },
    ],
    zaid: [
      {
        crop: 'Green Gram (Moong)',
        duration: '60 - 65 days',
        waterReq: 'Low (Assured summer drip)',
        benefit: 'Short duration summer legume that enriches soil organic matter',
        recommended: true,
      },
      {
        crop: 'Sesame (Til)',
        duration: '75 - 85 days',
        waterReq: 'Very Low',
        benefit: 'High heat tolerance during peak summer temperature spikes',
        recommended: false,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-krishi-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Farm Plan
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Weekly field operations schedule and seasonal rotation for {farm.name || 'your farm'}
            </p>
          </div>

          {farm.name && (
            <span className="text-xs font-bold text-gray-700 bg-earth-100 px-3 py-1 rounded-full border border-earth-200 w-fit">
              {farm.name} • {farm.crop?.name || 'Crop'}
            </span>
          )}
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Standing Crop Status Banner */}
          {!hasCrop ? (
            <Card className="p-6 bg-white border border-earth-200 shadow-soft">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Crop Profile Required</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Configure your standing crop and sowing date on My Farm to generate calibrated weekly field tasks.
                    </p>
                  </div>
                </div>
                <Link
                  to="/farm"
                  className="px-4 py-2 bg-krishi-700 hover:bg-krishi-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                >
                  Configure Crop
                </Link>
              </div>
            </Card>
          ) : (
            <div className="bg-white p-5 rounded-3xl border border-earth-200/90 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                  Active Field Subject
                </span>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-0.5">
                  {farm.crop?.name || farm.crop_variety} ({farm.crop?.stage || farm.crop_stage || 'Active Growth'})
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Parcel: {farm.size} {farm.sizeUnit || 'acres'} • Soil: {farm.soil?.soilType || 'Loam'} • Irrigation: {farm.irrigationType || 'Drip / Canal'}
                </p>
              </div>

              <div className="flex items-center gap-2 bg-krishi-50 px-3.5 py-2 rounded-2xl border border-krishi-200 text-krishi-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-krishi-700 shrink-0" />
                <span>Growth Phase Monitored</span>
              </div>
            </div>
          )}

          {/* SECTION 1: "WHAT SHOULD I DO THIS WEEK?" (Farmer-First Core) */}
          <Card className="p-6 bg-white border border-earth-200 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-earth-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-krishi-100 text-krishi-700">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base tracking-tight">
                    What Should I Do This Week?
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Recommended operational schedule synthesized from current crop stage and weather forecast
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-krishi-100 text-krishi-800 px-2.5 py-1 rounded-full border border-krishi-200">
                Weekly Plan
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {intelligence.weeklyTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    task.priority === 'high'
                      ? 'bg-amber-50/50 border-amber-200/90 shadow-2xs'
                      : 'bg-earth-50/60 border-earth-200/80 hover:border-krishi-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-white border border-earth-200 shadow-2xs">
                        {renderCategoryIcon(task.category)}
                      </div>
                      <span className="text-xs font-extrabold text-gray-900">{task.day}</span>
                    </div>
                    {task.priority === 'high' ? (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Priority Action
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                        Routine
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">{task.title}</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{task.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* SECTION 2: SEASONAL ROTATION OPTIONS */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base tracking-tight">
                  Next Season Crop Rotation
                </h3>
                <p className="text-[11px] text-gray-500">
                  Plan ahead to preserve soil microbiome and break pest cycles after {farm.crop?.name || 'standing crop'}
                </p>
              </div>

              {/* Season Toggle */}
              <div className="flex items-center gap-1 bg-earth-100 p-1 rounded-xl text-xs font-bold text-gray-700 w-fit">
                <button
                  onClick={() => setSelectedSeason('rabi')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    selectedSeason === 'rabi' ? 'bg-white text-krishi-900 shadow-xs' : 'hover:text-gray-900'
                  }`}
                >
                  Rabi (Winter)
                </button>
                <button
                  onClick={() => setSelectedSeason('zaid')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    selectedSeason === 'zaid' ? 'bg-white text-krishi-900 shadow-xs' : 'hover:text-gray-900'
                  }`}
                >
                  Zaid (Summer)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rotationOptions[selectedSeason].map((plan) => (
                <Card
                  key={plan.crop}
                  className={`p-5 flex flex-col justify-between border transition-all ${
                    plan.recommended
                      ? 'border-krishi-400 bg-gradient-to-br from-white to-krishi-50/30 ring-2 ring-krishi-500/20 shadow-soft-lg'
                      : 'border-earth-200/90 bg-white'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-earth-100 text-gray-600">
                        {plan.duration}
                      </span>
                      {plan.recommended && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-krishi-100 text-krishi-800 px-2 py-0.5 rounded-full border border-krishi-300">
                          Recommended
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900">{plan.crop}</h4>
                      <p className="text-xs text-gray-500 mt-1">Water Need: {plan.waterReq}</p>
                    </div>

                    <div className="p-3 bg-earth-50 rounded-xl border border-earth-100 text-xs text-gray-700 leading-relaxed">
                      <span className="font-bold text-krishi-800 block mb-0.5">Soil Benefit:</span>
                      {plan.benefit}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-earth-100 flex items-center justify-between text-xs">
                    <Link
                      to="/ai-advisor"
                      className="text-krishi-700 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      Ask AI about this crop <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
