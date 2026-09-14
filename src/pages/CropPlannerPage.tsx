import React, { useState } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useFarm } from '../context/FarmContext';
import {
  CalendarDays,
  Coins,
} from 'lucide-react';

export const CropPlannerPage: React.FC = () => {
  const { farm } = useFarm();
  const [selectedSeason, setSelectedSeason] = useState<'rabi' | 'zaid'>('rabi');

  const plans = {
    rabi: [
      {
        crop: 'Chickpea / Bengal Gram (Chana)',
        duration: '100 - 110 days',
        waterReq: 'Low (2 irrigations)',
        costPerAcre: '₹8,500',
        expectedReturn: '₹28,000',
        profitEstimate: '₹19,500 / acre',
        benefit: 'Restores 45 kg/ha nitrogen to soil for next Kharif season',
        recommended: true,
      },
      {
        crop: 'Wheat (Sharbati / Lokwan)',
        duration: '115 - 125 days',
        waterReq: 'Medium-High (4-5 irrigations)',
        costPerAcre: '₹12,000',
        expectedReturn: '₹34,000',
        profitEstimate: '₹22,000 / acre',
        benefit: 'Stable MSP procurement market in Maharashtra',
        recommended: false,
      },
      {
        crop: 'Mustard (Pusa Bold)',
        duration: '90 - 100 days',
        waterReq: 'Low (1-2 irrigations)',
        costPerAcre: '₹6,000',
        expectedReturn: '₹22,500',
        profitEstimate: '₹16,500 / acre',
        benefit: 'Natural bio-fumigation against soil-borne wilt fungi',
        recommended: false,
      },
    ],
    zaid: [
      {
        crop: 'Green Gram (Moong)',
        duration: '60 - 65 days',
        waterReq: 'Low (Assured summer drip)',
        costPerAcre: '₹5,500',
        expectedReturn: '₹18,000',
        profitEstimate: '₹12,500 / acre',
        benefit: 'Short duration summer cash crop',
        recommended: true,
      },
      {
        crop: 'Sesame (Til)',
        duration: '75 - 85 days',
        waterReq: 'Very Low',
        costPerAcre: '₹4,500',
        expectedReturn: '₹17,000',
        profitEstimate: '₹12,500 / acre',
        benefit: 'High heat tolerance during May drought',
        recommended: false,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-krishi-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Crop & Profit Planner
              </h1>
            </div>
            <p className="text-xs text-gray-500">
              Intercropping schedules, soil nutrient regeneration, and estimated net profit
            </p>
          </div>

          {/* Season Switcher */}
          <div className="flex items-center gap-2 bg-earth-100 p-1 rounded-xl text-xs font-bold text-gray-700">
            <button
              onClick={() => setSelectedSeason('rabi')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedSeason === 'rabi' ? 'bg-white text-krishi-900 shadow-xs' : 'hover:text-gray-900'
              }`}
            >
              Rabi Season (Winter)
            </button>
            <button
              onClick={() => setSelectedSeason('zaid')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedSeason === 'zaid' ? 'bg-white text-krishi-900 shadow-xs' : 'hover:text-gray-900'
              }`}
            >
              Zaid Season (Summer)
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-earth-200/90 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase">Current Standing Crop</span>
              <h3 className="text-lg font-black text-gray-900">
                {farm.crop.name} ({farm.crop.stage}) • Harvest in ~45 days
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Target Rotation: Prepare soil for sowing within 2 weeks of soybean harvest.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-bold">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span>Projected Seasonal Return: ₹48,000 - ₹55,000</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans[selectedSeason].map((plan) => (
              <Card
                key={plan.crop}
                className={`p-6 flex flex-col justify-between border transition-all ${
                  plan.recommended
                    ? 'border-krishi-400 bg-gradient-to-br from-white to-krishi-50/30 ring-2 ring-krishi-500/20 shadow-soft-lg'
                    : 'border-earth-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">🌱</span>
                    {plan.recommended && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-krishi-100 text-krishi-800 border border-krishi-300">
                        Recommended for Soil
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.crop}</h3>
                  <div className="text-xs text-gray-500 mb-4">{plan.duration} • {plan.waterReq}</div>

                  <div className="space-y-2 text-xs bg-earth-50/70 p-3 rounded-xl border border-earth-200/80 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Input Cost</span>
                      <strong className="text-gray-800">{plan.costPerAcre}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gross Harvest Value</span>
                      <strong className="text-gray-800">{plan.expectedReturn}</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-earth-200">
                      <span className="font-bold text-emerald-800">Net Profit</span>
                      <strong className="font-black text-emerald-700">{plan.profitEstimate}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    💡 <strong>Regenerative Impact:</strong> {plan.benefit}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-earth-100">
                  <Button variant={plan.recommended ? 'primary' : 'outline'} size="sm" fullWidth>
                    Select This Rotation Plan
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
