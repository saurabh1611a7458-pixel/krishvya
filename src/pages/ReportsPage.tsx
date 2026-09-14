import React, { useState } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useFarm } from '../context/FarmContext';
import {
  FileText,
  Download,
  Droplets,
  Sprout,
  CheckCircle,
  Calendar,
  Layers,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { farm } = useFarm();
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const months = [
    { name: 'May', score: 65, y: 70 },
    { name: 'Jun', score: 71, y: 58 },
    { name: 'Jul', score: 75, y: 50 },
    { name: 'Aug', score: 80, y: 40 },
    { name: 'Sep', score: 84, y: 32 },
  ];

  const handleDownload = (reportType: string) => {
    setDownloadSuccess(`Generated ${reportType} for ${farm.name}`);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-krishi-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Farm Reports & Analytics
              </h1>
            </div>
            <p className="text-xs text-gray-500">Track your progress over time • Bank & insurance certified</p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-earth-100 text-xs font-bold text-gray-700">
            <Calendar className="w-3.5 h-3.5" />
            <span>Timeframe: Last 6 Months</span>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {downloadSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>{downloadSuccess} — downloaded to your device!</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Farm Health Trend Graph matching Design #15 */}
            <div className="lg:col-span-8 space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Farm Health Trend</h3>
                    <p className="text-xs text-gray-500">Continuous seasonal health scoring</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-krishi-800">84</span>
                    <span className="text-xs font-bold text-emerald-700 block">+19 pts gain</span>
                  </div>
                </div>

                {/* SVG Line Chart */}
                <div className="relative h-64 w-full bg-earth-50/60 rounded-2xl p-4 border border-earth-200 flex flex-col justify-between">
                  {/* Grid Lines */}
                  <div className="absolute inset-x-4 top-8 border-b border-gray-200/80 text-[10px] text-gray-400">100</div>
                  <div className="absolute inset-x-4 top-24 border-b border-gray-200/80 text-[10px] text-gray-400">80</div>
                  <div className="absolute inset-x-4 top-40 border-b border-gray-200/80 text-[10px] text-gray-400">60</div>

                  <svg className="w-full h-44 mt-4" viewBox="0 0 500 120" preserveAspectRatio="none">
                    {/* Area under curve */}
                    <defs>
                      <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#16a34a" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <path
                      d="M 50,90 Q 150,75 250,55 T 450,22 L 450,120 L 50,120 Z"
                      fill="url(#curveGradient)"
                    />
                    <path
                      d="M 50,90 Q 150,75 250,55 T 450,22"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Milestone nodes */}
                    <circle cx="50" cy="90" r="5" fill="#15803d" />
                    <circle cx="150" cy="75" r="5" fill="#15803d" />
                    <circle cx="250" cy="55" r="5" fill="#15803d" />
                    <circle cx="350" cy="38" r="5" fill="#15803d" />
                    <circle cx="450" cy="22" r="6" fill="#15803d" stroke="#ffffff" strokeWidth="2" />
                  </svg>

                  {/* X-axis months */}
                  <div className="flex justify-between text-xs font-bold text-gray-500 px-4 pt-2">
                    {months.map((m) => (
                      <span key={m.name}>{m.name} ({m.score})</span>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Download Reports Bar matching Design #15 */}
              <Card className="p-6">
                <h3 className="text-base font-bold text-gray-900 mb-2">Download Official Farm Reports</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Formatted for PM-Kisan verification, agricultural bank credit, and crop insurance claims.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    onClick={() => handleDownload('Farm Comprehensive Report (PDF)')}
                    variant="primary"
                    size="md"
                    icon={<Download className="w-4 h-4" />}
                    className="font-bold shadow-xs"
                  >
                    Farm Report (PDF)
                  </Button>

                  <Button
                    onClick={() => handleDownload('Soil Health Analysis (PDF)')}
                    variant="secondary"
                    size="md"
                    icon={<Download className="w-4 h-4" />}
                    className="font-semibold"
                  >
                    Soil Report
                  </Button>

                  <Button
                    onClick={() => handleDownload('Crop Growth & Yield Statement')}
                    variant="secondary"
                    size="md"
                    icon={<Download className="w-4 h-4" />}
                    className="font-semibold"
                  >
                    Crop Report
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right: Key Insights matching Design #15 */}
            <div className="lg:col-span-4 space-y-4">
              <Card className="p-6 space-y-4 bg-gradient-to-br from-white to-earth-50/50">
                <h3 className="font-bold text-gray-900 text-base pb-3 border-b border-earth-100">
                  Key Seasonal Insights
                </h3>

                <div className="space-y-3.5">
                  <div className="p-3.5 bg-white rounded-2xl border border-earth-200/90 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                        <Droplets className="w-4 h-4 text-sky-600" />
                        <span>Soil Moisture</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        +12%
                      </span>
                    </div>
                    <div className="text-lg font-black text-gray-900 mt-1">72 → 84</div>
                    <p className="text-[11px] text-gray-500 mt-0.5">Drip automation improved water retention.</p>
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border border-earth-200/90 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                        <Sprout className="w-4 h-4 text-emerald-600" />
                        <span>Crop Health</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        +8%
                      </span>
                    </div>
                    <div className="text-lg font-black text-gray-900 mt-1">70 → 78</div>
                    <p className="text-[11px] text-gray-500 mt-0.5">Prompt blight prevention maintained green canopy.</p>
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border border-earth-200/90 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                        <Layers className="w-4 h-4 text-amber-700" />
                        <span>Regeneration Score</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        +13%
                      </span>
                    </div>
                    <div className="text-lg font-black text-gray-900 mt-1">65 → 78</div>
                    <p className="text-[11px] text-gray-500 mt-0.5">Zero-stubble burning and FYM addition.</p>
                  </div>
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
