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
import { useFarmIntelligence } from '../context/FarmIntelligenceContext';
import { useLanguage } from '../context/LanguageContext';
import { Bell, MapPin, AlertCircle, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user, farm, farms, problemCases, selectFarm, selectedFarmId } = useFarm();
  const { intelligence, weatherData } = useFarmIntelligence();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      {/* Desktop Left Sidebar */}
      <Sidebar />

      {/* Main Content View */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        {/* Top App Bar */}
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          {/* Streamlined Farm Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-earth-100/90 text-earth-900 text-xs sm:text-sm font-medium border border-earth-200">
              <span className="font-bold text-krishi-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-krishi-700 shrink-0" />
                {farm.name || 'My Farm'}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-600 font-medium">{farm.size} {farm.sizeUnit || 'acres'}</span>
              <span className="text-gray-300">•</span>
              <span className="text-krishi-700 font-semibold">{farm.crop?.name || 'Crop not set'}</span>
            </div>

            {farms.length > 1 ? (
              <div className="relative">
                <select
                  value={selectedFarmId || farm.id}
                  onChange={(e) => selectFarm(e.target.value)}
                  className="appearance-none bg-krishi-50 hover:bg-krishi-100 text-krishi-800 text-xs font-bold border border-krishi-200 rounded-full pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-krishi-600 transition-colors"
                  aria-label="Change active farm"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      Change: {f.name} ({f.crop?.name || 'Crop'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-krishi-700 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <Link
                to="/farm"
                className="text-xs font-bold text-krishi-700 hover:text-krishi-800 px-3 py-1.5 rounded-full bg-krishi-50 border border-krishi-200 hover:bg-krishi-100 transition-colors"
              >
                Change Farm
              </Link>
            )}
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
                {user.name ? user.name.charAt(0).toUpperCase() : 'F'}
              </div>
            </Link>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Welcome Banner if user has 0 farms */}
          {farms.length === 0 && (
            <div className="p-6 bg-gradient-to-r from-krishi-50 to-emerald-50 rounded-3xl border border-krishi-200 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-lg font-black text-krishi-900">
                  Welcome to KRISHVYA Farm Intelligence! 🌾
                </h3>
                <p className="text-sm text-gray-600">
                  You haven't set up your farm parcel yet. Register your farm parcel to enable real-time satellite imagery, localized weather forecasts, and AI crop recommendations.
                </p>
              </div>
              <Link
                to="/farm"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-krishi-700 hover:bg-krishi-800 text-white shadow-xs transition-all shrink-0"
              >
                + Register Farm Parcel
              </Link>
            </div>
          )}

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

          {/* Farm Status Card - Simple Command Center Summary */}
          <FarmHealthCard
            score={intelligence.healthScore}
            status={intelligence.healthStatus}
            cropStatus={
              intelligence.domainAdvisories.cropProtection.status?.toLowerCase().includes('critical') ||
              intelligence.domainAdvisories.cropProtection.status?.toLowerCase().includes('action')
                ? 'Action needed'
                : intelligence.domainAdvisories.cropProtection.status?.toLowerCase().includes('warn') ||
                  intelligence.domainAdvisories.cropProtection.status?.toLowerCase().includes('alert')
                ? 'Check'
                : 'Good'
            }
            soilStatus={
              intelligence.domainAdvisories.soilNutrition.status?.toLowerCase().includes('critical') ||
              intelligence.domainAdvisories.soilNutrition.status?.toLowerCase().includes('action')
                ? 'Action needed'
                : intelligence.domainAdvisories.soilNutrition.status?.toLowerCase().includes('warn') ||
                  intelligence.domainAdvisories.soilNutrition.status?.toLowerCase().includes('defic')
                ? 'Check'
                : 'Good'
            }
            weatherStatus={
              (weatherData?.rainProbability ?? 0) >= 50 || (weatherData?.temperature ?? 0) >= 38
                ? 'Warning'
                : 'Normal'
            }
            actionsCount={
              (intelligence.primaryAction?.severity === 'high' || intelligence.primaryAction?.severity === 'critical' ? 1 : 0) +
              (intelligence.weeklyTasks?.filter((t) => t.priority === 'high').length ?? 0)
            }
            cropSummary={intelligence.domainAdvisories.cropProtection.advice}
            soilSummary={intelligence.domainAdvisories.soilNutrition.advice}
            weatherSummary={
              weatherData?.condition
                ? `${weatherData.condition} • ${weatherData.temperature}°C`
                : farm.weather?.temperature
                ? `${farm.weather.temperature}°C • Humidity ${farm.weather.humidity}%`
                : undefined
            }
          />

          {/* 4 Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <WeatherCard weather={weatherData || farm.weather} />
            <CropCard crop={farm.crop} />
            <SoilCard soil={farm.soil} />
            <CropHealthCard satellite={farm.satellite} />
          </div>

          {/* Today's Actionable Priority Action ("What needs my attention today?") */}
          <AdviceCard primaryAction={intelligence.primaryAction} />

          {/* Quick Actions (Ask AI, Scan Plant, Check Crop, Improve Soil) */}
          <QuickActions />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
};
