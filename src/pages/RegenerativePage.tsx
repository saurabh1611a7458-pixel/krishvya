import React, { useState } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import {
  Leaf,
  Sprout,
  Sparkles,
} from 'lucide-react';

export const RegenerativePage: React.FC = () => {
  const [planModalOpen, setPlanModalOpen] = useState(false);

  const score = 78;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const improvements = [
    {
      id: 1,
      title: 'Improve organic matter',
      points: '+5 points',
      desc: 'Add 2 tonnes/acre composted cattle manure and retain soybean harvest crop stubble in field.',
    },
    {
      id: 2,
      title: 'Try crop rotation',
      points: '+4 points',
      desc: 'Introduce a nitrogen-fixing legume (Chickpea/Chana) in the upcoming winter season.',
    },
    {
      id: 3,
      title: 'Improve water efficiency',
      points: '+3 points',
      desc: 'Adopt regulated deficit drip irrigation during flowering stage to stimulate root expansion.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Regenerative Farming
              </h1>
            </div>
            <p className="text-xs text-gray-500">For healthier soil & a sustainable future</p>
          </div>

          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            Eco Score: Top 15% in Saoner
          </span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Score & Breakdown matching Design #12 */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-6 text-center flex flex-col items-center justify-center bg-gradient-to-br from-white to-emerald-50/40">
                <div className="relative flex items-center justify-center my-4">
                  <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#E2E8F0"
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
                    <span className="text-xs font-bold text-emerald-700 mt-1 uppercase">Good</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900">Natural Sustainability Index</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Reducing chemical dependencies while safeguarding soil biology and water tables.
                </p>
              </Card>

              {/* Score Breakdown Bars matching Design #12 */}
              <Card className="p-6 space-y-4">
                <h4 className="font-bold text-gray-900 text-sm">Score Breakdown</h4>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Soil Health</span>
                      <span className="font-bold text-emerald-700">82%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: '82%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Water Efficiency</span>
                      <span className="font-bold text-sky-700">76%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-600 h-full rounded-full" style={{ width: '76%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Organic Practices</span>
                      <span className="font-bold text-amber-700">70%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Crop Diversity</span>
                      <span className="font-bold text-krishi-700">65%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-krishi-600 h-full rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Chemical Reduction</span>
                      <span className="font-bold text-emerald-700">80%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Your Next 3 Improvements matching Design #12 */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900">
                    Your Next 3 Improvements
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Actionable low-cost practices to elevate your score to 90+ and lower fertilizer expenditure.
                  </p>
                </div>

                <div className="space-y-4">
                  {improvements.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-earth-200/90 bg-white hover:border-emerald-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                          {item.id}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">{item.title}</h4>
                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold whitespace-nowrap self-end sm:self-center">
                        {item.points}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => setPlanModalOpen(true)}
                    variant="primary"
                    size="lg"
                    fullWidth
                    icon={<Sparkles className="w-5 h-5" />}
                    className="bg-emerald-700 hover:bg-emerald-800 font-bold shadow-sm"
                  >
                    See My Regeneration Plan
                  </Button>
                </div>
              </Card>

              {/* Bio-input recipe card */}
              <Card className="p-5 bg-gradient-to-r from-amber-50/60 to-earth-50/80 border-amber-200/80">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2">
                  <Sprout className="w-4 h-4 text-amber-700" />
                  <span>Featured Village Recipe: Jeevamrutha</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Mix 10 kg native cow dung + 10 L cow urine + 2 kg jaggery + 2 kg gram flour with 200 L water. Ferment for 48 hours in shade. Apply through irrigation to restore soil microbial flora.
                </p>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNav />

      {/* Regeneration Plan Modal */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title="Your 3-Month Regeneration Roadmap"
      >
        <div className="space-y-4 text-sm text-gray-700">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900">Month 1 (Current): Stubble Management</h4>
            <p className="text-xs text-emerald-950 mt-1">
              Never burn crop residues. Use zero-till happy seeder or mulch stubble directly into the soil bed to preserve 1.5 tonnes of organic biomass.
            </p>
          </div>

          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900">Month 2: Bio-Fertilizer Inoculation</h4>
            <p className="text-xs text-sky-950 mt-1">
              Treat seeds with Rhizobium and Phosphate Solubilizing Bacteria (PSB) before sowing Rabi chickpea.
            </p>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900">Month 3: Pest Repellent Kashayam</h4>
            <p className="text-xs text-amber-950 mt-1">
              Replace chemical synthetic sprays with neem oil (5ml/L) and Dashaparni Kashayam.
            </p>
          </div>

          <Button
            onClick={() => setPlanModalOpen(false)}
            variant="primary"
            size="md"
            fullWidth
          >
            Apply This Roadmap
          </Button>
        </div>
      </Modal>
    </div>
  );
};
