import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useFarm } from '../context/FarmContext';
import { useFarmIntelligence } from '../context/FarmIntelligenceContext';
import { supabaseService } from '../services/supabaseService';
import { SoilTestRecord } from '../types';
import {
  Layers,
  Sprout,
  Calendar,
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  Droplets,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const SoilHealthPage: React.FC = () => {
  const navigate = useNavigate();
  const { farm, user, updateFarm } = useFarm();
  const { weatherData } = useFarmIntelligence();

  const [improveModalOpen, setImproveModalOpen] = useState(false);
  const [recordTestModalOpen, setRecordTestModalOpen] = useState(false);
  const [showAdvancedData, setShowAdvancedData] = useState(false);
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
      if (!user?.id || !farm?.id) return;
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
  }, [user?.id, farm?.id]);

  const latestTest = soilTests[0];

  // Distinguish verified test data from unconfigured defaults
  const hasRealTest = Boolean(latestTest || (farm.soil?.lastTestedDate && farm.soil.lastTestedDate.trim() !== ''));

  // Dynamic values: preference given to latest verified test, then farm.soil if real test recorded
  const soilType = latestTest?.soilType || farm.soil?.soilType || farm.soil_type || '';
  const ph = typeof latestTest?.ph === 'number'
    ? latestTest.ph
    : hasRealTest && typeof farm.soil?.ph === 'number' && farm.soil.ph > 0
    ? farm.soil.ph
    : null;

  const nitrogen = latestTest?.nitrogen || (hasRealTest ? farm.soil?.nitrogen : '') || '';
  const phosphorus = latestTest?.phosphorus || (hasRealTest ? farm.soil?.phosphorus : '') || '';
  const potassium = latestTest?.potassium || (hasRealTest ? farm.soil?.potassium : '') || '';
  const organicCarbon = latestTest?.organicCarbon || (hasRealTest ? farm.soil?.organicCarbon : '') || '';

  // Moisture: Can come from test or live sensor/farm sync
  const moisture = typeof latestTest?.moisturePercentage === 'number'
    ? latestTest.moisturePercentage
    : typeof farm.soil?.moisturePercentage === 'number' && farm.soil.moisturePercentage > 0
    ? farm.soil.moisturePercentage
    : null;

  const lastTestedDate = latestTest?.testDate || (hasRealTest ? farm.soil?.lastTestedDate : '') || '';

  // Farm metadata
  const cropName = farm.crop?.name || farm.crop_variety || '';
  const cropStage = farm.crop?.stage || farm.crop_stage || '';
  const areaDisplay = farm.size ? `${farm.size} ${farm.sizeUnit || 'acres'}` : 'Area not set';

  // Determine if sufficient real data exists to evaluate status
  const hasMeasurementData = Boolean(
    ph !== null ||
    nitrogen ||
    phosphorus ||
    potassium ||
    organicCarbon ||
    moisture !== null
  );

  // Dynamic Soil Status: ONLY based on real data, never fabricated scores
  const soilStatus = useMemo<{
    type: 'good' | 'attention' | 'action' | 'nodata';
    label: string;
    sublabel: string;
  }>(() => {
    if (!hasMeasurementData) {
      return {
        type: 'nodata',
        label: 'Not enough data',
        sublabel: 'No soil test or sensor data recorded yet. Record a test to see soil health status.',
      };
    }

    // Critical issues
    const isCriticalPh = ph !== null && (ph < 5.2 || ph > 8.5);
    const isCriticallyDry = moisture !== null && moisture < 20;
    const isSevereDeficiency = nitrogen === 'Low' && phosphorus === 'Low';

    if (isCriticalPh || isCriticallyDry || isSevereDeficiency) {
      let cause = 'Immediate corrective measures required.';
      if (isCriticallyDry) cause = 'Root zone moisture is critically low. Crop is under water stress.';
      else if (isCriticalPh) cause = `Soil pH (${ph}) is severely imbalanced, preventing nutrient absorption.`;
      else if (isSevereDeficiency) cause = 'Severe nitrogen and phosphorus deficit detected in root zone.';

      return {
        type: 'action',
        label: 'Action needed',
        sublabel: cause,
      };
    }

    // Moderate issues
    const isMildPh = ph !== null && (ph < 6.0 || ph > 7.8);
    const isLowNutrient = nitrogen === 'Low' || phosphorus === 'Low' || potassium === 'Low';
    const isModerateMoisture = moisture !== null && (moisture < 28 || moisture > 70);

    if (isMildPh || isLowNutrient || isModerateMoisture) {
      let cause = 'Soil parameters require monitoring and adjustment.';
      if (isLowNutrient) {
        const lows = [nitrogen === 'Low' ? 'Nitrogen' : '', phosphorus === 'Low' ? 'Phosphorus' : '', potassium === 'Low' ? 'Potassium' : ''].filter(Boolean).join(', ');
        cause = `Low ${lows} detected. Supplement recommended before next growth phase.`;
      } else if (isModerateMoisture) {
        cause = moisture !== null && moisture < 28 ? 'Soil moisture is on the lower side. Plan irrigation soon.' : 'Soil moisture is elevated. Ensure proper drainage.';
      } else if (isMildPh) {
        cause = `Soil pH is slightly ${ph! < 6.0 ? 'acidic' : 'alkaline'} (${ph}). Nutrient absorption may be reduced.`;
      }

      return {
        type: 'attention',
        label: 'Needs attention',
        sublabel: cause,
      };
    }

    // Good status
    return {
      type: 'good',
      label: 'Good',
      sublabel: 'Soil moisture and nutrient parameters are well-balanced for normal crop growth.',
    };
  }, [hasMeasurementData, ph, nitrogen, phosphorus, potassium, moisture]);

  // Dynamic "What Should I Do?" action advice grounded in soil + crop + weather
  const whatShouldIDo = useMemo(() => {
    if (!hasMeasurementData) {
      return {
        title: 'Record a soil test or check soil moisture.',
        description: 'Once you log your Soil Health Card or lab report, KRISHVYA will provide exact fertilizer and irrigation guidance.',
      };
    }

    const rainProb = weatherData?.rainProbability ?? farm.weather?.rainProbability ?? 0;

    if (rainProb >= 50) {
      return {
        title: 'Rain expected today. Avoid nitrogen fertilizer and postpone watering.',
        description: `${rainProb}% chance of rain detected. Applying urea or top-dressing now will lead to nutrient leaching and runoff.`,
      };
    }

    if (moisture !== null && moisture < 25) {
      return {
        title: 'Soil moisture is low in root zone. Plan irrigation before peak heat.',
        description: `Current moisture is ${moisture}%. Water standing ${cropName || 'crop'} during early morning or evening hours to minimize evaporation.`,
      };
    }

    if (phosphorus === 'Low') {
      return {
        title: 'Phosphorus is deficient. Apply single super phosphate (SSP) near roots.',
        description: `Phosphorus deficiency restricts root development and tillering in ${cropName || 'standing crops'}. Place fertilizer 5 cm below seed level.`,
      };
    }

    if (nitrogen === 'Low') {
      return {
        title: 'Nitrogen is low. Side-dress composted manure or neem-coated urea.',
        description: 'Boost active chlorophyll production and vegetative foliage before flowering starts.',
      };
    }

    if (moisture !== null && moisture >= 28 && moisture <= 65) {
      return {
        title: 'Your soil moisture is currently adequate. Check soil before watering.',
        description: `Moisture level is healthy (${moisture}%). Hold off unnecessary irrigation to preserve water and prevent root diseases.`,
      };
    }

    return {
      title: 'Maintain routine soil observation and retain organic crop residue.',
      description: 'Soil condition is stable. Continue weekly moisture checks and mulch between crop rows.',
    };
  }, [hasMeasurementData, weatherData, farm.weather, moisture, phosphorus, nitrogen, cropName]);

  // KRISHVYA Soil Insight: 1 short recommendation, 1 why, 1 action
  const krishvyaInsight = useMemo(() => {
    if (!hasMeasurementData) {
      return {
        summary: 'No soil measurements recorded yet for this farm.',
        why: 'Lab testing helps identify hidden nutrient deficiencies before symptoms appear on leaves.',
        action: 'Record a Soil Health Card or test root-zone moisture to unlock custom agronomic advice.',
      };
    }

    if (phosphorus === 'Low' || phosphorus === 'Medium') {
      return {
        summary: `Phosphorus is currently in the ${phosphorus.toLowerCase()} range.`,
        why: `Phosphorus availability is crucial for root expansion and flowering in ${cropName || 'your crop'}.`,
        action: 'Review your latest soil test before applying fertilizer, and incorporate compost to improve bioavailability.',
      };
    }

    if (nitrogen === 'Low') {
      return {
        summary: 'Available nitrogen is below the optimal threshold.',
        why: 'Nitrogen drives vigorous canopy growth; deficiency leads to pale yellowing in older leaves.',
        action: 'Apply a split dose of organic compost or neem-coated urea before the next scheduled irrigation.',
      };
    }

    if (ph !== null && (ph < 6.0 || ph > 7.8)) {
      const isAcidic = ph < 6.0;
      return {
        summary: `Soil pH (${ph}) is ${isAcidic ? 'moderately acidic' : 'moderately alkaline'}.`,
        why: `${isAcidic ? 'Acidity' : 'Alkalinity'} locks up essential micronutrients like zinc and phosphorus in the soil matrix.`,
        action: isAcidic
          ? 'Apply agricultural lime or dolomite @ 150-200 kg/acre before the next sowing season.'
          : 'Apply agricultural gypsum and enrich with farmyard manure to buffer soil alkalinity.',
      };
    }

    return {
      summary: `Soil nutrients for ${farm.name || 'this parcel'} are well-balanced.`,
      why: 'Balanced N-P-K reserves provide consistent nutrition throughout the vegetative growth cycle.',
      action: 'Maintain microbial activity with periodic compost and avoid excessive chemical fertilizer.',
    };
  }, [hasMeasurementData, phosphorus, nitrogen, ph, cropName, farm.name]);

  // Handle saving new soil test
  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !farm?.id) return;
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

  // Helper for nutrient badge styling
  const renderNutrientBadge = (val: string | undefined | null) => {
    if (!val || val === 'No data available' || !hasMeasurementData) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
          <span>⚪</span> Not available
        </span>
      );
    }
    const lower = val.toLowerCase();
    if (lower.includes('good') || lower.includes('high') || lower.includes('optimal')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span>🟢</span> Good
        </span>
      );
    }
    if (lower.includes('medium')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <span>🟡</span> Medium
        </span>
      );
    }
    if (lower.includes('low')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
          <span>🔴</span> Low
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <span>🟢</span> {val}
      </span>
    );
  };

  // Moisture status badge
  const renderMoistureStatus = () => {
    if (moisture === null) {
      return {
        badge: (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
            <span>⚪</span> No data
          </span>
        ),
        label: 'No data',
      };
    }
    if (moisture < 25) {
      return {
        badge: (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span>🟡</span> Low
          </span>
        ),
        label: 'Low',
      };
    }
    if (moisture > 65) {
      return {
        badge: (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <span>🟡</span> High
          </span>
        ),
        label: 'High',
      };
    }
    return {
      badge: (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span>🟢</span> Good
        </span>
      ),
      label: 'Good',
    };
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex font-sans antialiased text-[#1F2937]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-12">
        {/* ========================================================================= */}
        {/* 1. HEADER                                                                 */}
        {/* ========================================================================= */}
        <header className="bg-white border-b border-[#E5E7EB] px-4 sm:px-8 py-4 sm:py-5 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🌱</span>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  My Soil
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#6B7280] font-medium mt-1">
                Understand your soil and what it means for your crop.
              </p>

              {/* Selected Farm Context Pill */}
              <div className="flex items-center gap-2 text-xs text-gray-600 font-medium mt-2 flex-wrap">
                <span className="font-bold text-[#166534]">
                  🌱 Soil for {farm.name || 'Selected Farm'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-700 font-semibold">
                  {soilType || 'Soil type not set'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-600">{areaDisplay}</span>
                {cropName && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-800 font-bold">{cropName}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <div className="text-xs font-semibold text-gray-600 bg-earth-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-earth-200">
                <Calendar className="w-3.5 h-3.5 text-earth-700" />
                <span>
                  Tested:{' '}
                  {lastTestedDate
                    ? new Date(lastTestedDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'No test recorded'}
                </span>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setRecordTestModalOpen(true)}
                className="bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs shadow-xs"
              >
                + Record Soil Test
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* ========================================================================= */}
          {/* 2. TODAY'S SOIL STATUS                                                    */}
          {/* ========================================================================= */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#E5E7EB] shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-[#2563EB]" />
                  TODAY'S SOIL STATUS
                </span>

                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {soilStatus.type === 'good' ? (
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span>🟢</span> Soil condition looks good
                    </span>
                  ) : soilStatus.type === 'attention' ? (
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                      <span>🟡</span> Needs attention
                    </span>
                  ) : soilStatus.type === 'action' ? (
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-extrabold bg-rose-50 text-rose-800 border border-rose-200">
                      <span>🔴</span> Action needed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-extrabold bg-gray-100 text-gray-700 border border-gray-300">
                      <span>⚪</span> Not enough data
                    </span>
                  )}

                  <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-gray-700">
                    <span className="bg-earth-50 px-2.5 py-1 rounded-lg border border-earth-200">
                      Moisture:{' '}
                      <strong className="text-gray-900 font-extrabold">
                        {moisture !== null ? `${moisture}%` : 'Not available'}
                      </strong>
                    </span>
                    <span className="bg-earth-50 px-2.5 py-1 rounded-lg border border-earth-200">
                      pH:{' '}
                      <strong className="text-gray-900 font-extrabold">
                        {ph !== null ? ph : 'Not available'}
                      </strong>
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-700 font-medium mt-2.5 leading-relaxed max-w-2xl">
                  {soilStatus.sublabel}
                </p>
              </div>

              {!hasMeasurementData && (
                <button
                  type="button"
                  onClick={() => setRecordTestModalOpen(true)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#166534] hover:bg-[#14532d] text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Soil Test</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. WHAT SHOULD I DO?                                                      */}
          {/* ========================================================================= */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#EAF4EC] border border-[#166534]/20 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black text-[#166534] uppercase tracking-wider">
                🌱 WHAT SHOULD I DO?
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
              {whatShouldIDo.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-700 font-medium mt-1 leading-relaxed">
              {whatShouldIDo.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-[#166534]/15">
              <button
                type="button"
                onClick={() => navigate('/ai-advisor')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#166534] hover:bg-[#14532d] text-white shadow-xs transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>🤖 Ask KRISHVYA</span>
              </button>

              <button
                type="button"
                onClick={() => setImproveModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-emerald-50 text-[#166534] border border-[#166534]/30 shadow-2xs transition-all cursor-pointer"
              >
                <Sprout className="w-4 h-4" />
                <span>🌱 Soil Plan</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. SOIL → CROP → ACTION (VISUAL FLOW)                                    */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#166534]" />
              <span>KRISHVYA CONNECTED INTELLIGENCE: SOIL → CROP → ACTION</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 text-xs">
              {/* Soil */}
              <div className="p-3 bg-earth-50 rounded-xl border border-earth-200 flex flex-col justify-between">
                <span className="font-bold text-gray-500 text-[10px] uppercase">💧 Soil</span>
                <span className="font-extrabold text-gray-900 mt-1 truncate">
                  {moisture !== null ? `${moisture}% Moisture` : 'Not tested'}
                </span>
                <span className="text-[10px] text-gray-500 truncate">{soilType || 'Soil not set'}</span>
              </div>

              {/* Crop */}
              <div className="p-3 bg-earth-50 rounded-xl border border-earth-200 flex flex-col justify-between">
                <span className="font-bold text-gray-500 text-[10px] uppercase">🌾 Crop</span>
                <span className="font-extrabold text-gray-900 mt-1 truncate">
                  {cropName || 'No crop'}
                </span>
                <span className="text-[10px] text-gray-500 truncate">{cropStage || 'Stage not set'}</span>
              </div>

              {/* Weather */}
              <div className="p-3 bg-earth-50 rounded-xl border border-earth-200 flex flex-col justify-between">
                <span className="font-bold text-gray-500 text-[10px] uppercase">🌦 Weather</span>
                <span className="font-extrabold text-gray-900 mt-1 truncate">
                  {weatherData?.temperature !== undefined
                    ? `${Math.round(weatherData.temperature)}°C`
                    : 'Synced'}
                </span>
                <span className="text-[10px] text-gray-500 truncate">
                  {weatherData?.rainProbability !== undefined
                    ? `${weatherData.rainProbability}% Rain`
                    : 'Open-Meteo'}
                </span>
              </div>

              {/* KRISHVYA */}
              <div className="p-3 bg-earth-50 rounded-xl border border-earth-200 flex flex-col justify-between">
                <span className="font-bold text-gray-500 text-[10px] uppercase">🤖 KRISHVYA</span>
                <span className="font-extrabold text-[#166534] mt-1 truncate">
                  Farm Intelligence
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold truncate">Grounded</span>
              </div>

              {/* Action */}
              <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 col-span-2 sm:col-span-1 flex flex-col justify-between">
                <span className="font-bold text-emerald-800 text-[10px] uppercase">✅ Action</span>
                <span className="font-black text-[#166534] mt-1 leading-tight line-clamp-2">
                  {whatShouldIDo.title.split('.')[0]}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TWO-COLUMN FARMER LAYOUT: NUTRIENTS & MOISTURE vs SOIL TEST & HISTORY     */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (Nutrients, Moisture, KRISHVYA Soil Insight) */}
            <div className="lg:col-span-7 space-y-6">
              {/* 5. SOIL NUTRIENTS */}
              <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-soft">
                <div className="flex items-center justify-between pb-3 border-b border-earth-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🧪</span>
                    <div>
                      <h3 className="text-base font-black text-gray-900 tracking-tight">
                        Crop Nutrients
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium">
                        Essential minerals that feed your standing crop
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 bg-earth-100 px-2.5 py-0.5 rounded-full">
                    {hasMeasurementData ? 'Field Test' : 'Not tested'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Nitrogen */}
                  <div className="p-3.5 bg-earth-50/80 rounded-2xl border border-earth-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Nitrogen (N)</span>
                      <span className="text-[11px] text-gray-500">For foliage & green growth</span>
                    </div>
                    {renderNutrientBadge(nitrogen)}
                  </div>

                  {/* Phosphorus */}
                  <div className="p-3.5 bg-earth-50/80 rounded-2xl border border-earth-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Phosphorus (P)</span>
                      <span className="text-[11px] text-gray-500">For roots & early vigor</span>
                    </div>
                    {renderNutrientBadge(phosphorus)}
                  </div>

                  {/* Potassium */}
                  <div className="p-3.5 bg-earth-50/80 rounded-2xl border border-earth-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Potassium (K)</span>
                      <span className="text-[11px] text-gray-500">For pest & water resilience</span>
                    </div>
                    {renderNutrientBadge(potassium)}
                  </div>

                  {/* Organic Carbon */}
                  <div className="p-3.5 bg-earth-50/80 rounded-2xl border border-earth-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Organic Carbon</span>
                      <span className="text-[11px] text-gray-500">Soil biological fertility</span>
                    </div>
                    {renderNutrientBadge(organicCarbon)}
                  </div>
                </div>
              </div>

              {/* 6. SOIL MOISTURE */}
              <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-soft">
                <div className="flex items-center justify-between pb-3 border-b border-earth-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-[#2563EB]" />
                    <div>
                      <h3 className="text-base font-black text-gray-900 tracking-tight">
                        Water in Soil
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium">
                        Root zone moisture depth: 0 - 15 cm
                      </p>
                    </div>
                  </div>
                  {renderMoistureStatus().badge}
                </div>

                <div className="flex items-baseline justify-between mt-2">
                  <div>
                    <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
                      {moisture !== null ? `${moisture}%` : 'Not available'}
                    </span>
                    <p className="text-xs font-semibold text-gray-600 mt-1">
                      {moisture !== null
                        ? moisture < 25
                          ? 'Soil is dry — irrigation required'
                          : moisture > 65
                          ? 'Soil is saturated — good reserves'
                          : 'Optimal moisture for root absorption'
                        : 'Record a soil test or sync moisture sensor'}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-400 block">Target Range</span>
                    <span className="text-sm font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 inline-block mt-0.5">
                      25% - 60%
                    </span>
                  </div>
                </div>

                {/* Single visual bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200">
                    {moisture !== null ? (
                      <div
                        className="bg-[#2563EB] h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, Math.max(5, moisture))}%` }}
                      />
                    ) : (
                      <div className="w-full h-full border border-dashed border-gray-300 rounded-full" />
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 font-semibold mt-1.5 px-0.5">
                    <span>0% Dry</span>
                    <span>25% Target Min</span>
                    <span>60% Target Max</span>
                    <span>100% Saturated</span>
                  </div>
                </div>
              </div>

              {/* 11. KRISHVYA SOIL INSIGHT */}
              <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-soft space-y-3">
                <div className="flex items-center gap-2 text-[#166534] font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#166534]" />
                  <span>🌱 KRISHVYA SOIL INSIGHT</span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-gray-900 leading-snug">
                  "{krishvyaInsight.summary}"
                </h4>
                <div className="space-y-1.5 text-xs sm:text-sm text-gray-700">
                  <p>
                    <strong className="text-gray-900 font-bold">What this means:</strong>{' '}
                    {krishvyaInsight.why}
                  </p>
                  <p>
                    <strong className="text-gray-900 font-bold">Action:</strong>{' '}
                    {krishvyaInsight.action}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Button
                    onClick={() => navigate('/ai-advisor')}
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold"
                  >
                    Ask KRISHVYA about Fertilizer
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column (Soil Test, Soil Test History) */}
            <div className="lg:col-span-5 space-y-6">
              {/* 9. SOIL TEST CARD */}
              <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-soft">
                <div className="flex items-center justify-between pb-3 border-b border-earth-100 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-800" />
                    <h3 className="text-base font-black text-gray-900 tracking-tight">
                      Soil Test
                    </h3>
                  </div>
                  {latestTest ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Verified Record
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                      No Test Yet
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 text-xs text-gray-600">
                  <div className="flex justify-between py-1.5 border-b border-earth-100">
                    <span className="font-medium text-gray-500">Test Status</span>
                    <span className="font-bold text-gray-900">
                      {latestTest ? 'Completed' : 'Pending Sample'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-earth-100">
                    <span className="font-medium text-gray-500">Testing Source</span>
                    <span className="font-bold text-gray-900">
                      {latestTest?.source || (hasRealTest ? 'Soil Health Card' : 'Not recorded')}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-earth-100">
                    <span className="font-medium text-gray-500">Test Date</span>
                    <span className="font-bold text-gray-900">
                      {lastTestedDate
                        ? new Date(lastTestedDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'No test date'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5">
                    <span className="font-medium text-gray-500">Next Recommended Test</span>
                    <span className="font-bold text-[#166534]">
                      {lastTestedDate ? 'In 2 to 3 years' : 'Initial test recommended'}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-earth-100">
                  <Button
                    onClick={() => setRecordTestModalOpen(true)}
                    variant="primary"
                    size="sm"
                    fullWidth
                    icon={<Plus className="w-3.5 h-3.5" />}
                    className="bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs"
                  >
                    + Record Soil Test
                  </Button>
                </div>
              </div>

              {/* 10. SOIL TEST HISTORY */}
              <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-soft">
                <div className="flex items-center justify-between pb-3 border-b border-earth-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-800" />
                    <h3 className="text-base font-black text-gray-900 tracking-tight">
                      Soil Test History
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 bg-earth-100 px-2.5 py-0.5 rounded-full">
                    {soilTests.length} {soilTests.length === 1 ? 'Record' : 'Records'}
                  </span>
                </div>

                {loadingTests ? (
                  <div className="text-center py-6 text-xs text-gray-500">Loading soil tests...</div>
                ) : soilTests.length > 0 ? (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {soilTests.slice(0, 5).map((t) => (
                      <div
                        key={t.id}
                        className="p-3 bg-earth-50/70 rounded-xl border border-earth-200/70 flex items-start justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{t.source}</span>
                            <span className="text-[10px] text-gray-500">
                              {new Date(t.testDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-600">
                            {t.ph !== undefined && (
                              <span>
                                pH: <strong>{t.ph}</strong>
                              </span>
                            )}
                            {t.nitrogen && (
                              <span>
                                N: <strong>{t.nitrogen}</strong>
                              </span>
                            )}
                            {t.phosphorus && (
                              <span>
                                P: <strong>{t.phosphorus}</strong>
                              </span>
                            )}
                            {t.potassium && (
                              <span>
                                K: <strong>{t.potassium}</strong>
                              </span>
                            )}
                            {t.moisturePercentage !== undefined && (
                              <span>
                                Moisture: <strong>{t.moisturePercentage}%</strong>
                              </span>
                            )}
                          </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 bg-earth-50/50 rounded-2xl border border-dashed border-earth-200">
                    <p className="text-xs font-bold text-gray-800">No soil tests recorded yet.</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Upload your Soil Health Card or lab analysis to track soil fertility over time.
                    </p>
                    <div className="mt-3">
                      <Button
                        onClick={() => setRecordTestModalOpen(true)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        + Record Soil Test
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 7. ADVANCED SOIL DETAILS (COLLAPSIBLE)                                     */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-soft overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvancedData((prev) => !prev)}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-earth-50/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🧪</span>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight">
                    Advanced Soil Details
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Exact N-P-K ratings, soil pH, organic carbon percentage, sample depth & lab metadata
                  </p>
                </div>
              </div>
              <div className="p-1 rounded-lg bg-earth-100 text-gray-600">
                {showAdvancedData ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showAdvancedData && (
              <div className="p-4 sm:p-6 pt-0 border-t border-earth-100 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
                    <span className="text-gray-500 font-medium block">Exact Nitrogen</span>
                    <strong className="text-base font-black text-gray-900 block mt-1">
                      {nitrogen || 'Not available'}
                    </strong>
                    <span className="text-[10px] text-gray-500">Available N</span>
                  </div>

                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
                    <span className="text-gray-500 font-medium block">Exact Phosphorus</span>
                    <strong className="text-base font-black text-gray-900 block mt-1">
                      {phosphorus || 'Not available'}
                    </strong>
                    <span className="text-[10px] text-gray-500">Available P</span>
                  </div>

                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
                    <span className="text-gray-500 font-medium block">Exact Potassium</span>
                    <strong className="text-base font-black text-gray-900 block mt-1">
                      {potassium || 'Not available'}
                    </strong>
                    <span className="text-[10px] text-gray-500">Available K</span>
                  </div>

                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
                    <span className="text-gray-500 font-medium block">Soil pH Value</span>
                    <strong className="text-base font-black text-gray-900 block mt-1">
                      {ph !== null ? ph : 'Not available'}
                    </strong>
                    <span className="text-[10px] text-gray-500">
                      {ph !== null ? (ph < 6.0 ? 'Acidic' : ph > 7.8 ? 'Alkaline' : 'Neutral') : 'Unmeasured'}
                    </span>
                  </div>

                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
                    <span className="text-gray-500 font-medium block">Organic Carbon</span>
                    <strong className="text-base font-black text-gray-900 block mt-1">
                      {organicCarbon || 'Not available'}
                    </strong>
                    <span className="text-[10px] text-gray-500">Organic matter %</span>
                  </div>

                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
                    <span className="text-gray-500 font-medium block">Moisture Reading</span>
                    <strong className="text-base font-black text-gray-900 block mt-1">
                      {moisture !== null ? `${moisture}%` : 'Not available'}
                    </strong>
                    <span className="text-[10px] text-gray-500">Volumetric root zone</span>
                  </div>

                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
                    <span className="text-gray-500 font-medium block">Sample Depth</span>
                    <strong className="text-base font-black text-gray-900 block mt-1">
                      {latestTest?.sampleDepth || '0 - 15 cm'}
                    </strong>
                    <span className="text-[10px] text-gray-500">Standard agricultural depth</span>
                  </div>

                  <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
                    <span className="text-gray-500 font-medium block">Testing Agency</span>
                    <strong className="text-base font-black text-gray-900 block mt-1 truncate">
                      {latestTest?.source || (hasRealTest ? 'Soil Health Card' : 'Not recorded')}
                    </strong>
                    <span className="text-[10px] text-gray-500">Analytical Lab / KVK</span>
                  </div>
                </div>

                <div className="p-3.5 bg-earth-50 rounded-xl border border-earth-200 flex items-center justify-between text-xs text-gray-600 flex-wrap gap-2">
                  <span>
                    Database Farm ID: <code className="font-mono text-gray-800">{farm.id}</code>
                  </span>
                  <span>
                    Telemetry Source:{' '}
                    <strong>{latestTest ? 'Verified Soil Health Card' : 'Farm Soil Baseline'}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <MobileBottomNav />

      {/* Record Soil Test Modal */}
      <Modal
        isOpen={recordTestModalOpen}
        onClose={() => setRecordTestModalOpen(false)}
        title="Record Soil Test"
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
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-[#166534] focus:outline-none"
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
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-[#166534] focus:outline-none"
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
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-[#166534] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                Nitrogen (N)
              </label>
              <select
                value={testFormData.nitrogen}
                onChange={(e) => setTestFormData({ ...testFormData, nitrogen: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-[#166534] focus:outline-none bg-white"
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
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-[#166534] focus:outline-none bg-white"
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
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-[#166534] focus:outline-none bg-white"
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
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-[#166534] focus:outline-none"
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
                className="w-full px-3 py-2 border border-earth-300 rounded-xl text-sm focus:ring-2 focus:ring-[#166534] focus:outline-none"
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
              className="bg-[#166534] hover:bg-[#14532d] text-white font-bold"
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
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
            <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1 text-sm">
              <Sprout className="w-4 h-4 text-emerald-700" />
              <span>Step 1: Well-Rotted Farmyard Manure (FYM)</span>
            </h4>
            <p className="text-xs text-emerald-950 leading-relaxed">
              Apply 2 to 3 tonnes of decomposed cow dung manure per acre prior to pre-monsoon harrowing. This boosts soil biological activity significantly and restores organic carbon reserves.
            </p>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5 mb-1 text-sm">
              <Layers className="w-4 h-4 text-amber-700" />
              <span>Step 2: Green Manuring (Dhaincha / Sunhemp)</span>
            </h4>
            <p className="text-xs text-amber-950 leading-relaxed">
              Sow Sunhemp or Sesbania (Dhaincha) during fallow intervals, and plow it under after 45 days. Adds natural organic biomass and fixes 60-80 kg atmospheric nitrogen per hectare biologically.
            </p>
          </div>

          <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200">
            <h4 className="font-bold text-blue-900 flex items-center gap-1.5 mb-1 text-sm">
              <Droplets className="w-4 h-4 text-blue-700" />
              <span>Step 3: Mulching & Water Retention</span>
            </h4>
            <p className="text-xs text-blue-950 leading-relaxed">
              Retain crop straw and residue between crop rows. Mulch drops soil surface temperature by 3-5°C and conserves up to 30% more root zone moisture between irrigation cycles.
            </p>
          </div>

          <Button
            onClick={() => setImproveModalOpen(false)}
            variant="primary"
            size="md"
            fullWidth
            className="bg-[#166534] hover:bg-[#14532d] text-white font-bold"
          >
            Got It, Thanks
          </Button>
        </div>
      </Modal>
    </div>
  );
};
