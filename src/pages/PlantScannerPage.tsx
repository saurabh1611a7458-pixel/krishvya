import React, { useState } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  ScanLine,
  Camera,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';

export const PlantScannerPage: React.FC = () => {
  const [scanned, setScanned] = useState(true);

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-teal-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Plant & Weed Scanner
              </h1>
            </div>
            <p className="text-xs text-gray-500">
              Identify unknown plants, noxious weeds, and calculate eradication methods
            </p>
          </div>

          <span className="text-xs font-bold text-teal-800 bg-teal-100 px-3 py-1 rounded-full">
            Botanical Vision AI
          </span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Scan Container */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-6 text-center space-y-4">
                <h3 className="font-bold text-gray-900 text-base text-left">
                  Scan Plant / Weed
                </h3>

                <div
                  onClick={() => setScanned(true)}
                  className="border-2 border-dashed border-earth-300 hover:border-teal-500 rounded-3xl p-8 transition-colors cursor-pointer bg-earth-50/50 hover:bg-teal-50/30 flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-teal-700">
                    <ScanLine className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">
                      Take photo of wild plant or weed
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Focus on leaves, flowers, or root base
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    icon={<Camera className="w-4 h-4" />}
                    className="bg-teal-700 hover:bg-teal-800 text-white"
                  >
                    Scan Now
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right: Scan Identification Result */}
            <div className="lg:col-span-7 space-y-4">
              {scanned ? (
                <Card className="p-6 space-y-5 border-teal-200">
                  <div className="flex items-start justify-between pb-4 border-b border-earth-100">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        Invasive Noxious Weed
                      </span>
                      <h3 className="text-2xl font-black text-gray-900 mt-1">
                        Parthenium hysterophorus
                      </h3>
                      <p className="text-xs text-gray-500">Common local name: Congress Grass / Gajar Ghas</p>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>96% Accuracy</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                    <span className="font-bold text-amber-900 block flex items-center gap-1">
                      <AlertOctagon className="w-4 h-4 text-amber-700" />
                      <span>Agricultural Threat Warning:</span>
                    </span>
                    <p>
                      Compromises soybean yield by up to 30% through allelopathic chemicals that suppress neighboring root establishment. May cause dermatitis in livestock and handlers.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-900 text-sm">Safe Removal Guidance:</h4>
                    <div className="space-y-1.5 text-xs text-gray-700">
                      <div className="flex items-start gap-2">
                        <span className="p-0.5 rounded-full bg-teal-100 text-teal-800 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                        </span>
                        <span>Uproot manually before flowering to prevent seed dispersal (wears gloves).</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="p-0.5 rounded-full bg-teal-100 text-teal-800 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                        </span>
                        <span>Introduce bio-control beetle <em>Zygogramma bicolorata</em> for long-term suppressive containment.</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : null}
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
