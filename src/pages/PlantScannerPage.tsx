import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useFarm } from '../context/FarmContext';
import { api } from '../services/api';
import { supabaseService } from '../services/supabaseService';
import { DiseaseScan } from '../types';
import {
  ScanLine,
  Camera,
  Upload,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  AlertTriangle,
  History,
  Leaf,
} from 'lucide-react';

export const PlantScannerPage: React.FC = () => {
  const { farm, user } = useFarm();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeScan, setActiveScan] = useState<DiseaseScan | null>(null);
  const [recentScans, setRecentScans] = useState<DiseaseScan[]>([]);

  // Load previous weed/plant scans for selected farm
  useEffect(() => {
    if (!farm?.id) return;
    const userId = user?.id || farm.user_id;
    if (!userId) return;
    let mounted = true;

    supabaseService.getDiseaseScans(userId, farm.id).then((scans) => {
      if (mounted) {
        const weedScans = scans.filter((s) => s.crop.toLowerCase().includes('weed') || s.crop.toLowerCase().includes('plant'));
        setRecentScans(weedScans);
        if (weedScans.length > 0) {
          setActiveScan(weedScans[0]);
          setSelectedImage(weedScans[0].imageUrl);
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [farm.id, farm.user_id, user?.id]);

  const handleAnalyzeImage = async (base64Img: string) => {
    const userId = user?.id || farm.user_id;
    if (!userId || !farm?.id) return;

    setAnalyzing(true);
    try {
      const notes = `Plant / Weed identification for farm ${farm.name || 'Farm'}. Identify botanical name, whether invasive/harmful, and non-chemical eradication methods.`;
      const res = await api.diagnoseDisease(base64Img, 'Weed / Wild Plant', notes);

      if (res.success && res.data) {
        const d = res.data;
        const newScan: DiseaseScan = {
          id: `scan_weed_${Date.now()}`,
          userId,
          farmId: farm.id,
          imageUrl: base64Img,
          crop: 'Weed / Wild Plant',
          detectedProblem: d.diseaseName || 'Identified Plant Species',
          scientificName: d.scientificName,
          severity: (d.severity as any) || 'Medium',
          confidence: typeof d.confidence === 'number' ? d.confidence : 85,
          symptoms: d.symptoms && d.symptoms.length > 0 ? d.symptoms : ['Botanical specimen captured'],
          actionSteps: d.actionSteps && d.actionSteps.length > 0 ? d.actionSteps : ['Inspect surrounding field rows'],
          causes: d.causes && d.causes.length > 0 ? d.causes : ['Wild seed dispersal by wind or runoff'],
          organicTreatment: d.organicTreatment || 'Manual uprooting before seed dispersal.',
          chemicalTreatment: d.chemicalTreatment || 'Apply registered post-emergence herbicide if density exceeds threshold.',
          preventativeMeasures: d.preventativeMeasures || ['Maintain clean field margins and use clean seed stocks.'],
          precautions: d.precautions || 'Always consult local agricultural guidelines before spraying.',
          isUncertain: Boolean(d.isUncertain),
          uncertaintyMessage: d.uncertaintyMessage,
          aiEngine: d.aiEngine,
          createdAt: new Date().toISOString(),
        };

        setActiveScan(newScan);
        await supabaseService.saveDiseaseScan(newScan);
        setRecentScans((prev) => [newScan, ...prev.filter((s) => s.id !== newScan.id)]);
      }
    } catch (err) {
      console.warn('Botanical vision scan failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImage(result);
      handleAnalyzeImage(result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFilePicked}
          className="hidden"
        />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFilePicked}
          className="hidden"
        />

        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-teal-700" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Plant & Weed Scanner
              </h1>
            </div>
            <p className="text-xs text-gray-500">
              Identify unknown plants, noxious weeds, and calculate eradication methods for {farm.name}
            </p>
          </div>

          <span className="text-xs font-bold text-teal-800 bg-teal-100 px-3 py-1 rounded-full">
            Botanical Vision AI
          </span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Scan Container & Recent Scans */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-6 text-center space-y-4">
                <h3 className="font-bold text-gray-900 text-base text-left">
                  Scan Plant / Weed
                </h3>

                <div
                  onClick={() => fileInputRef.current?.click()}
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

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      icon={<Camera className="w-4 h-4" />}
                      className="bg-teal-700 hover:bg-teal-800 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraInputRef.current?.click();
                      }}
                    >
                      Camera
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Upload className="w-4 h-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      Upload
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Weed Scan History */}
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-1.5">
                  <History className="w-4 h-4 text-teal-700" />
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                    Recent Weed Scans ({recentScans.length})
                  </h4>
                </div>

                {recentScans.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {recentScans.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setActiveScan(s);
                          setSelectedImage(s.imageUrl);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          activeScan?.id === s.id
                            ? 'bg-teal-700 text-white'
                            : 'bg-earth-100 text-gray-700 hover:bg-earth-200'
                        }`}
                      >
                        🌿 {s.detectedProblem}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    No weed scans recorded yet for {farm.name}.
                  </p>
                )}
              </Card>
            </div>

            {/* Right: Scan Identification Result */}
            <div className="lg:col-span-7 space-y-4">
              {analyzing ? (
                <Card className="p-12 text-center space-y-3 border-teal-200">
                  <RefreshCw className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
                  <h3 className="text-base font-bold text-gray-900">
                    Identifying botanical species...
                  </h3>
                  <p className="text-xs text-gray-500">
                    Analyzing leaf venation, flower structure, and weed competitiveness.
                  </p>
                </Card>
              ) : activeScan ? (
                <Card className="p-6 space-y-5 border-teal-200">
                  <div className="flex items-start justify-between pb-4 border-b border-earth-100">
                    <div className="flex items-start gap-4">
                      {selectedImage && (
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 border shrink-0">
                          <img
                            src={selectedImage}
                            alt="Scanned weed"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          activeScan.severity === 'High' || activeScan.severity === 'Critical'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-teal-100 text-teal-800'
                        }`}>
                          {activeScan.severity} Severity Threat
                        </span>
                        <h3 className="text-2xl font-black text-gray-900 mt-1">
                          {activeScan.detectedProblem}
                        </h3>
                        {activeScan.scientificName && (
                          <p className="text-xs text-gray-500 italic">{activeScan.scientificName}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>{activeScan.confidence}% Match</span>
                      </div>
                    </div>
                  </div>

                  {/* Uncertainty Banner */}
                  {activeScan.isUncertain && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Diagnosis Uncertain:</strong> {activeScan.uncertaintyMessage || 'Optical leaf indicators are inconclusive. Please capture a clearer photo or consult an extension officer.'}
                      </div>
                    </div>
                  )}

                  {/* Threat Warning */}
                  {activeScan.causes && activeScan.causes.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                      <span className="font-bold text-amber-900 flex items-center gap-1">
                        <AlertOctagon className="w-4 h-4 text-amber-700" />
                        <span>Field Impact & Causes:</span>
                      </span>
                      <p>{activeScan.causes.join(' ')}</p>
                    </div>
                  )}

                  {/* Removal Guidance */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-900 text-sm">Safe Removal Guidance:</h4>
                    <div className="space-y-1.5 text-xs text-gray-700">
                      {activeScan.actionSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="p-0.5 rounded-full bg-teal-100 text-teal-800 mt-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Treatment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {activeScan.organicTreatment && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                        <strong className="text-emerald-900 block mb-0.5">Non-Chemical / Bio Method:</strong>
                        <p className="text-emerald-800">{activeScan.organicTreatment}</p>
                      </div>
                    )}

                    {activeScan.isUncertain ? (
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                        <strong className="text-gray-700 block mb-0.5">Chemical Eradication:</strong>
                        <p className="text-gray-500">Withheld: Diagnosis is uncertain. Do NOT apply herbicides without confirmed identification.</p>
                      </div>
                    ) : activeScan.chemicalTreatment ? (
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                        <strong className="text-blue-900 block mb-0.5">Targeted Herbicide:</strong>
                        <p className="text-blue-800">{activeScan.chemicalTreatment}</p>
                      </div>
                    ) : null}
                  </div>
                </Card>
              ) : (
                <Card className="p-12 text-center space-y-4 border-earth-200">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                    <Leaf className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      No Plant or Weed Scanned Yet
                    </h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                      Take or upload a photo of any wild plant or weed to identify its botanical species and safe eradication measures.
                    </p>
                  </div>
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
