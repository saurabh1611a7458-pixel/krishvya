import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Button } from '../components/common/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import { useFarmIntelligence } from '../context/FarmIntelligenceContext';
import { supabaseService } from '../services/supabaseService';
import { generateRealFarmAlerts } from '../services/alertEngine';
import { FarmAlert } from '../types';
import {
  Bell,
  CloudRain,
  Sprout,
  Droplets,
  Clock,
  Check,
  MapPin,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Trash2,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const { farm, farms, selectFarm, user } = useFarm();
  const { weatherData } = useFarmIntelligence();

  const [filter, setFilter] = useState<'all' | 'weather' | 'crop' | 'soil' | 'disease'>('all');
  const [alerts, setAlerts] = useState<FarmAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id || farm.user_id;

  // Selected farm metadata
  const cropName = farm.crop?.name || farm.crop_variety || '';
  const areaDisplay = farm.size ? `${farm.size} ${farm.sizeUnit || 'acres'}` : 'Area not specified';
  const farmHeaderContext = `${cropName ? `${cropName} Farm` : farm.name || 'Selected Farm'} • ${areaDisplay}`;

  const loadAlerts = useCallback(async () => {
    if (!farm?.id || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch persistent alerts from Supabase
      const storedAlerts = await supabaseService.getFarmAlerts(userId, farm.id);

      // 2. Fetch latest soil tests & disease scans
      const [soilTests, diseaseScans] = await Promise.all([
        supabaseService.getSoilTests(userId, farm.id),
        supabaseService.getDiseaseScans(userId, farm.id),
      ]);

      // 3. Set of already read alert IDs
      const readAlertIds = new Set(
        storedAlerts.filter((a) => a.isRead).map((a) => a.id)
      );

      // 4. Generate real-time telemetry alerts from real data
      const dynamicAlerts = generateRealFarmAlerts({
        farm,
        userId,
        weather: weatherData || farm.weather,
        soilTests,
        diseaseScans,
        readAlertIds,
      });

      // 5. Merge unique alerts
      const alertMap = new Map<string, FarmAlert>();
      dynamicAlerts.forEach((a) => alertMap.set(a.id, a));
      storedAlerts.forEach((a) => {
        if (!alertMap.has(a.id)) alertMap.set(a.id, a);
      });

      setAlerts(Array.from(alertMap.values()));
    } catch (err) {
      console.warn('Failed to load farm alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [farm, userId, weatherData]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((item) => {
      if (filter === 'all') return true;
      return item.category === filter;
    });
  }, [alerts, filter]);

  const activeAlertCount = useMemo(() => {
    return alerts.filter((a) => !a.isRead).length;
  }, [alerts]);

  // Today's Farm Status (Compact 4-Domain Summary)
  const farmSummaryStatus = useMemo(() => {
    // 1. Weather
    const rain = weatherData?.rainProbability ?? farm.weather?.rainProbability ?? 0;
    const temp = weatherData?.temperature ?? farm.weather?.temperature;
    let weatherStatus = { badge: '🟢 Normal', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (rain >= 60) {
      weatherStatus = { badge: '🔴 Action needed', color: 'bg-rose-50 text-rose-800 border-rose-200' };
    } else if ((typeof temp === 'number' && temp >= 38) || rain >= 40) {
      weatherStatus = { badge: '🟡 Check', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    } else if (temp === undefined && rain === 0) {
      weatherStatus = { badge: '⚪ No data', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }

    // 2. Crop
    let cropStatus = { badge: '🟢 Good', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (!cropName) {
      cropStatus = { badge: '⚪ No data', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    } else if (farm.crop?.stage?.toLowerCase().includes('harvest')) {
      cropStatus = { badge: '🟢 Harvest Ready', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }

    // 3. Soil
    const moisture = farm.soil?.moisturePercentage;
    let soilStatus = { badge: '🟢 Good', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (typeof moisture === 'number' && moisture > 0) {
      if (moisture < 22) {
        soilStatus = { badge: '🔴 Action needed', color: 'bg-rose-50 text-rose-800 border-rose-200' };
      } else if (moisture < 28 || moisture > 70) {
        soilStatus = { badge: '🟡 Check', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      }
    } else if (!farm.soil?.lastTestedDate) {
      soilStatus = { badge: '⚪ No data', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }

    // 4. Plant
    const activeDiseaseAlert = alerts.find((a) => a.category === 'disease' && !a.isRead);
    let plantStatus = { badge: '🟢 No confirmed issue', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (activeDiseaseAlert) {
      plantStatus = activeDiseaseAlert.severity === 'high'
        ? { badge: '🔴 Action needed', color: 'bg-rose-50 text-rose-800 border-rose-200' }
        : { badge: '🟡 Check', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    }

    return { weatherStatus, cropStatus, soilStatus, plantStatus };
  }, [weatherData, farm.weather, farm.soil, farm.crop, cropName, alerts]);

  // Priority badge styling: strictly 🟢 Informational, 🟡 Check, 🔴 Action needed
  const renderSeverityBadge = (severity: string) => {
    if (severity === 'high') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-800 border border-rose-200">
          <span>🔴</span> Action needed
        </span>
      );
    }
    if (severity === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
          <span>🟡</span> Check
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <span>🟢</span> Informational
      </span>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'weather':
        return <CloudRain className="w-5 h-5 text-[#2563EB]" />;
      case 'crop':
        return <Sprout className="w-5 h-5 text-[#166534]" />;
      case 'soil':
        return <Droplets className="w-5 h-5 text-[#2563EB]" />;
      case 'disease':
        return <Sparkles className="w-5 h-5 text-[#D97706]" />;
      default:
        return <Bell className="w-5 h-5 text-[#166534]" />;
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    if (!userId || !farm?.id) return;
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
    );
    await supabaseService.markAlertRead(alertId, userId, farm.id);
  };

  const handleDismiss = async (alertId: string) => {
    if (!userId || !farm?.id) return;
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    await supabaseService.dismissFarmAlert(alertId, userId, farm.id);
  };

  // Farmer filter tabs
  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'weather', label: 'Weather' },
    { id: 'crop', label: 'Crop' },
    { id: 'soil', label: 'Soil' },
    { id: 'disease', label: 'Plant' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex font-sans antialiased text-[#1F2937]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-12">
        {/* ========================================================================= */}
        {/* 1. HEADER                                                                 */}
        {/* ========================================================================= */}
        <header className="bg-white border-b border-[#E5E7EB] px-4 sm:px-8 py-4 sm:py-5 sticky top-0 z-20">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🔔</span>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Alerts
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#6B7280] font-medium mt-1">
                Important updates about your farm
              </p>

              {/* Dynamic Selected Farm Context */}
              <div className="flex items-center gap-2 text-xs text-gray-600 font-medium mt-2 flex-wrap">
                <span className="font-bold text-[#166534]">
                  🌱 {farmHeaderContext}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500 font-medium">{farm.name || 'Selected Farm'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                  activeAlertCount > 0
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {activeAlertCount > 0 ? `${activeAlertCount} Attention Updates` : '✓ All Clear'}
              </span>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* Farm Switcher if multiple farms */}
          {farms.length > 1 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-[#E5E7EB] text-xs shadow-soft">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <MapPin className="w-4 h-4 text-[#166534] shrink-0" />
                <span>
                  Viewing Farm: <strong className="text-gray-900">{farm.name}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-gray-400 text-[11px] font-semibold uppercase mr-1">Switch:</span>
                {farms.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => selectFarm(f.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      farm.id === f.id
                        ? 'bg-[#166534] text-white shadow-xs'
                        : 'bg-earth-100 text-gray-700 hover:bg-earth-200'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. TODAY'S FARM STATUS SUMMARY                                             */}
          {/* ========================================================================= */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-soft space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[#6B7280]">
              TODAY'S FARM STATUS
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Weather */}
              <div className="p-3 bg-earth-50/80 rounded-2xl border border-earth-200/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <span>🌦</span>
                  <span>Weather</span>
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${farmSummaryStatus.weatherStatus.color}`}>
                    {farmSummaryStatus.weatherStatus.badge}
                  </span>
                </div>
              </div>

              {/* Crop */}
              <div className="p-3 bg-earth-50/80 rounded-2xl border border-earth-200/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <span>🌱</span>
                  <span>Crop</span>
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${farmSummaryStatus.cropStatus.color}`}>
                    {farmSummaryStatus.cropStatus.badge}
                  </span>
                </div>
              </div>

              {/* Soil */}
              <div className="p-3 bg-earth-50/80 rounded-2xl border border-earth-200/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <span>💧</span>
                  <span>Soil</span>
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${farmSummaryStatus.soilStatus.color}`}>
                    {farmSummaryStatus.soilStatus.badge}
                  </span>
                </div>
              </div>

              {/* Plant */}
              <div className="p-3 bg-earth-50/80 rounded-2xl border border-earth-200/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <span>🌿</span>
                  <span>Plant</span>
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${farmSummaryStatus.plantStatus.color}`}>
                    {farmSummaryStatus.plantStatus.badge}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. CATEGORY FILTERS                                                       */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filter === tab.id
                    ? 'bg-[#166534] text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-[#E5E7EB] hover:bg-earth-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ========================================================================= */}
          {/* 4. ALERTS FEED                                                            */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-500 bg-white rounded-3xl border border-[#E5E7EB]">
                Checking field telemetry and attention updates...
              </div>
            ) : filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => {
                const isRead = Boolean(alert.isRead);

                return (
                  <div
                    key={alert.id}
                    className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                      isRead
                        ? 'bg-white/80 border-[#E5E7EB] opacity-75'
                        : alert.severity === 'high'
                        ? 'bg-rose-50/20 border-rose-200 shadow-soft'
                        : alert.severity === 'medium'
                        ? 'bg-amber-50/20 border-amber-200 shadow-soft'
                        : 'bg-white border-[#E5E7EB] shadow-soft'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5 flex-1">
                        <div className="p-2.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs shrink-0 mt-0.5">
                          {getCategoryIcon(alert.category)}
                        </div>

                        <div className="space-y-2 flex-1">
                          {/* Alert Title & Severity */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                              {alert.title}
                            </h3>
                            {renderSeverityBadge(alert.severity)}
                            {isRead && (
                              <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full">
                                Read
                              </span>
                            )}
                          </div>

                          {/* What happened? */}
                          <div className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                            <strong className="text-gray-900 font-bold block mb-0.5">What happened?</strong>
                            {alert.whatHappened || alert.description}
                          </div>

                          {/* What should I do? */}
                          {alert.whatShouldIDo && (
                            <div className="p-3 bg-earth-50/70 rounded-xl border border-earth-200/70 text-xs text-gray-800 leading-relaxed">
                              <strong className="text-[#166534] font-extrabold block mb-0.5">What should I do?</strong>
                              {alert.whatShouldIDo}
                            </div>
                          )}

                          {/* Source & Timestamp */}
                          <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-1 flex-wrap">
                            <span className="font-semibold text-gray-700">
                              Source: {alert.source || 'Field Telemetry'}
                            </span>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1 text-gray-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {new Date(alert.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-earth-100">
                        {alert.targetRoute && (
                          <Link to={alert.targetRoute}>
                            <Button
                              variant="primary"
                              size="sm"
                              className="bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs shadow-xs"
                            >
                              <span>{alert.actionableText || 'View Details'}</span>
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/ai-advisor')}
                          className="text-xs font-bold"
                          icon={<MessageSquare className="w-3.5 h-3.5 text-[#166534]" />}
                        >
                          Ask KRISHVYA
                        </Button>

                        {!isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Check className="w-3.5 h-3.5" />}
                            onClick={() => handleMarkAsRead(alert.id)}
                            className="text-xs text-gray-600 hover:text-gray-900"
                          >
                            Mark Read
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => handleDismiss(alert.id)}
                          className="text-gray-400 hover:text-rose-600 text-xs"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              /* ========================================================================= */
              /* 9. EMPTY STATE                                                            */
              /* ========================================================================= */
              <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-[#E5E7EB] shadow-soft space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center mx-auto text-2xl">
                  🟢
                </div>
                <h3 className="font-black text-gray-900 text-lg sm:text-xl tracking-tight">
                  YOUR FARM IS LOOKING GOOD
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-md mx-auto">
                  No important alerts right now. We'll show an alert here when something needs your attention.
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => navigate('/farm')}
                    variant="primary"
                    size="sm"
                    className="bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs"
                  >
                    View My Farm
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
