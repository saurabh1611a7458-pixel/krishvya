import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { MapPlaceholder } from '../components/common/MapPlaceholder';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { useLanguage } from '../context/LanguageContext';
import { useFarm } from '../context/FarmContext';
import { CropStage } from '../types';
import {
  Sprout,
  MapPin,
  Maximize2,
  Check,
  ArrowRight,
  ArrowLeft,
  Search,
  Sparkles,
  Leaf,
  CheckCircle2,
} from 'lucide-react';

const CROP_OPTIONS = [
  { name: 'Soybean', icon: '🌱', variety: 'JS-335' },
  { name: 'Wheat', icon: '🌾', variety: 'Sharbati / Lokwan' },
  { name: 'Rice', icon: '🍚', variety: 'Basmati / Hybrid' },
  { name: 'Tomato', icon: '🍅', variety: 'Abhinav' },
  { name: 'Maize', icon: '🌽', variety: 'Kaveri / Pioneer' },
  { name: 'Cotton', icon: '☁️', variety: 'Bt Cotton' },
];

const STAGE_OPTIONS: { stage: CropStage; desc: string; icon: string }[] = [
  { stage: 'Seedling', desc: 'Young tender shoots emerging from soil', icon: '🌱' },
  { stage: 'Vegetative', desc: 'Rapid leaf, stalk and root development', icon: '🌿' },
  { stage: 'Flowering', desc: 'Buds opening and flowers pollinating', icon: '🌸' },
  { stage: 'Fruiting', desc: 'Pods and fruits swelling and maturing', icon: '🍇' },
  { stage: 'Harvest', desc: 'Matured grains/crops ready for reaping', icon: '🌾' },
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { farm, updateFarm } = useFarm();

  const [step, setStep] = useState(1);

  // Form State for each step
  const [locationName, setLocationName] = useState('Maharashtra, India');
  const [searchQuery, setSearchQuery] = useState('Maharashtra, India');
  const [farmSize, setFarmSize] = useState<number>(2.5);
  const [sizeUnit, setSizeUnit] = useState<'acres' | 'hectares'>('acres');
  const [selectedCrop, setSelectedCrop] = useState<string>('Soybean');
  const [selectedStage, setSelectedStage] = useState<CropStage>('Flowering');
  const [soilChoice, setSoilChoice] = useState<'yes' | 'not_now'>('not_now');
  const [soilType, setSoilType] = useState('Loamy Black Cotton');
  const [phValue, setPhValue] = useState('6.8');

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      // Finalize and save to FarmContext
      updateFarm({
        location: {
          ...farm.location,
          address: locationName,
          state: locationName.includes(',') ? locationName : `${locationName}, India`,
        },
        size: Number(farmSize) || 2.5,
        sizeUnit,
        crop: {
          ...farm.crop,
          name: selectedCrop,
          stage: selectedStage,
        },
        soil: {
          ...farm.soil,
          soilType: soilType || 'Loamy Black Cotton',
          ph: parseFloat(phValue) || 6.8,
        },
      });

      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex flex-col justify-between selection:bg-krishi-100">
      {/* Top Header */}
      <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-krishi-700 flex items-center justify-center text-white">
            <Sprout className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-black text-krishi-900 tracking-tight">
              KRISHVYA
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-gray-500">
              Farm Onboarding
            </span>
          </div>
        </div>

        {/* Progress Tracker (Steps 2 through 6) */}
        {step > 1 && (
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
            <span>Step {step} of 6</span>
            <div className="w-20 sm:w-32 bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-krishi-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>
        )}

        <LanguageSelector compact />
      </header>

      {/* Main Multi-Step Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        {/* STEP 1: Welcome Screen */}
        {step === 1 && (
          <Card className="w-full max-w-xl text-center p-8 sm:p-12 shadow-soft-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-3xl bg-krishi-100 text-krishi-700 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Sprout className="w-10 h-10 stroke-[2.5]" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">
              {t('onboardingWelcomeTitle')}
            </h1>

            <p className="text-base sm:text-lg text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
              {t('onboardingWelcomeDesc')}
            </p>

            <div className="bg-earth-50 rounded-2xl p-4 mb-8 text-left border border-earth-200/80 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <CheckCircle2 className="w-4 h-4 text-krishi-600" />
                <span>Locate your land coordinate for rainfall radar</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <CheckCircle2 className="w-4 h-4 text-krishi-600" />
                <span>Tell us your current crop and growth stage</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <CheckCircle2 className="w-4 h-4 text-krishi-600" />
                <span>Takes less than 2 minutes</span>
              </div>
            </div>

            <Button
              onClick={handleNext}
              variant="primary"
              size="lg"
              fullWidth
              icon={<ArrowRight className="w-5 h-5" />}
            >
              {t('letsStart')}
            </Button>
          </Card>
        )}

        {/* STEP 2: Where is your farm? (Location & Map) */}
        {step === 2 && (
          <Card className="w-full max-w-2xl p-6 sm:p-8 shadow-soft-lg space-y-6 animate-in fade-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center gap-2 text-krishi-700 font-bold text-xs uppercase tracking-wider mb-1">
                <MapPin className="w-4 h-4" />
                <span>Step 2 • Location</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                {t('whereIsYourFarm')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Search your village, district, or pin your field on the satellite map.
              </p>
            </div>

            {/* Location Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchLocation')}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 text-gray-900 text-sm focus:ring-2 focus:ring-krishi-500 focus:outline-none"
                />
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setLocationName(searchQuery)}
              >
                Find
              </Button>
            </div>

            {/* Interactive Map Component */}
            <MapPlaceholder
              locationName={locationName}
              acres={farmSize}
              interactive={true}
              onLocationSelect={(_, __, addr) => setLocationName(addr)}
            />

            <div className="flex items-center justify-between pt-4 border-t border-earth-100">
              <Button onClick={handleBack} variant="ghost" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
                {t('back')}
              </Button>
              <Button onClick={handleNext} variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                {t('continue')}
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 3: How big is your farm? */}
        {step === 3 && (
          <Card className="w-full max-w-xl p-6 sm:p-8 shadow-soft-lg space-y-6 animate-in fade-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center gap-2 text-krishi-700 font-bold text-xs uppercase tracking-wider mb-1">
                <Maximize2 className="w-4 h-4" />
                <span>Step 3 • Land Size</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                {t('howBigIsFarm')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Accurate acreage helps calculate seed, irrigation and yield benchmarks.
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label={t('farmSize')}
                type="number"
                step="0.1"
                min="0.1"
                value={farmSize}
                onChange={(e) => setFarmSize(parseFloat(e.target.value) || 0)}
                placeholder="2.5"
                required
              />

              {/* Unit Selector: Acres vs Hectares */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">Unit of Measurement</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSizeUnit('acres')}
                    className={`p-3.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      sizeUnit === 'acres'
                        ? 'border-krishi-600 bg-krishi-50 text-krishi-900 ring-2 ring-krishi-500/20'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>{t('acres')}</span>
                    {sizeUnit === 'acres' && <Check className="w-4 h-4 text-krishi-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSizeUnit('hectares')}
                    className={`p-3.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      sizeUnit === 'hectares'
                        ? 'border-krishi-600 bg-krishi-50 text-krishi-900 ring-2 ring-krishi-500/20'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span>{t('hectares')}</span>
                    {sizeUnit === 'hectares' && <Check className="w-4 h-4 text-krishi-600" />}
                  </button>
                </div>
              </div>

              {/* Quick Presets for smallholders */}
              <div className="pt-2">
                <span className="text-xs text-gray-500 mb-1.5 block">Common farm sizes:</span>
                <div className="flex flex-wrap gap-2">
                  {[1.0, 2.0, 2.5, 5.0, 10.0].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFarmSize(preset)}
                      className="px-3 py-1.5 rounded-lg bg-earth-100 hover:bg-earth-200 text-xs font-semibold text-gray-700"
                    >
                      {preset} {sizeUnit}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-earth-100">
              <Button onClick={handleBack} variant="ghost" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
                {t('back')}
              </Button>
              <Button onClick={handleNext} variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                {t('continue')}
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 4: What are you growing? */}
        {step === 4 && (
          <Card className="w-full max-w-2xl p-6 sm:p-8 shadow-soft-lg space-y-6 animate-in fade-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center gap-2 text-krishi-700 font-bold text-xs uppercase tracking-wider mb-1">
                <Sprout className="w-4 h-4" />
                <span>Step 4 • Crop Selection</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                {t('whatAreYouGrowing')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Select your primary standing crop for this season.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {CROP_OPTIONS.map((crop) => {
                const isSelected = selectedCrop === crop.name;
                return (
                  <button
                    key={crop.name}
                    type="button"
                    onClick={() => setSelectedCrop(crop.name)}
                    className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-krishi-600 bg-krishi-50 text-krishi-900 ring-2 ring-krishi-500/30 shadow-xs'
                        : 'border-earth-200 bg-white hover:border-earth-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{crop.icon}</span>
                      {isSelected && <Check className="w-4 h-4 text-krishi-700" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-gray-900">{crop.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{crop.variety}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-earth-100">
              <Button onClick={handleBack} variant="ghost" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
                {t('back')}
              </Button>
              <Button onClick={handleNext} variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                {t('continue')}
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 5: What stage is your crop? */}
        {step === 5 && (
          <Card className="w-full max-w-2xl p-6 sm:p-8 shadow-soft-lg space-y-6 animate-in fade-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center gap-2 text-krishi-700 font-bold text-xs uppercase tracking-wider mb-1">
                <Leaf className="w-4 h-4" />
                <span>Step 5 • Growth Stage</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                {t('whatStageIsCrop')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Crop stage determines disease vulnerability and water schedule.
              </p>
            </div>

            <div className="space-y-3">
              {STAGE_OPTIONS.map((item) => {
                const isSelected = selectedStage === item.stage;
                return (
                  <button
                    key={item.stage}
                    type="button"
                    onClick={() => setSelectedStage(item.stage)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-krishi-600 bg-krishi-50 ring-2 ring-krishi-500/20'
                        : 'border-earth-200 hover:border-earth-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">{item.stage}</h4>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="p-1 rounded-full bg-krishi-600 text-white">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-earth-100">
              <Button onClick={handleBack} variant="ghost" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
                {t('back')}
              </Button>
              <Button onClick={handleNext} variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
                {t('continue')}
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 6: Soil Details Toggle */}
        {step === 6 && (
          <Card className="w-full max-w-xl p-6 sm:p-8 shadow-soft-lg space-y-6 animate-in fade-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center gap-2 text-krishi-700 font-bold text-xs uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Step 6 • Soil Health</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                {t('knowSoilDetails')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Have you completed a soil health card or lab test recently?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSoilChoice('yes')}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  soilChoice === 'yes'
                    ? 'border-krishi-600 bg-krishi-50 text-krishi-900 font-bold ring-2 ring-krishi-500/20'
                    : 'border-earth-200 hover:border-earth-300 text-gray-700'
                }`}
              >
                <div className="text-2xl mb-1">📋</div>
                <div className="text-sm font-semibold">{t('yesIllEnter')}</div>
              </button>

              <button
                type="button"
                onClick={() => setSoilChoice('not_now')}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  soilChoice === 'not_now'
                    ? 'border-krishi-600 bg-krishi-50 text-krishi-900 font-bold ring-2 ring-krishi-500/20'
                    : 'border-earth-200 hover:border-earth-300 text-gray-700'
                }`}
              >
                <div className="text-2xl mb-1">⏳</div>
                <div className="text-sm font-semibold">{t('notNow')}</div>
              </button>
            </div>

            {soilChoice === 'not_now' ? (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-sm flex items-start gap-3">
                <span className="text-xl">😊</span>
                <p className="font-medium leading-relaxed">
                  {t('noProblemSoilLater')} We will estimate baseline values based on your regional soil maps.
                </p>
              </div>
            ) : (
              <div className="space-y-4 p-4 rounded-2xl bg-earth-50 border border-earth-200">
                <Input
                  label="Soil Type"
                  type="text"
                  placeholder="e.g. Loamy Black Cotton, Alluvial, Red sandy"
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                />
                <Input
                  label="Soil pH (approximate)"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 6.8"
                  value={phValue}
                  onChange={(e) => setPhValue(e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-earth-100">
              <Button onClick={handleBack} variant="ghost" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
                {t('back')}
              </Button>
              <Button
                onClick={handleNext}
                variant="primary"
                size="lg"
                icon={<Check className="w-5 h-5" />}
                className="bg-krishi-700 hover:bg-krishi-800 font-bold shadow-md"
              >
                {t('createMyFarm')}
              </Button>
            </div>
          </Card>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-gray-400">
        KRISHVYA • Step-by-Step Setup
      </footer>
    </div>
  );
};
