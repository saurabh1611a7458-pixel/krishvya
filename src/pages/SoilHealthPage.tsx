import React, { useState } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useFarm } from '../context/FarmContext';
import {
  Layers,
  Sparkles,
  Sprout,
  Calendar,
  FileText,
} from 'lucide-react';

export const SoilHealthPage: React.FC = () => {
  const { farm } = useFarm();
  const [improveModalOpen, setImproveModalOpen] = useState(false);

  const soil = farm.soil;
  const score = soil.healthScore || 78;

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-800" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Soil Health
              </h1>
            </div>
            <p className="text-xs text-gray-500">
              Know your soil, grow better • Soil test analysis
            </p>
          </div>

          <div className="text-xs font-semibold text-gray-600 bg-earth-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-earth-700" />
            <span>Tested: {soil.lastTestedDate || '12 May 2024'}</span>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Main Soil Health Grid matching Design #9 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Overall Health Score Circular Card */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-6 text-center flex flex-col items-center justify-center bg-gradient-to-br from-white to-amber-50/30">
                <div className="relative flex items-center justify-center my-4">
                  <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#F1EFE9"
                      strokeWidth="9"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#16a34a"
                      strokeWidth="9"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-gray-900">{score}</span>
                    <span className="text-sm font-bold text-gray-400">/ 100</span>
                    <span className="text-xs font-bold text-krishi-700 mt-1 uppercase">Good</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900">Fertile Soil Status</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  {soil.soilType} • Ideal root penetration and good moisture retention capacity.
                </p>

                <div className="mt-6 pt-4 border-t border-earth-100 w-full flex justify-between text-xs text-gray-600">
                  <span>Target Score: <strong>85+</strong></span>
                  <span>Category: <strong>Class II Arable</strong></span>
                </div>
              </Card>

              {/* Lab Test Card Details */}
              <Card className="p-5">
                <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>Soil Health Card Record</span>
                </h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between py-1 border-b border-earth-100">
                    <span>Testing Lab</span>
                    <span className="font-semibold text-gray-800">KVK Nagpur Agro Lab</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-earth-100">
                    <span>Sample Depth</span>
                    <span className="font-semibold text-gray-800">0 - 15 cm</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Next Test Recommended</span>
                    <span className="font-semibold text-krishi-700">May 2027 (Every 3 years)</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Parameter Progress Bars matching Design #9 */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-6">
                <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center justify-between">
                  <span>Soil Parameters Breakdown</span>
                  <span className="text-xs text-gray-400">Essential Nutrients & Structure</span>
                </h3>

                <div className="space-y-5">
                  {/* Nitrogen */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1.5">
                      <span className="text-gray-800">Nitrogen (N)</span>
                      <span className="text-krishi-700 font-bold">{soil.nitrogen} (295 kg/ha)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-krishi-600 h-full rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>

                  {/* Phosphorus */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1.5">
                      <span className="text-gray-800">Phosphorus (P)</span>
                      <span className="text-amber-700 font-bold">{soil.phosphorus} (18 kg/ha)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '55%' }}></div>
                    </div>
                  </div>

                  {/* Potassium */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1.5">
                      <span className="text-gray-800">Potassium (K)</span>
                      <span className="text-krishi-700 font-bold">{soil.potassium} (320 kg/ha)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-krishi-600 h-full rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>

                  {/* pH */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1.5">
                      <span className="text-gray-800">Soil pH</span>
                      <span className="text-krishi-700 font-bold">{soil.ph} (Balanced Neutral)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: '67%' }}></div>
                    </div>
                  </div>

                  {/* Organic Carbon */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1.5">
                      <span className="text-gray-800">Organic Carbon (OC)</span>
                      <span className="text-amber-700 font-bold">{soil.organicCarbon}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>

                  {/* Moisture */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1.5">
                      <span className="text-gray-800">Moisture Content</span>
                      <span className="text-sky-700 font-bold">{soil.moisturePercentage}% (Optimal)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-sky-600 h-full rounded-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* AI Recommendation Banner matching Design #9 */}
              <Card className="p-6 bg-gradient-to-br from-krishi-50 via-white to-amber-50/50 border-krishi-300 shadow-soft">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-krishi-900 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-krishi-600" />
                      <span>AI Soil Recommendation</span>
                    </div>
                    <p className="text-base font-bold text-gray-900 leading-snug">
                      "Your soil is generally healthy, but organic carbon could be improved. Try adding farmyard manure/compost and consider leguminous crop rotation."
                    </p>
                  </div>

                  <Button
                    onClick={() => setImproveModalOpen(true)}
                    variant="primary"
                    size="md"
                    className="bg-krishi-700 hover:bg-krishi-800 flex-shrink-0 font-bold shadow-xs"
                  >
                    Improve My Soil
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNav />

      {/* Soil Improvement Guide Modal */}
      <Modal
        isOpen={improveModalOpen}
        onClose={() => setImproveModalOpen(false)}
        title="Regenerative Soil Improvement Plan"
      >
        <div className="space-y-4 text-sm text-gray-700">
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
              <Sprout className="w-4 h-4 text-emerald-700" />
              <span>Step 1: Well-Rotted Farmyard Manure (FYM)</span>
            </h4>
            <p className="text-xs text-emerald-950">
              Apply 2 to 3 tonnes of decomposed cow dung manure per acre prior to pre-monsoon harrowing. This boosts soil biological activity by 40%.
            </p>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
              <Layers className="w-4 h-4 text-amber-700" />
              <span>Step 2: Green Manuring (Dhaincha / Sunhemp)</span>
            </h4>
            <p className="text-xs text-amber-950">
              Sow Sunhemp or Sesbania (Dhaincha) during fallow interval, and plow it under after 45 days. Adds up to 60 kg of natural nitrogen per hectare.
            </p>
          </div>

          <Button
            onClick={() => setImproveModalOpen(false)}
            variant="primary"
            size="md"
            fullWidth
          >
            Got It, Thanks
          </Button>
        </div>
      </Modal>
    </div>
  );
};
