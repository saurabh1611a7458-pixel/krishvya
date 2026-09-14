import React, { useState } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import {
  Globe2,
  BookOpen,
  CloudSun,
  ShieldCheck,
  Leaf,
  Cpu,
  Database,
  ArrowRight,
} from 'lucide-react';

interface CountryProject {
  id: string;
  country: string;
  flag: string;
  title: string;
  description: string;
  impactTag: string;
}

export const BricsHubPage: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>('All');

  const countries = [
    { code: 'All', name: 'All Nations', flag: '🌐' },
    { code: 'India', name: 'India', flag: '🇮🇳' },
    { code: 'Brazil', name: 'Brazil', flag: '🇧🇷' },
    { code: 'Russia', name: 'Russia', flag: '🇷🇺' },
    { code: 'China', name: 'China', flag: '🇨🇳' },
    { code: 'South Africa', name: 'South Africa', flag: '🇿🇦' },
  ];

  const projects: CountryProject[] = [
    {
      id: 'p_in',
      country: 'India',
      flag: '🇮🇳',
      title: 'Water-Efficient Solar Drip Farming',
      description: 'Solar-powered automated micro-drip networks reducing groundwater extraction by 42% across dryland peanut and soybean acreage.',
      impactTag: 'Water Preservation',
    },
    {
      id: 'p_br',
      country: 'Brazil',
      flag: '🇧🇷',
      title: 'Direct-Seeded Regenerative Soybean',
      description: 'Zero-tillage cover cropping techniques from Mato Grosso preserving soil organic carbon and cutting herbicide application by 35%.',
      impactTag: 'Soil Health',
    },
    {
      id: 'p_ru',
      country: 'Russia',
      flag: '🇷🇺',
      title: 'Climate-Resilient Winter Grains',
      description: 'Frost-hardy spring wheat varieties engineered for rapid root deepening and early soil moisture capture during sudden seasonal thaw.',
      impactTag: 'Frost Resilience',
    },
    {
      id: 'p_cn',
      country: 'China',
      flag: '🇨🇳',
      title: 'Terrace Bio-Engineering & Soil Retention',
      description: 'Vegetative terrace buffer strips for steep slopes preventing monsoon topsoil erosion and nutrient runoff.',
      impactTag: 'Erosion Defense',
    },
    {
      id: 'p_za',
      country: 'South Africa',
      flag: '🇿🇦',
      title: 'Drought-Tolerant Sorghum & Millet',
      description: 'Revival of climate-hardy indigenous millets requiring 60% less irrigation than maize while providing high-protein animal feed.',
      impactTag: 'Drought Buffer',
    },
  ];

  const sharedResources = [
    { title: 'Crop Knowledge', icon: BookOpen, count: '14,200 papers' },
    { title: 'Climate Insights', icon: CloudSun, count: 'Global agro-models' },
    { title: 'Disease Patterns', icon: ShieldCheck, count: '650+ verified pathogens' },
    { title: 'Regenerative Practices', icon: Leaf, count: '85 field protocols' },
    { title: 'AI Agro Models', icon: Cpu, count: 'Open weights' },
    { title: 'Agricultural Data', icon: Database, count: 'Multispectral archives' },
  ];

  const filteredProjects = projects.filter((p) => {
    if (selectedCountry === 'All') return true;
    return p.country === selectedCountry;
  });

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <Globe2 className="w-6 h-6 text-krishi-800" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                BRICS Agricultural Knowledge Hub
              </h1>
            </div>
            <p className="text-xs text-gray-500">
              Collaborating for a sustainable, climate-resilient global food future
            </p>
          </div>

          <span className="text-xs font-bold text-krishi-800 bg-krishi-100 px-3 py-1 rounded-full">
            Multilateral Agro Protocol
          </span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Hero Banner matching Screen #17 */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-krishi-900 via-emerald-950 to-earth-900 text-white shadow-soft-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-krishi-300">
                People • Farms • Food • Future
              </span>
              <h2 className="text-2xl sm:text-3xl font-black">
                Together for Sustainable Agriculture
              </h2>
              <p className="text-sm text-krishi-100 leading-relaxed font-normal">
                Directly exchanging open-source agritech algorithms, seed genetic resilience data, and farmer-tested water conservation techniques across partner nations.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-2xl">
              <span>🇮🇳</span>
              <span>🇧🇷</span>
              <span>🇷🇺</span>
              <span>🇨🇳</span>
              <span>🇿🇦</span>
            </div>
          </div>

          {/* Country Filter Chips matching Design #17 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {countries.map((c) => (
              <button
                key={c.code}
                onClick={() => setSelectedCountry(c.code)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  selectedCountry === c.code
                    ? 'bg-krishi-700 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-earth-200 hover:bg-earth-100'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>

          {/* Featured Country Case Studies matching Design #17 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProjects.map((p) => (
              <Card
                key={p.id}
                hoverable
                className="flex flex-col justify-between border-earth-200/90"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{p.flag}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-krishi-50 text-krishi-800 border border-krishi-200">
                      {p.impactTag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">{p.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{p.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-earth-100 flex items-center justify-between text-xs font-semibold text-krishi-700">
                  <span>Read Field Protocol</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            ))}
          </div>

          {/* Shared Resources Directory matching Design #17 */}
          <div className="space-y-3 pt-2">
            <h3 className="text-base font-bold text-gray-900">Shared Multilateral Resources</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {sharedResources.map((res) => {
                const Icon = res.icon;
                return (
                  <Card
                    key={res.title}
                    hoverable
                    className="p-4 text-center border-earth-200 flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="w-10 h-10 rounded-xl bg-earth-100 text-krishi-700 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">{res.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{res.count}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
