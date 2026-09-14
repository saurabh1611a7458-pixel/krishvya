import React from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { ProblemButton } from '../components/common/ProblemButton';
import { FarmHealthCard } from '../components/dashboard/FarmHealthCard';
import { WeatherCard } from '../components/dashboard/WeatherCard';
import { SoilCard } from '../components/dashboard/SoilCard';
import { CropCard } from '../components/dashboard/CropCard';
import { CropHealthCard } from '../components/dashboard/CropHealthCard';
import { AdviceCard } from '../components/dashboard/AdviceCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { useFarm } from '../context/FarmContext';
import { useLanguage } from '../context/LanguageContext';
import { Bell, MapPin, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user, farm, problemCases } = useFarm();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Main Content View */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        {/* Top App Bar */}
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          {/* Farm Location Pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-earth-100/90 text-earth-900 text-xs sm:text-sm font-semibold border border-earth-200">
              <MapPin className="w-3.5 h-3.5 text-krishi-700" />
              <span>{farm.location.address || 'Maharashtra, India'}</span>
              <span className="text-gray-400">•</span>
              <span>{farm.size} {farm.sizeUnit}</span>
            </div>
          </div>

          {/* Right Header Utility Controls */}
          <div className="flex items-center gap-3">
            {/* Desktop Language Selector */}
            <div className="hidden sm:block">
              <LanguageSelector compact />
            </div>

            {/* Notification Bell */}
            <Link
              to="/alerts"
              className="p-2 rounded-xl text-gray-600 hover:bg-earth-100 relative"
              aria-label="Alerts"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
            </Link>

            {/* User Avatar */}
            <Link
              to="/profile"
              className="flex items-center gap-2 pl-2 border-l border-earth-200"
            >
              <div className="w-8 h-8 rounded-full bg-krishi-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user.name ? user.name.charAt(0) : 'R'}
              </div>
            </Link>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Greeting & Prominent Emergency Problem Button Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-earth-200/90 shadow-soft">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                {t('goodMorning')}
              </h1>
              <p className="text-sm sm:text-base text-gray-500 mt-0.5">
                {t('happeningToday')}
              </p>
            </div>

            {/* 🆘 I HAVE A PROBLEM: Highlighted as most critical CTA */}
            <div className="w-full md:w-auto flex-shrink-0">
              <ProblemButton fullWidth size="lg" />
            </div>
          </div>

          {/* Active Problems Banner if any submitted */}
          {problemCases.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-700" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    Active Case Submitted: {problemCases[0].title}
                  </h4>
                  <p className="text-xs text-amber-700">
                    Status: <span className="font-semibold uppercase">{problemCases[0].status}</span> • AI is analyzing symptoms
                  </p>
                </div>
              </div>
              <Link to="/problem" className="text-xs font-bold text-amber-900 hover:underline">
                View Details →
              </Link>
            </div>
          )}

          {/* Core Farm Health Gauge Card */}
          <FarmHealthCard score={farm.farmHealthScore || 84} />

          {/* 4 Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <WeatherCard weather={farm.weather} />
            <CropCard crop={farm.crop} />
            <SoilCard soil={farm.soil} />
            <CropHealthCard satellite={farm.satellite} />
          </div>

          {/* Today's Actionable Advice Banner with Authentic Crop Preview */}
          <AdviceCard advice={farm.weather.advice} />

          {/* Quick Actions (Ask AI, Scan Plant, Check Crop, Improve Soil) */}
          <QuickActions />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
};
