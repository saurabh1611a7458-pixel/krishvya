import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { useFarm } from '../context/FarmContext';
import { supabaseService } from '../services/supabaseService';
import {
  History,
  Calendar,
  AlertCircle,
  Sprout,
  Stethoscope,
  Layers,
  FileCheck,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface HistoryItem {
  id: string;
  date: string;
  type: string;
  title: string;
  desc: string;
  category: 'crop' | 'soil' | 'disease' | 'problem' | 'farm';
}

export const HistoryPage: React.FC = () => {
  const { farm, user, problemCases } = useFarm();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadRealHistory = async () => {
      if (!farm.id || !user.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const items: HistoryItem[] = [];

        // 1. Sowing Event from Farm Record
        const sowingDate = farm.crop?.sowingDate || farm.sowing_date;
        if (sowingDate) {
          items.push({
            id: `hist_sow_${farm.id}`,
            date: new Date(sowingDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            type: 'Sowing Recorded',
            title: `${farm.crop?.name || farm.crop_variety || 'Crop'} Sowing Registered`,
            desc: `${farm.size} ${farm.sizeUnit || 'acres'} seeded with ${farm.crop?.variety ? `variety ${farm.crop.variety}` : 'standard variety'}. Sowing stage: ${farm.crop?.stage || 'Active'}.`,
            category: 'crop',
          });
        }

        // 2. Real Soil Tests
        const soilTests = await supabaseService.getSoilTests(user.id, farm.id);
        if (soilTests && soilTests.length > 0) {
          soilTests.forEach((st) => {
            items.push({
              id: `hist_soil_${st.id}`,
              date: new Date(st.testDate || st.createdAt || Date.now()).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
              type: 'Soil Test Recorded',
              title: `Soil Health Analysis (Score: ${st.healthScore}/100)`,
              desc: `Measured pH: ${st.ph}, Nitrogen: ${st.nitrogen}, Phosphorus: ${st.phosphorus}, Potassium: ${st.potassium}, Moisture: ${st.moisturePercentage}%.`,
              category: 'soil',
            });
          });
        }

        // 3. Real Disease Scans
        const diseaseScans = await supabaseService.getDiseaseScans(user.id, farm.id);
        if (diseaseScans && diseaseScans.length > 0) {
          diseaseScans.forEach((ds) => {
            items.push({
              id: `hist_scan_${ds.id}`,
              date: new Date(ds.createdAt || Date.now()).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
              type: 'Pathogen Scan',
              title: `Leaf Scan: ${ds.detectedProblem}`,
              desc: `${ds.crop || 'Plant'} diagnosis (${ds.severity} severity). Recommendation: ${ds.recommendation?.slice(0, 120)}...`,
              category: 'disease',
            });
          });
        }

        // 4. Real Problem Cases
        if (problemCases && problemCases.length > 0) {
          problemCases.forEach((pc) => {
            items.push({
              id: `hist_case_${pc.id}`,
              date: new Date(pc.createdAt || Date.now()).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
              type: 'Case Logged',
              title: `Advisory Case: ${pc.title}`,
              desc: `Status: ${pc.status.toUpperCase()} • ${pc.description || 'Filed with KRISHVYA Agronomy Team.'}`,
              category: 'problem',
            });
          });
        }

        // Sort descending by date
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (isMounted) {
          setHistoryItems(items);
        }
      } catch (err) {
        console.warn('[HistoryPage] Error assembling history:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRealHistory();

    return () => {
      isMounted = false;
    };
  }, [farm.id, farm.crop?.name, farm.crop?.sowingDate, user.id, problemCases]);

  const renderCategoryIcon = (category: string) => {
    switch (category) {
      case 'crop':
        return <Sprout className="w-4 h-4 text-emerald-600" />;
      case 'soil':
        return <Layers className="w-4 h-4 text-amber-600" />;
      case 'disease':
        return <Stethoscope className="w-4 h-4 text-rose-600" />;
      case 'problem':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <FileCheck className="w-4 h-4 text-krishi-700" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-krishi-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Past Activities
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Chronological log of operations, soil tests, scans, and resolved cases for {farm.name || 'selected farm'}
            </p>
          </div>

          {farm.name && (
            <span className="text-xs font-bold text-gray-600 bg-earth-100 px-3 py-1 rounded-full border border-earth-200 w-fit">
              {farm.name} • {farm.crop?.name || 'Crop'}
            </span>
          )}
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-3 border-krishi-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-gray-500">Loading verified farm records...</p>
            </div>
          ) : historyItems.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center bg-white border border-earth-200/90 shadow-soft max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-earth-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-gray-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                No Farm Events Recorded Yet
              </h3>
              <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
                As you log soil tests, perform leaf disease scans, or record field activities, a chronological operations timeline will automatically build here for {farm.name || 'your farm'}.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  to="/soil"
                  className="px-4 py-2 bg-white hover:bg-earth-50 text-gray-700 border border-earth-300 font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Record Soil Test
                </Link>
                <Link
                  to="/disease"
                  className="px-4 py-2 bg-krishi-700 hover:bg-krishi-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Scan a Plant
                </Link>
              </div>
            </Card>
          ) : (
            <div className="relative border-l-2 border-krishi-200 pl-6 ml-4 space-y-6">
              {historyItems.map((evt) => (
                <div key={evt.id} className="relative group">
                  {/* Node indicator */}
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-krishi-700 border-2 border-white shadow-xs group-hover:scale-125 transition-transform" />

                  <Card className="p-5 hover:border-krishi-300 transition-all bg-white border-earth-200/90 shadow-soft">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-lg bg-earth-100">
                          {renderCategoryIcon(evt.category)}
                        </div>
                        <span className="text-xs font-bold text-krishi-800 uppercase tracking-wider">
                          {evt.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{evt.date}</span>
                      </div>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-gray-900">
                      {evt.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {evt.desc}
                    </p>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
