import React from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { useFarm } from '../context/FarmContext';
import {
  History,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { farm, problemCases } = useFarm();

  const historyEvents = [
    {
      date: '10 Sep 2024',
      type: 'Advisory Applied',
      title: 'Delayed Irrigation on AI Advice',
      desc: 'Delayed irrigation by 24h before 45mm monsoon rain arrived. Saved estimated ₹850 in diesel pumping.',
      impact: 'positive',
    },
    {
      date: '15 Jun 2024',
      type: 'Sowing Recorded',
      title: 'Soybean (JS-335) Sown',
      desc: '2.5 acres seeded with certified rhizobium inoculation. Sowing depth 3.5cm in loamy black cotton soil.',
      impact: 'positive',
    },
    {
      date: '12 May 2024',
      type: 'Soil Testing',
      title: 'KVK Laboratory Soil Card Issued',
      desc: 'pH tested at 6.7, Organic Carbon 0.6%, NPK levels registered as Good/Medium/Good.',
      impact: 'neutral',
    },
    {
      date: '28 Oct 2023',
      type: 'Harvest Complete',
      title: 'Kharif Harvest 2023',
      desc: 'Achieved 23.5 quintals total yield. Sold at Saoner APMC Mandi at MSP + 4%.',
      impact: 'positive',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-krishi-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Farmer History & Timeline
              </h1>
            </div>
            <p className="text-xs text-gray-500">
              Chronological log of farm operations, resolved cases, and seasonal yields
            </p>
          </div>

          <span className="text-xs font-bold text-gray-600 bg-earth-100 px-3 py-1 rounded-full">
            Farm ID: {farm.id}
          </span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* Active / Submitted cases from context if any */}
          {problemCases.length > 0 && (
            <Card className="p-5 border-amber-200 bg-amber-50/40">
              <h3 className="font-bold text-amber-900 text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Recently Logged Problem Cases</span>
              </h3>
              <div className="space-y-2">
                {problemCases.map((c) => (
                  <div key={c.id} className="p-3 bg-white rounded-xl border border-amber-200/80 text-xs flex items-center justify-between">
                    <div>
                      <strong className="text-gray-900">{c.title}</strong>
                      <p className="text-gray-500 mt-0.5">{c.description}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Historical Timeline List */}
          <div className="relative border-l-2 border-krishi-200 pl-6 ml-4 space-y-6">
            {historyEvents.map((evt, idx) => (
              <div key={idx} className="relative group">
                {/* Node indicator */}
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-krishi-600 border-2 border-white shadow-xs group-hover:scale-125 transition-transform" />

                <Card className="p-5">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span className="font-semibold text-krishi-700 uppercase tracking-wider">{evt.type}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{evt.date}</span>
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-gray-900 mb-1">{evt.title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{evt.desc}</p>
                </Card>
              </div>
            ))}
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
