import React, { useState } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  SlidersHorizontal,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const WhatIfPage: React.FC = () => {

  const [rainfallShift, setRainfallShift] = useState<number>(-20);
  const [activeScenario, setActiveScenario] = useState<string>('Rainfall -20%');

  // Dynamically calculate simulation consequences based on rainfall shift
  const baseYield = 22;
  const yieldImpact = Math.round(baseYield * (1 + rainfallShift / 100 * 0.9));
  const waterReqChange = rainfallShift < 0 ? Math.abs(rainfallShift) * 0.75 : -(rainfallShift * 0.6);
  const stressLevel = rainfallShift <= -25 ? 'Critical' : rainfallShift < 0 ? 'High' : rainfallShift === 0 ? 'Normal' : 'Optimal';

  const otherScenarios = [
    { name: 'Reduce irrigation (-15%)', shift: -15, label: 'Reduce irrigation' },
    { name: 'Higher temperature (+2°C)', shift: -25, label: 'Higher temperature' },
    { name: 'Use more compost (+30%)', shift: 15, label: 'Use more compost' },
    { name: 'Increase organic matter', shift: 20, label: 'Increase organic matter' },
    { name: 'Change crop to Chickpea', shift: 10, label: 'Change crop' },
  ];

  const handleApplyScenario = (label: string, shift: number) => {
    setActiveScenario(label);
    setRainfallShift(shift);
  };

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-krishi-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                What-If Simulator
              </h1>
            </div>
            <p className="text-xs text-gray-500">Explore the yield and economic impact of different climate scenarios</p>
          </div>

          <span className="text-xs font-bold text-gray-600 bg-earth-100 px-3 py-1 rounded-full">
            AI Crop Model: DSSAT v4.8
          </span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Interactive Simulation Controls matching Design #13 */}
            <div className="lg:col-span-6 space-y-4">
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    What if rainfall decreases / increases?
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Drag the slider to test monsoon deficit or unseasonal rainfall extremes.
                  </p>
                </div>

                {/* Slider */}
                <div className="space-y-3 bg-earth-50 p-5 rounded-2xl border border-earth-200">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-gray-700">Monsoon Rainfall Shift</span>
                    <span
                      className={`text-xl font-black ${
                        rainfallShift < 0 ? 'text-red-600' : rainfallShift > 0 ? 'text-emerald-600' : 'text-gray-800'
                      }`}
                    >
                      {rainfallShift > 0 ? `+${rainfallShift}%` : `${rainfallShift}%`}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="5"
                    value={rainfallShift}
                    onChange={(e) => {
                      setRainfallShift(Number(e.target.value));
                      setActiveScenario(`Rainfall ${e.target.value}%`);
                    }}
                    className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-krishi-600"
                  />

                  <div className="flex justify-between text-[11px] text-gray-500 font-mono">
                    <span>Severe Drought (-50%)</span>
                    <span>Baseline (0%)</span>
                    <span>Heavy Surplus (+50%)</span>
                  </div>
                </div>

                <div className="pt-1">
                  <Button
                    onClick={() => {}}
                    variant="primary"
                    size="lg"
                    fullWidth
                    icon={<RefreshCw className="w-4 h-4" />}
                    className="font-bold shadow-xs"
                  >
                    Run Simulation
                  </Button>
                </div>

                {/* Other Scenarios Quick Presets matching Design #13 */}
                <div className="pt-2 border-t border-earth-100">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                    Other Test Scenarios:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {otherScenarios.map((scen) => (
                      <button
                        key={scen.label}
                        type="button"
                        onClick={() => handleApplyScenario(scen.name, scen.shift)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                          activeScenario === scen.name
                            ? 'bg-krishi-700 text-white border-krishi-700 shadow-xs'
                            : 'bg-white text-gray-700 border-earth-200 hover:border-krishi-300'
                        }`}
                      >
                        ⚡ {scen.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Simulation Results Card matching Design #13 */}
            <div className="lg:col-span-6 space-y-4">
              <Card className="p-6 space-y-5 bg-gradient-to-br from-white to-earth-50/50">
                <div className="flex items-center justify-between pb-3 border-b border-earth-100">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase">Scenario Output</span>
                    <h3 className="text-xl font-black text-gray-900">{activeScenario}</h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      stressLevel === 'Critical' || stressLevel === 'High'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Water Stress: {stressLevel}
                  </span>
                </div>

                {/* Predicted Metric Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-white rounded-2xl border border-earth-200 shadow-2xs">
                    <span className="text-xs text-gray-500 block">Expected Yield</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-gray-900">{yieldImpact}</span>
                      <span className="text-xs text-gray-400 line-through">22 quintals</span>
                    </div>
                    <span className="text-[11px] font-semibold text-red-600 block mt-0.5">
                      {Math.round(((yieldImpact - baseYield) / baseYield) * 100)}% shift
                    </span>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-earth-200 shadow-2xs">
                    <span className="text-xs text-gray-500 block">Supplemental Irrigation</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-gray-900">
                        {waterReqChange > 0 ? `+${Math.round(waterReqChange)}%` : `${Math.round(waterReqChange)}%`}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500 block mt-0.5">
                      Pumping diesel demand
                    </span>
                  </div>
                </div>

                {/* AI Suggestion Box matching Design #13 */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>AI Simulation Recommendation</span>
                  </div>
                  <p className="text-sm font-semibold text-emerald-950 leading-relaxed">
                    "Consider improving soil moisture retention through organic mulch and adopting water-efficient drip emitters before flowering peak."
                  </p>
                  <p className="text-xs text-emerald-800">
                    Applying broad bed and furrow (BBF) technique can retain 25% more in-situ rainwater during rain deficit weeks.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
