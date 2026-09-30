import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';
import { useFarm } from '../context/FarmContext';
import { supabaseService } from '../services/supabaseService';
import { generateRealFarmAlerts } from '../services/alertEngine';
import { FarmAlert } from '../types';
import {
  Bell,
  CloudRain,
  Satellite,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Clock,
  Check,
  MapPin,
  Stethoscope,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { farm, farms, selectFarm, user } = useFarm();
  const [filter, setFilter] = useState<'all' | 'weather' | 'crop' | 'soil' | 'disease'>('all');
  const [alerts, setAlerts] = useState<FarmAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id || farm.user_id;

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
        weather: farm.weather,
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
  }, [farm, userId]);

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

  const getIcon = (category: string) => {
    switch (category) {
      case 'weather':
        return <CloudRain className="w-5 h-5 text-red-600" />;
      case 'crop':
        return <Satellite className="w-5 h-5 text-amber-600" />;
      case 'soil':
        return <Droplets className="w-5 h-5 text-sky-600" />;
      case 'disease':
        return <Stethoscope className="w-5 h-5 text-rose-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    }
  };

  const getBorderColor = (severity: string, isRead: boolean) => {
    if (isRead) return 'border-earth-200 bg-earth-50/50 opacity-80';
    if (severity === 'high') return 'border-red-300 bg-red-50/30';
    if (severity === 'medium') return 'border-amber-300 bg-amber-50/25';
    return 'border-sky-300 bg-sky-50/20';
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

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Alerts & Recommendations
              </h1>
            </div>
            <p className="text-xs text-gray-500">
              Live operational alerts for {farm.name} • {farm.crop?.name || 'General Field'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                activeAlertCount > 0
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {activeAlertCount > 0 ? `${activeAlertCount} Unread Alerts` : 'All Clear'}
            </span>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* Farm Switcher */}
          {farms.length > 1 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-earth-200 text-xs shadow-xs">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <MapPin className="w-4 h-4 text-krishi-600 shrink-0" />
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
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      farm.id === f.id
                        ? 'bg-krishi-700 text-white'
                        : 'bg-earth-100 text-gray-700 hover:bg-earth-200'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(['all', 'weather', 'crop', 'soil', 'disease'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                  filter === cat
                    ? 'bg-krishi-700 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-earth-200 hover:bg-earth-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Alerts Feed */}
          <div className="space-y-4">
            {loading ? (
              <Card className="p-8 text-center text-xs text-gray-500">
                Checking field telemetry and risk thresholds...
              </Card>
            ) : filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`p-5 border transition-all ${getBorderColor(alert.severity, Boolean(alert.isRead))}`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-white shadow-xs flex-shrink-0 mt-0.5">
                        {getIcon(alert.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-gray-900">{alert.title}</h3>
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              alert.severity === 'high'
                                ? 'bg-red-100 text-red-700'
                                : alert.severity === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {alert.severity}
                          </span>
                          {alert.isRead && (
                            <span className="text-[10px] text-gray-500 font-bold bg-gray-200/60 px-2 py-0.5 rounded-full">
                              Read
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
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

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                      {alert.targetRoute && (
                        <Link to={alert.targetRoute}>
                          <Button variant="primary" size="sm">
                            {alert.actionableText || 'View Details'}
                          </Button>
                        </Link>
                      )}

                      {!alert.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Check className="w-3 h-3" />}
                          onClick={() => handleMarkAsRead(alert.id)}
                          className="text-xs text-gray-600"
                        >
                          Mark Read
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(alert.id)}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-12 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto text-emerald-600 mb-2" />
                <h4 className="font-bold text-gray-800 text-base">No active alerts.</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Telemetry for {farm.name} is stable. No severe weather, disease, or moisture deficit detected.
                </p>
              </Card>
            )}
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
