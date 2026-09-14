import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { PROBLEM_CATEGORIES, ProblemOption } from '../data/mockData';
import { useFarm } from '../context/FarmContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowLeft,
  CheckCircle2,
  Camera,
  Mic,
  Send,
  ShieldCheck,
} from 'lucide-react';

export const ProblemPage: React.FC = () => {
  const navigate = useNavigate();
  const { farm, submitProblem } = useFarm();
  const { t } = useLanguage();

  const [selectedProblem, setSelectedProblem] = useState<ProblemOption | null>(null);
  const [description, setDescription] = useState('');
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);

  const handleSelect = (category: ProblemOption) => {
    setSelectedProblem(category);
  };

  const handleConfirmSubmit = () => {
    if (!selectedProblem) return;
    const newCase = submitProblem(selectedProblem.id, description);
    setSubmittedCaseId(newCase.id);
  };

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        {/* Top Header */}
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-1.5 rounded-xl text-gray-600 hover:bg-earth-100 flex items-center gap-1 text-sm font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          <div className="text-xs font-semibold text-gray-500 bg-earth-100 px-3 py-1 rounded-full">
            {farm.crop.name} • {farm.location.address}
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* Reassurance Banner */}
          <div className="bg-gradient-to-r from-red-500 via-rose-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-soft-lg">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold uppercase tracking-wider">
                <span>🆘 Emergency Help Center</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                {t('whatProblemFacing')}
              </h1>
              <p className="text-white/95 text-base sm:text-lg font-medium leading-relaxed pt-1">
                "{t('dontWorryReassurance')}"
              </p>
            </div>
          </div>

          {/* Subheading Instructions */}
          <div className="flex items-center justify-between">
            <p className="text-sm sm:text-base font-bold text-gray-700">
              {t('selectProblemCat')}
            </p>
            <span className="text-xs text-gray-400">11 Categories Available</span>
          </div>

          {/* 11 Problem Category Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROBLEM_CATEGORIES.map((item) => {
              const isChosen = selectedProblem?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  type="button"
                  className={`text-left p-5 rounded-2xl border transition-all duration-150 flex flex-col justify-between touch-card bg-white ${
                    isChosen
                      ? 'border-red-500 ring-2 ring-red-400/40 shadow-soft-lg'
                      : 'border-earth-200/90 shadow-soft hover:shadow-soft-lg hover:border-earth-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{item.icon}</span>
                      {item.badge && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-earth-100 flex items-center justify-between text-xs font-semibold text-krishi-700">
                    <span>Tap to report</span>
                    <span>→</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Core Workflow Assurance Note (Section 26) */}
          <div className="bg-white rounded-2xl p-5 border border-earth-200/80 shadow-soft">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-krishi-600" />
              <span>How KRISHVYA Resolves Your Case</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
              <div className="p-3 bg-earth-50 rounded-xl">
                <span className="font-bold text-gray-900 block mb-1">1. AI Analysis</span>
                Field sensor data + weather radar + symptom imagery cross-checked.
              </div>
              <div className="p-3 bg-earth-50 rounded-xl">
                <span className="font-bold text-gray-900 block mb-1">2. Expert Verification</span>
                Cases with complex symptoms are verified by agricultural scientists.
              </div>
              <div className="p-3 bg-earth-50 rounded-xl">
                <span className="font-bold text-gray-900 block mb-1">3. Guided Solution</span>
                Step-by-step follow-up in your local language until your crop recovers.
              </div>
            </div>
          </div>
        </main>
      </div>

      <MobileBottomNav />

      {/* Detail Submission Modal */}
      {selectedProblem && (
        <Modal
          isOpen={Boolean(selectedProblem)}
          onClose={() => {
            setSelectedProblem(null);
            setSubmittedCaseId(null);
          }}
          title={submittedCaseId ? 'Problem Case Registered' : `Report: ${selectedProblem.title}`}
        >
          {submittedCaseId ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-krishi-100 text-krishi-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Case Successfully Logged!
              </h3>
              <p className="text-sm text-gray-600 max-w-sm mx-auto">
                Case ID <strong className="font-mono text-gray-800">{submittedCaseId}</strong> has been created. In Phase 2, our multi-modal AI model and agronomist network will diagnose your field.
              </p>
              <div className="pt-3">
                <Button
                  onClick={() => {
                    setSelectedProblem(null);
                    setSubmittedCaseId(null);
                    navigate('/dashboard');
                  }}
                  variant="primary"
                  size="md"
                  fullWidth
                >
                  Return to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-earth-50 rounded-xl border border-earth-200">
                <span className="text-3xl">{selectedProblem.icon}</span>
                <div>
                  <h4 className="font-bold text-gray-900">{selectedProblem.title}</h4>
                  <p className="text-xs text-gray-500">{selectedProblem.description}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Describe what you see (optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. White powder under lower leaves, started 2 days ago..."
                  className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-500 focus:outline-none"
                />
              </div>

              {/* Photo & Voice placeholders */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => alert('Photo upload will be activated in Phase 2 AI Disease Doctor.')}
                  className="p-3 rounded-xl border border-dashed border-gray-300 hover:border-krishi-500 text-xs font-semibold text-gray-600 flex items-center justify-center gap-2 hover:bg-krishi-50 transition-colors"
                >
                  <Camera className="w-4 h-4 text-krishi-700" />
                  <span>Attach Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => alert('Voice note recording will be activated in Phase 2.')}
                  className="p-3 rounded-xl border border-dashed border-gray-300 hover:border-krishi-500 text-xs font-semibold text-gray-600 flex items-center justify-center gap-2 hover:bg-krishi-50 transition-colors"
                >
                  <Mic className="w-4 h-4 text-krishi-700" />
                  <span>Speak Problem</span>
                </button>
              </div>

              <div className="pt-3 border-t border-earth-100 flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setSelectedProblem(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmSubmit}
                  icon={<Send className="w-4 h-4" />}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Submit for Diagnosis
                </Button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
