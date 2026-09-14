import React, { useState } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { MOCK_ALERTS, AlertItem } from '../data/mockData';
import { Link } from 'react-router-dom';
import {
  Bell,
  CloudRain,
  Satellite,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'weather' | 'crop' | 'soil' | 'system'>('all');
  const [alerts, setAlerts] = useState<AlertItem[]>(MOCK_ALERTS);

  const filteredAlerts = alerts.filter((item) => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  const getIcon = (category: string) => {
    switch (category) {
      case 'weather':
        return <CloudRain className="w-5 h-5 text-red-600" />;
      case 'crop':
        return <Satellite className="w-5 h-5 text-amber-600" />;
      case 'soil':
        return <Droplets className="w-5 h-5 text-sky-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    }
  };

  const getBorderColor = (severity: string) => {
    if (severity === 'high') return 'border-red-300 bg-red-50/30';
    if (severity === 'medium') return 'border-amber-300 bg-amber-50/25';
    return 'border-sky-300 bg-sky-50/20';
  };

  const handleDismiss = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
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
            <p className="text-xs text-gray-500">Stay informed, take action ahead of field risks</p>
          </div>

          <span className="text-xs font-bold text-gray-600 bg-earth-100 px-3 py-1 rounded-full">
            {alerts.length} Active Alerts
          </span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* Category Filter Chips matching Design #14 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {(['all', 'weather', 'crop', 'soil', 'system'] as const).map((cat) => (
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

          {/* Alerts Feed matching Design #14 */}
          <div className="space-y-4">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`p-5 border transition-all ${getBorderColor(alert.severity)}`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-xl bg-white shadow-xs flex-shrink-0 mt-0.5">
                        {getIcon(alert.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900">{alert.title}</h3>
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              alert.severity === 'high'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{alert.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                      {alert.category === 'weather' && (
                        <Link to="/weather">
                          <Button variant="primary" size="sm">
                            {alert.actionableText || 'View Weather'}
                          </Button>
                        </Link>
                      )}
                      {alert.category === 'crop' && (
                        <Link to="/crop-health">
                          <Button variant="primary" size="sm">
                            {alert.actionableText || 'Inspect Field'}
                          </Button>
                        </Link>
                      )}
                      {alert.category === 'soil' && (
                        <Link to="/soil">
                          <Button variant="primary" size="sm">
                            {alert.actionableText || 'Check Soil'}
                          </Button>
                        </Link>
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
                <CheckCircle className="w-12 h-12 mx-auto text-krishi-600 mb-2" />
                <h4 className="font-bold text-gray-800">No active alerts in this category</h4>
                <p className="text-xs text-gray-500 mt-1">Your farm conditions are currently stable.</p>
              </Card>
            )}
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
