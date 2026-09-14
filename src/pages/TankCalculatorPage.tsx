import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { useFarm } from '../context/FarmContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { voiceService } from '../services/voiceService';
import {
  Pipette,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Layers,
  Leaf,
  Droplets,
} from 'lucide-react';

interface ChemicalItem {
  id: string;
  name: string;
  category: string;
  formulation: string;
  standardDosePerLiter: number;
  unit: string;
  activeTarget: string;
  isOrganic: boolean;
}

const DEFAULT_CHEMICALS: ChemicalItem[] = [
  {
    id: 'mancozeb',
    name: 'Mancozeb (Dithane M-45)',
    category: 'Fungicide',
    formulation: '75% WP',
    standardDosePerLiter: 2.5,
    unit: 'g',
    activeTarget: 'Leaf Blight, Downy Mildew, Rust',
    isOrganic: false,
  },
  {
    id: 'chlorantraniliprole',
    name: 'Chlorantraniliprole (Coragen)',
    category: 'Insecticide',
    formulation: '18.5% SC',
    standardDosePerLiter: 0.3,
    unit: 'ml',
    activeTarget: 'Pod Borer, Fall Armyworm, Bollworm',
    isOrganic: false,
  },
  {
    id: 'neem_oil',
    name: 'Pure Neem Oil (10,000 ppm)',
    category: 'Bio-Pesticide',
    formulation: 'EC Bio-Botanical',
    standardDosePerLiter: 3.0,
    unit: 'ml',
    activeTarget: 'Whiteflies, Aphids, Mites',
    isOrganic: true,
  },
  {
    id: 'copper_oxychloride',
    name: 'Copper Oxychloride (Blitox 50)',
    category: 'Fungicide',
    formulation: '50% WP',
    standardDosePerLiter: 2.5,
    unit: 'g',
    activeTarget: 'Bacterial Blight, Canker, Leaf Spot',
    isOrganic: false,
  },
  {
    id: 'chlorpyrifos',
    name: 'Chlorpyrifos (Dursban)',
    category: 'Insecticide',
    formulation: '20% EC',
    standardDosePerLiter: 2.0,
    unit: 'ml',
    activeTarget: 'Cutworms, Caterpillars, Termites',
    isOrganic: false,
  },
  {
    id: 'carbendazim',
    name: 'Carbendazim (Bavistin)',
    category: 'Fungicide',
    formulation: '50% WP',
    standardDosePerLiter: 1.5,
    unit: 'g',
    activeTarget: 'Powdery Mildew, Collar Rot, Wilt',
    isOrganic: false,
  },
  {
    id: 'imidacloprid',
    name: 'Imidacloprid (Confidor)',
    category: 'Insecticide',
    formulation: '17.8% SL',
    standardDosePerLiter: 0.5,
    unit: 'ml',
    activeTarget: 'Aphids, Whiteflies, Thrips',
    isOrganic: false,
  },
  {
    id: 'trichoderma',
    name: 'Trichoderma viride',
    category: 'Bio-Pesticide',
    formulation: 'Bio-fungicide Powder',
    standardDosePerLiter: 5.0,
    unit: 'g',
    activeTarget: 'Root rot, Wilt, Damping off',
    isOrganic: true,
  },
  {
    id: 'npk_19_19_19',
    name: 'Water Soluble NPK (19:19:19)',
    category: 'Soluble Fertilizer',
    formulation: '100% Water Soluble Granules',
    standardDosePerLiter: 5.0,
    unit: 'g',
    activeTarget: 'Balanced vegetative growth',
    isOrganic: false,
  },
];

export const TankCalculatorPage: React.FC = () => {
  const { farm } = useFarm();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();

  const [tankSize, setTankSize] = useState<number>(15);
  const [farmAcres, setFarmAcres] = useState<number>(farm.size || 2.5);
  const [chemicalList, setChemicalList] = useState<ChemicalItem[]>(DEFAULT_CHEMICALS);
  const [selectedPrimaryChem, setSelectedPrimaryChem] = useState<string>('mancozeb');
  const [selectedSecondaryChem, setSelectedSecondaryChem] = useState<string>('');

  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Check URL params if pre-filled from Disease Doctor
  useEffect(() => {
    const prefillChem = searchParams.get('chemical');
    if (prefillChem) {
      const match = chemicalList.find(
        (c) =>
          c.name.toLowerCase().includes(prefillChem.toLowerCase()) ||
          c.id.toLowerCase().includes(prefillChem.toLowerCase())
      );
      if (match) {
        setSelectedPrimaryChem(match.id);
      }
    }
  }, [searchParams, chemicalList]);

  // Load chemical list from backend
  useEffect(() => {
    const fetchChemicals = async () => {
      try {
        const res = await api.getAgrochemicals();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setChemicalList(res.data);
        }
      } catch (err) {
        console.warn('Could not load chemical list from backend:', err);
      }
    };
    fetchChemicals();
  }, []);

  const recalculate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.calculateTankDose({
        chemicalId: selectedPrimaryChem,
        secondaryChemicalId: selectedSecondaryChem,
        tankCapacityLiters: tankSize,
        farmAcres,
      });

      if (res.success && res.data) {
        setCalculationResult(res.data);
      }
    } catch (err) {
      console.warn('Tank calculation error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedPrimaryChem, selectedSecondaryChem, tankSize, farmAcres]);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  const pumpPresets = [
    { label: '12L Battery Pump', value: 12 },
    { label: '15L Standard Knapsack (गांव की टंकी)', value: 15, isPopular: true },
    { label: '16L Power Pump', value: 16 },
    { label: '20L Backpack', value: 20 },
    { label: '200L Drum Trolley', value: 200 },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <Pipette className="w-5 h-5 text-krishi-800" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Spray Tank Dosing & Chemical Safety
              </h1>
            </div>
            <p className="text-xs text-gray-500">
              No academic g/ha math • Exact bottle caps, milliliters & curdling warnings for your village pump
            </p>
          </div>

          <div className="flex items-center gap-2">
            {loading && (
              <span className="text-xs font-semibold text-krishi-700 animate-pulse">
                Calculating...
              </span>
            )}
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unbiased ICAR Dosing</span>
            </span>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Input Configuration */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-6 space-y-5">
                {/* 1. Tank Size Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    1. Select Your Spray Pump Tank Size (स्प्रे पंप की क्षमता):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {pumpPresets.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setTankSize(preset.value)}
                        className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                          tankSize === preset.value
                            ? 'border-krishi-700 bg-krishi-50 text-krishi-900 ring-2 ring-krishi-600/30'
                            : 'border-earth-200 bg-white text-gray-700 hover:border-earth-300'
                        }`}
                      >
                        <span className="block text-base font-black">{preset.value} Liters</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5 truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Primary Chemical Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    2. Choose Medicine / Chemical (दवा चुनें):
                  </label>
                  <select
                    value={selectedPrimaryChem}
                    onChange={(e) => setSelectedPrimaryChem(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-krishi-500 bg-white"
                  >
                    {chemicalList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.category} - {c.formulation})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Secondary Chemical for Tank Mix Check */}
                <div className="p-3.5 bg-earth-50 rounded-2xl border border-earth-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-krishi-700" />
                      <span>Mix 2nd Chemical? (टैंक में दूसरी दवा):</span>
                    </label>
                    <span className="text-[10px] text-gray-400">Optional</span>
                  </div>

                  <select
                    value={selectedSecondaryChem}
                    onChange={(e) => setSelectedSecondaryChem(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-krishi-500 bg-white"
                  >
                    <option value="">-- None (Single chemical spray) --</option>
                    {chemicalList
                      .filter((c) => c.id !== selectedPrimaryChem)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          + {c.name} ({c.category})
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-gray-500 leading-tight">
                    Select a 2nd formulation to check if they safely mix together without curdling or burning leaves.
                  </p>
                </div>

                {/* 4. Farm Acreage */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Total Area to Spray (खेत का रकबा):
                    </label>
                    <span className="text-sm font-black text-krishi-800">{farmAcres} Acres</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={15}
                    step={0.5}
                    value={farmAcres}
                    onChange={(e) => setFarmAcres(parseFloat(e.target.value))}
                    className="w-full accent-krishi-700"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>0.5 Acre</span>
                    <span>5 Acres</span>
                    <span>15 Acres</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Results & Compatibility Card */}
            <div className="lg:col-span-7 space-y-4">
              {calculationResult ? (
                <div className="space-y-4">
                  {/* Compatibility Alert Banner */}
                  {calculationResult.compatibility.status === 'DANGEROUS' ? (
                    <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-500 text-red-900 shadow-soft space-y-2 animate-pulse">
                      <div className="flex items-center gap-2">
                        <AlertOctagon className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <h3 className="font-black text-base sm:text-lg tracking-tight">
                          {calculationResult.compatibility.title}
                        </h3>
                      </div>
                      <p className="text-xs font-medium leading-relaxed">
                        {calculationResult.compatibility.explanation}
                      </p>
                      <div className="p-3 bg-red-100/80 rounded-xl text-xs font-bold text-red-950 border border-red-300">
                        {calculationResult.compatibility.farmerWarningHindi}
                      </div>
                    </div>
                  ) : calculationResult.compatibility.status === 'SAFE' && selectedSecondaryChem ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 shadow-soft space-y-1.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <h3 className="font-bold text-sm tracking-tight">
                          {calculationResult.compatibility.title}
                        </h3>
                      </div>
                      <p className="text-xs text-emerald-900 leading-relaxed">
                        {calculationResult.compatibility.explanation}
                      </p>
                    </div>
                  ) : calculationResult.compatibility.status === 'CAUTION' ? (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 shadow-soft space-y-1.5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <h3 className="font-bold text-sm tracking-tight">
                          {calculationResult.compatibility.title}
                        </h3>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed">
                        {calculationResult.compatibility.explanation}
                      </p>
                    </div>
                  ) : null}

                  {/* Practical Village Measurement Cards */}
                  <Card className="p-6 space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-earth-100">
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Dose for {tankSize}L Pump ({calculationResult.selectedChemical.name})
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
                            {calculationResult.dosePerTankFormatted}
                          </span>
                          <span className="text-sm text-gray-500 font-semibold">per pump</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          voiceService.speak(
                            `एक ${tankSize} लीटर के पंप में आपको ${calculationResult.dosePerTankFormatted} दवा डालनी है। यह लगभग ${calculationResult.bottleCapsPerTank} ढक्कन के बराबर है। पूरे खेत के लिए लगभग ${calculationResult.totalTanksForFarm} टंकी पानी लगेगा।`,
                            language
                          )
                        }
                        className="p-2.5 rounded-xl bg-krishi-100 text-krishi-800 hover:bg-krishi-200 transition-colors"
                        title="Listen in regional voice"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* 3 Visual Metric Badges */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200">
                        <span className="text-[11px] font-bold text-sky-800 uppercase block">Bottle Caps</span>
                        <strong className="text-2xl font-black text-sky-950 block mt-1">
                          {calculationResult.bottleCapsPerTank}
                        </strong>
                        <span className="text-[10px] text-sky-700">1 cap = 10 ml</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase block">Tanks Per Acre</span>
                        <strong className="text-2xl font-black text-emerald-950 block mt-1">
                          {calculationResult.totalTanksForAcre}
                        </strong>
                        <span className="text-[10px] text-emerald-700">~135L water/acre</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-earth-100 border border-earth-300">
                        <span className="text-[11px] font-bold text-gray-700 uppercase block">Total For Farm</span>
                        <strong className="text-2xl font-black text-gray-900 block mt-1">
                          {calculationResult.totalTanksForFarm}
                        </strong>
                        <span className="text-[10px] text-gray-500">tanks for {farmAcres} acres</span>
                      </div>
                    </div>

                    {/* Total Material Needed for Farm */}
                    <div className="p-3.5 rounded-xl bg-earth-50 border border-earth-200 flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-medium">Total Medicine Needed from Store:</span>
                      <strong className="text-sm font-black text-gray-900">
                        {calculationResult.totalChemicalNeeded}
                      </strong>
                    </div>

                    {/* Step-by-Step Mixing Protocol */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                        <Droplets className="w-4 h-4 text-krishi-700" />
                        <span>Proper Bucket Mixing Protocol (घोल बनाने का सही तरीका):</span>
                      </h4>
                      <div className="space-y-1.5 pl-2 text-xs text-gray-700 font-medium">
                        {calculationResult.stepByStepMixingOrder.map((step: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-krishi-600 mt-1.5 flex-shrink-0"></span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Zero-Cost Organic Bio-Alternative */}
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase">
                          <Leaf className="w-4 h-4 text-emerald-700" />
                          <span>Zero-Cost Organic Alternative</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {calculationResult.zeroCostOrganicAlternative.costEstimate}
                        </span>
                      </div>
                      <h5 className="font-black text-emerald-950 text-sm">
                        {calculationResult.zeroCostOrganicAlternative.name}
                      </h5>
                      <p className="text-xs text-emerald-900 leading-relaxed">
                        {calculationResult.zeroCostOrganicAlternative.recipe}
                      </p>
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="p-12 text-center text-gray-500">
                  <div className="animate-spin w-8 h-8 mx-auto mb-2 text-krishi-600">⏳</div>
                  <p className="text-sm">Calculating tank dosage and safety matrix...</p>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
