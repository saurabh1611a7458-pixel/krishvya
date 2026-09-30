import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useFarm } from '../context/FarmContext';
import { supabaseService } from '../services/supabaseService';
import { SoilTestRecord } from '../types';
import {
  Layers,
  Sparkles,
  Sprout,
  Calendar,
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
} from 'lucide-react';

export const SoilHealthPage: React.FC = () => {
  const { farm, user, updateFarm } = useFarm();
  const [improveModalOpen, setImproveModalOpen] = useState(false);
  const [recordTestModalOpen, setRecordTestModalOpen] = useState(false);
  const [soilTests, setSoilTests] = useState<SoilTestRecord[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for logging a real soil test
  const [testFormData, setTestFormData] = useState({
    testDate: new Date().toISOString().split('T')[0],
    source: '',
    sampleDepth: '0 - 15 cm',
    soilType: farm.soil?.soilType || farm.soil_type || '',
    ph: '' as string | number,
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    organicCarbon: '',
    moisturePercentage: '' as string | number,
    notes: '',
  });

  // Load soil test records strictly isolated by user ID and selected farm ID
  useEffect(() => {
    let isMounted = true;
    const loadSoilTests = async () => {
      if (!user.id || !farm.id) return;
      setLoadingTests(true);
      try {
        const tests = await supabaseService.getSoilTests(user.id, farm.id);
        if (isMounted) {
          setSoilTests(tests || []);
        }
      } catch (err) {
        console.warn('Failed to fetch soil tests:', err);
      } finally {
        if (isMounted) setLoadingTests(false);
      }
    };
    loadSoilTests();
    return () => {
      isMounted = false;
    };
  }, [user.id, farm.id]);

  const latestTest = soilTests[0];

  // Dynamic values: preference given to latest verified soil test, then farm.soil
  const soilType = latestTest?.soilType || farm.soil?.soilType || farm.soil_type || '';
  const ph = typeof latestTest?.ph === 'number' ? latestTest.ph : (typeof farm.soil?.ph === 'number' && farm.soil.ph > 0 ? farm.soil.ph : null);
  const nitrogen = latestTest?.nitrogen || farm.soil?.nitrogen || '';
  const phosphorus = latestTest?.phosphorus || farm.soil?.phosphorus || '';
  const potassium = latestTest?.potassium || farm.soil?.potassium || '';
  const organicCarbon = latestTest?.organicCarbon || farm.soil?.organicCarbon || '';
  const moisture = typeof latestTest?.moisturePercentage === 'number'
    ? latestTest.moisturePercentage
    : (typeof farm.soil?.moisturePercentage === 'number' && farm.soil.moisturePercentage > 0 ? farm.soil.moisturePercentage : null);
  const lastTestedDate = latestTest?.testDate || farm.soil?.lastTestedDate || '';

  // Determine if sufficient data exists for health score calculation
  const hasMeasurementData = Boolean(
    ph !== null ||
    nitrogen ||
    phosphorus ||
    potassium ||
    organicCarbon ||
    moisture !== null
  );

  // Dynamic health score: computed from real measurements if available, never fake defaults
  const score = useMemo(() => {
    if (!hasMeasurementData) return null;
    let computed = 60;
    if (ph !== null) {
      if (ph >= 6.2 && ph <= 7.5) computed += 15;
      else if (ph >= 5.5 && ph <= 8.2) computed += 5;
    }
    if (nitrogen === 'Good' || nitrogen === 'High') computed += 8;
    else if (nitrogen === 'Medium') computed += 4;

    if (phosphorus === 'Good' || phosphorus === 'High' || phosphorus === 'Medium') computed += 8;
    if (potassium === 'Good' || potassium === 'High') computed += 8;
    if (moisture !== null && moisture >= 25 && moisture <= 60) computed += 8;
    if (organicCarbon && !organicCarbon.toLowerCase().includes('low')) computed += 5;

    return Math.min(95, computed);
  }, [hasMeasurementData, ph, nitrogen, phosphorus, potassium, moisture, organicCarbon]);

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = score !== null ? circumference - (score / 100) * circumference : circumference;

  // Dynamic agronomic recommendation based on real measurements
  const dynamicRecommendation = useMemo(() => {
    if (!hasMeasurementData) {
      return 'No soil test measurements are currently recorded for this parcel. Record a lab test or Soil Health Card to generate field-specific fertilization and conditioning recommendations.';
    }

    const recs: string[] = [];
    if (ph !== null) {
      if (ph < 6.0) recs.push(`Soil is moderately acidic (pH ${ph}). Apply agricultural lime or dolomite @ 200 kg/acre to restore optimal nutrient bioavailability.`);
      else if (ph > 8.0) recs.push(`Soil is alkaline (pH ${ph}). Apply gypsum and incorporate organic compost to prevent micronutrient lock-up.`);
    }

    if (nitrogen === 'Low') {
      recs.push('Available nitrogen is low. Apply split dose of composted manure or neem-coated urea, or plant a green manure crop (Dhaincha).');
    }
    if (phosphorus === 'Low') {
      recs.push('Phosphorus is deficient. Apply single super phosphate (SSP) or rock phosphate near the root zone.');
    }
    if (potassium === 'Low') {
      recs.push('Potassium is low. Apply muriate of potash (MOP) to improve plant pest resistance and water stress tolerance.');
    }
    if (organicCarbon && (organicCarbon.toLowerCase().includes('low') || parseFloat(organicCarbon) < 0.5)) {
      recs.push('Organic carbon is below recommended benchmark. Incorporate well-rotted FYM (3-4 tonnes/acre) to restore micro-biological diversity.');
    }

    if (recs.length === 0) {
      return `Soil parameters for ${farm.name || 'this parcel'} are well-balanced. Maintain soil biological activity with periodic compost and crop residue retention.`;
    }

    return recs.join(' ');
  }, [hasMeasurementData, ph, nitrogen, phosphorus, potassium, organicCarbon, farm.name]);

  // Handle saving new soil test
  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.id || !farm.id) return;
    setIsSubmitting(true);

    try {
      const phNum = testFormData.ph !== '' ? Number(testFormData.ph) : undefined;
      const moistureNum = testFormData.moisturePercentage !== '' ? Number(testFormData.moisturePercentage) : undefined;

      const newRecord: SoilTestRecord = {
        id: `soil_test_${Date.now()}`,
        userId: user.id,
        farmId: farm.id,
        testDate: testFormData.testDate,
        source: testFormData.source.trim() || 'Soil Health Card',
        sampleDepth: testFormData.sampleDepth,
        soilType: testFormData.soilType.trim() || soilType,
        ph: phNum,
        nitrogen: testFormData.nitrogen || undefined,
        phosphorus: testFormData.phosphorus || undefined,
        potassium: testFormData.potassium || undefined,
        organicCarbon: testFormData.organicCarbon.trim() || undefined,
        moisturePercentage: moistureNum,
        notes: testFormData.notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await supabaseService.saveSoilTest(newRecord);

      // Update farm.soil in FarmContext & Supabase
      await updateFarm({
        soil_type: newRecord.soilType,
        soil: {
          ...farm.soil,
          soilType: newRecord.soilType || farm.soil?.soilType || '',
          ph: newRecord.ph ?? farm.soil?.ph ?? 7.0,
          nitrogen: (newRecord.nitrogen || farm.soil?.nitrogen || 'Medium') as any,
          phosphorus: (newRecord.phosphorus || farm.soil?.phosphorus || 'Medium') as any,
          potassium: (newRecord.potassium || farm.soil?.potassium || 'Good') as any,
          organicCarbon: newRecord.organicCarbon || farm.soil?.organicCarbon || '',
          moisturePercentage: newRecord.moisturePercentage ?? farm.soil?.moisturePercentage ?? 0,
          lastTestedDate: newRecord.testDate,
        },
      });

      // Refresh test list
      const updatedTests = await supabaseService.getSoilTests(user.id, farm.id);
      setSoilTests(updatedTests);

      // Log farm event
      supabaseService.logFarmEvent(
        user.id,
        farm.id,
        'soil_test_logged',
        `Recorded soil test from ${newRecord.source} (pH ${newRecord.ph || 'N/A'})`
      ).catch(console.warn);

      setRecordTestModalOpen(false);
    } catch (err) {
      console.warn('Failed to record soil test:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBarWidth = (value: string | number | null | undefined): string => {
    if (!value || value === 'No data available') return '0%';
    if (typeof value === 'number') {
      return `${Math.min(100, Math.max(10, value * 10))}%`;
    }
    const valLower = value.toLowerCase();
    if (valLower.includes('high') || valLower.includes('optimal') || valLower.includes('good')) return '80%';
    if (valLower.includes('medium')) return '55%';
    if (valLower.includes('low')) return '30%';
    return '50%';
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-800" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                My Soil
              </h1>
            </div>
            <p className="text-xs text-gray-500">
              Verified soil records & agronomic analytics for{' '}
              <strong className="text-gray-800">{farm.name || 'Selected Farm'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-gray-600 bg-earth-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-earth-700" />
              <span>Tested: {lastTestedDate ? new Date(lastTestedDate).toLocaleDateString() : 'No tests recorded'}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5 text-krishi-700" />}
              onClick={() => setRecordTestModalOpen(true)}
              className="text-xs font-bold"
            >
              Record Soil Test
            </Button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Main Soil Health Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Overall Health Score Circular Card */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-6 text-center flex flex-col items-center justify-center bg-gradient-to-br from-white to-amber-50/30">
                <div className="relative flex items-center justify-center my-4">
                  <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#F1EFE9"
                      strokeWidth="9"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={score !== null ? '#16a34a' : '#D1D5DB'}
                      strokeWidth="9"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    {score !== null ? (
                      <>
                        <span className="text-4xl font-black text-gray-900">{score}</span>
                        <span className="text-sm font-bold text-gray-400">/ 100</span>
                        <span className="text-xs font-bold text-krishi-700 mt-1 uppercase">
                          {score >= 80 ? 'Optimal' : score >= 65 ? 'Moderate' : 'Needs Care'}
                        </span>
                      </>
                    ) : (
                      <>
                        <FlaskConical className="w-8 h-8 text-gray-400 mb-1" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Not Tested</span>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900">
                  {score !== null ? 'Fertile Soil Status' : 'Soil Analysis Pending'}
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  {soilType ? (
                    `${soilType} • Based on field samples.`
                  ) : (
                    <span className="text-gray-400">Soil type has not been set for this parcel.</span>
                  )}
                </p>

                <div className="mt-6 pt-4 border-t border-earth-100 w-full flex justify-between text-xs text-gray-600">
                  <span>Status: <strong>{score !== null ? 'Sampled' : 'Pending Sample'}</strong></span>
                  <span>Target: <strong>80+</strong></span>
                </div>
              </Card>

              {/* Lab Test Card Details */}
              <Card className="p-5">
                <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-700" />
                    <span>Soil Health Card Record</span>
                  </span>
                  {latestTest && (
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Verified Test
                    </span>
                  )}
                </h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between py-1 border-b border-earth-100">
                    <span>Testing Lab / Source</span>
                    <span className="font-semibold text-gray-800">
                      {latestTest?.source || <span className="text-gray-400 font-normal">No test recorded</span>}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-earth-100">
                    <span>Sample Depth</span>
                    <span className="font-semibold text-gray-800">
                      {latestTest?.sampleDepth || <span className="text-gray-400 font-normal">No data available</span>}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Next Test Cycle</span>
                    <span className="font-semibold text-krishi-700">
                      {lastTestedDate ? 'Recommended in 3 years' : 'Initial test recommended'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Parameter Progress Bars */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-earth-100">
                  <h3 className="text-base font-bold text-gray-900">Soil Parameters Breakdown</h3>
                  <span className="text-xs text-gray-400">Essential Nutrients & Structure</span>
                </div>

                <div className="space-y-5">
                  {/* Nitrogen */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1.5">
                      <span className="text-gray-800">Nitrogen (N)</span>
                      <span className={nitrogen ? 'text-krishi-700 font-bold' : 'text-gray-400 font-normal'}>
                        {nitrogen || 'No data available'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      {nitrogen ? (
                        <div className="bg-krishi-600 h-full rounded-full transition-all duration-500" style={{ width: getBarWidth(nitrogen) }}></div>
                      ) : (
                        <div className="w-full h-full border border-dashed border-gray-200"></div>
                      )}
                    </div>
                  </div>

                  {/* Phosphorus */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1.5">
                      <span className="text-gray-800">Phosphorus (P)</span>
                      <span className={phosphorus ? 'text-amber-700 font-bold' : 'text-gray-400 font-normal'}>
                        {phosphorus || 'No data available'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      {phosphorus ? (
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: getBarWidth(phosphorus) }}></div>
                      ) : (
                        <div className="w-full h-full border border-dashed border-gray-200"></div>
                      )}
                    </div>
                  </div>

                  {/* Potassium */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1.5">
                      <span className="text-gray-800">Potassium (K)</span>
                      <span className={potassium ? 'text-krishi-700 font-bold' : 'text-gray-400 font-normal'}>
                        {potassium || 'No data available'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      {potassium ? (
                        <div className="bg-krishi-600 h-full rounded-full transition-all duration-500" style={{ width: getBarWidth(potassium) }}></div>
                      ) : (
                        <div className="w-full h-full border border-dashed border-gray-200"></div>
                      )}
                    </div>
                  </div>

                  {/* pH */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1.5">
                      <span className="text-gray-800">Soil pH</span>
                      <span className={ph !== null ? 'text-krishi-700 font-bold' : 'text-gray-400 font-normal'}>
                        {ph !== null ? `${ph}` : 'No data available'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      {ph !== null ? (
                        <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(10, (ph / 14) * 100))}%` }}></div>
                      ) : (
                        <div className="w-full h-full border border-dashed border-gray-200"></div>
                      )}
                    </div>
                  </div>

                  {/* Organic Carbon */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1.5">
                      <span className="text-gray-800">Organic Carbon (OC)</span>
                      <span className={organicCarbon ? 'text-amber-700 font-bold' : 'text-gray-400 font-normal'}>
                        {organicCarbon || 'No data available'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      {organicCarbon ? (
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: getBarWidth(organicCarbon) }}></div>
                      ) : (
                        <div className="w-full h-full border border-dashed border-gray-200"></div>
                      )}
                    </div>
                  </div>

                  {/* Moisture */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1.5">
                      <span className="text-gray-800">Moisture Content</span>
                      <span className={moisture !== null ? 'text-sky-700 font-bold' : 'text-gray-400 font-normal'}>
                        {moisture !== null ? `${moisture}%` : 'No data available'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                      {moisture !== null ? (
                        <div className="bg-sky-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, moisture)}%` }}></div>
                      ) : (
                        <div className="w-full h-full border border-dashed border-gray-200"></div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Dynamic Soil Recommendation Banner */}
              <Card className="p-6 bg-gradient-to-br from-krishi-50 via-white to-amber-50/50 border-krishi-300 shadow-soft">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-krishi-900 font-bold text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-krishi-600" />
                      <span>Dynamic Soil Recommendation</span>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                      "{dynamicRecommendation}"
                    </p>
                  </div>

                  <Button
                    onClick={() => setImproveModalOpen(true)}
                    variant="primary"
                    size="md"
                    className="bg-krishi-700 hover:bg-krishi-800 flex-shrink-0 font-bold shadow-xs"
                  >
                    Soil Plan
                  </Button>
                </div>
              </Card>

              {/* Soil Test History Section */}
              <Card className="p-6">
                <div className="flex items-center justify-between pb-3 border-b border-earth-100 mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>Soil Test History</span>
                  </h3>
                  <span className="text-xs text-gray-500 bg-earth-100 px-2.5 py-0.5 rounded-full font-medium">
                    {soilTests.length} {soilTests.length === 1 ? 'record' : 'records'}
                  </span>
                </div>

                {loadingTests ? (
                  <div className="text-center py-6 text-xs text-gray-500">Loading soil test history...</div>
                ) : soilTests.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {soilTests.map((t) => (
                      <div
                        key={t.id}
                        className="p-3 bg-earth-50/70 rounded-xl border border-earth-200/70 flex items-start justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{t.source}</span>
                            <span className="text-[10px] text-gray-500">
                              {new Date(t.testDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-600">
                            {t.ph !== undefined && <span>pH: <strong>{t.ph}</strong></span>}
                            {t.nitrogen && <span>N: <strong>{t.nitrogen}</strong></span>}
                            {t.phosphorus && <span>P: <strong>{t.phosphorus}</strong></span>}
                            {t.potassium && <span>K: <strong>{t.potassium}</strong></span>}
                            {t.moisturePercentage !== undefined && <span>Moisture: <strong>{t.moisturePercentage}%</strong></span>}
                          </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 bg-earth-50/50 rounded-xl border border-dashed border-earth-200">
                    <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-gray-700">No previous soil tests recorded</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Upload your Soil Health Card or lab analysis to track soil fertility over time.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNav />

      {/* Record Soil Test Modal */}
      <Modal
        isOpen={recordTestModalOpen}
        onClose={() => setRecordTestModalOpen(false)}
        title="Record New Soil Test"
      >
        <form onSubmit={handleSaveTest} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Test Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={testFormData.testDate}
                onChange={(e) => setTestFormData({ ...testFormData, testDate: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Testing Lab / Agency <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={testFormData.source}
                onChange={(e) => setTestFormData({ ...testFormData, source: e.target.value })}
                placeholder="e.g. KVK Lab, District Soil Card"
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Soil pH
              </label>
              <input
                type="number"
                step="0.1"
                min="3.0"
                max="11.0"
                value={testFormData.ph}
                onChange={(e) => setTestFormData({ ...testFormData, ph: e.target.value })}
                placeholder="e.g. 6.8"
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Nitrogen (N)
              </label>
              <select
                value={testFormData.nitrogen}
                onChange={(e) => setTestFormData({ ...testFormData, nitrogen: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none bg-white"
              >
                <option value="">Select Level</option>
                <option value="Low">Low (&lt; 250 kg/ha)</option>
                <option value="Medium">Medium (250-400 kg/ha)</option>
                <option value="Good">Good / Optimal</option>
                <option value="High">High (&gt; 400 kg/ha)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Phosphorus (P)
              </label>
              <select
                value={testFormData.phosphorus}
                onChange={(e) => setTestFormData({ ...testFormData, phosphorus: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none bg-white"
              >
                <option value="">Select Level</option>
                <option value="Low">Low (&lt; 15 kg/ha)</option>
                <option value="Medium">Medium (15-25 kg/ha)</option>
                <option value="Good">Good / Optimal</option>
                <option value="High">High (&gt; 25 kg/ha)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Potassium (K)
              </label>
              <select
                value={testFormData.potassium}
                onChange={(e) => setTestFormData({ ...testFormData, potassium: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none bg-white"
              >
                <option value="">Select Level</option>
                <option value="Low">Low (&lt; 120 kg/ha)</option>
                <option value="Medium">Medium (120-280 kg/ha)</option>
                <option value="Good">Good / Optimal</option>
                <option value="High">High (&gt; 280 kg/ha)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Organic Carbon
              </label>
              <input
                type="text"
                value={testFormData.organicCarbon}
                onChange={(e) => setTestFormData({ ...testFormData, organicCarbon: e.target.value })}
                placeholder="e.g. 0.65%"
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Moisture %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={testFormData.moisturePercentage}
                onChange={(e) => setTestFormData({ ...testFormData, moisturePercentage: e.target.value })}
                placeholder="e.g. 35"
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-krishi-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-earth-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRecordTestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="bg-krishi-700 hover:bg-krishi-800 text-white font-bold"
            >
              {isSubmitting ? 'Saving...' : 'Save Soil Test'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Soil Improvement Guide Modal */}
      <Modal
        isOpen={improveModalOpen}
        onClose={() => setImproveModalOpen(false)}
        title="Regenerative Soil Improvement Plan"
      >
        <div className="space-y-4 text-sm text-gray-700">
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
              <Sprout className="w-4 h-4 text-emerald-700" />
              <span>Step 1: Well-Rotted Farmyard Manure (FYM)</span>
            </h4>
            <p className="text-xs text-emerald-950">
              Apply 2 to 3 tonnes of decomposed cow dung manure per acre prior to pre-monsoon harrowing. This boosts soil biological activity significantly.
            </p>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
              <Layers className="w-4 h-4 text-amber-700" />
              <span>Step 2: Green Manuring (Dhaincha / Sunhemp)</span>
            </h4>
            <p className="text-xs text-amber-950">
              Sow Sunhemp or Sesbania (Dhaincha) during fallow interval, and plow it under after 45 days. Adds natural organic matter and biological nitrogen.
            </p>
          </div>

          <Button
            onClick={() => setImproveModalOpen(false)}
            variant="primary"
            size="md"
            fullWidth
          >
            Got It, Thanks
          </Button>
        </div>
      </Modal>
    </div>
  );
};
