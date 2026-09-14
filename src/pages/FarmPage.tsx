import React from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { MapPlaceholder } from '../components/common/MapPlaceholder';
import { useFarm } from '../context/FarmContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Trees,
  Edit,
} from 'lucide-react';

export const FarmPage: React.FC = () => {
  const { farm, user } = useFarm();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {t('myFarm')}
            </h1>
            <p className="text-xs text-gray-500">Your digital farm profile and field boundary</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<Edit className="w-3.5 h-3.5" />}
            onClick={() => alert('Field boundary editing will be enabled in Phase 2 with GeoJSON support.')}
          >
            Edit Farm
          </Button>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Main Grid matching Design #6 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Map Card */}
            <div className="lg:col-span-6 space-y-4">
              <Card className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trees className="w-5 h-5 text-krishi-700" />
                    <h3 className="font-bold text-gray-900 text-base">Field Boundary Map</h3>
                  </div>
                  <span className="text-xs font-semibold text-krishi-800 bg-krishi-100 px-2.5 py-0.5 rounded-full">
                    Active Plot
                  </span>
                </div>

                <MapPlaceholder
                  locationName={farm.location.address}
                  acres={farm.size}
                  interactive={true}
                  className="h-80"
                />

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600 bg-earth-50 p-3 rounded-xl border border-earth-200/60">
                  <div>GPS: <strong>21.3855° N, 78.9189° E</strong></div>
                  <div>Coordinates: <strong>4 Boundary Vertices</strong></div>
                </div>
              </Card>
            </div>

            {/* Right: Farm Details Card */}
            <div className="lg:col-span-6 space-y-4">
              <Card className="p-6">
                <div className="flex items-center justify-between pb-4 border-b border-earth-100 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{farm.name}</h2>
                    <p className="text-xs text-gray-500">Registered to {user.name}</p>
                  </div>
                  <span className="p-2 rounded-xl bg-krishi-100 text-krishi-700 font-bold text-sm">
                    {farm.size} {farm.sizeUnit}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-200/70">
                    <span className="text-xs text-gray-500 block">Location</span>
                    <strong className="text-gray-900">{farm.location.address}</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-200/70">
                    <span className="text-xs text-gray-500 block">Area</span>
                    <strong className="text-gray-900">{farm.size} {farm.sizeUnit}</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-200/70">
                    <span className="text-xs text-gray-500 block">Crop</span>
                    <strong className="text-krishi-800">{farm.crop.name} ({farm.crop.variety || 'JS-335'})</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-200/70">
                    <span className="text-xs text-gray-500 block">Crop Stage</span>
                    <strong className="text-gray-900">{farm.crop.stage}</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-200/70">
                    <span className="text-xs text-gray-500 block">Irrigation</span>
                    <strong className="text-gray-900">{farm.irrigationType} System</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-200/70">
                    <span className="text-xs text-gray-500 block">Soil Type</span>
                    <strong className="text-gray-900">{farm.soil.soilType}</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-earth-50/70 border border-earth-200/70 sm:col-span-2">
                    <span className="text-xs text-gray-500 block">Sowing Date</span>
                    <strong className="text-gray-900">{farm.crop.sowingDate}</strong>
                  </div>
                </div>
              </Card>

              {/* Health Score Breakdown matching Design #6 */}
              <Card className="p-6 bg-gradient-to-br from-white to-krishi-50/30">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                  <span>Farm Health Index</span>
                  <span className="text-2xl font-black text-krishi-700">{farm.farmHealthScore}/100</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Soil Nutrient Balance</span>
                      <span>82%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-krishi-600 h-full rounded-full" style={{ width: '82%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Water / Moisture Status</span>
                      <span>76%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-600 h-full rounded-full" style={{ width: '76%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Crop Canopy & NDVI</span>
                      <span>90%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>Weather Resilience</span>
                      <span>65%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
