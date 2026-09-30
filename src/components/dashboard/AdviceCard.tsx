import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Sparkles, HelpCircle, ArrowRight, CloudRain, Droplets, Sprout, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PrimaryTodayAction } from '../../services/farmIntelligence';

interface AdviceCardProps {
  primaryAction: PrimaryTodayAction;
}

export const AdviceCard: React.FC<AdviceCardProps> = ({ primaryAction }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const renderReasonIcon = (category: string) => {
    switch (category) {
      case 'weather':
        return <CloudRain className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />;
      case 'soil':
        return <Droplets className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
      case 'disease':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
      default:
        return <Sprout className="w-4 h-4 text-krishi-700 shrink-0 mt-0.5" />;
    }
  };

  return (
    <>
      <Card className="border-krishi-300 bg-gradient-to-r from-krishi-50/70 via-white to-earth-50/50 p-5 md:p-6 shadow-soft">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1 rounded-md bg-krishi-700 text-white">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-krishi-900">
                Today's Priority Action
              </span>
              <span className="bg-krishi-100 text-krishi-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-krishi-300">
                {primaryAction.badge}
              </span>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-black text-gray-900 leading-snug">
                {primaryAction.title}
              </h2>
              <p className="text-sm font-semibold text-krishi-800 mt-1">
                "{primaryAction.advice}"
              </p>
            </div>

            {/* Farmer-First Question Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-white/80 p-3 rounded-xl border border-earth-200">
                <span className="font-extrabold text-gray-500 uppercase text-[10px] block mb-0.5">
                  What does this mean for my farm?
                </span>
                <p className="text-gray-800 font-medium leading-relaxed">
                  {primaryAction.whatItMeans}
                </p>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-krishi-200">
                <span className="font-extrabold text-krishi-800 uppercase text-[10px] block mb-0.5">
                  What should I do?
                </span>
                <p className="text-gray-900 font-bold leading-relaxed">
                  {primaryAction.whatToDo}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(true)}
                icon={<HelpCircle className="w-4 h-4" />}
                className="bg-white hover:bg-krishi-50 text-krishi-800 border-krishi-300 font-semibold"
              >
                View Recommendation Details
              </Button>

              <Link
                to="/ai-advisor"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-krishi-800 bg-white hover:bg-krishi-50 border border-krishi-200 transition-colors"
              >
                Ask KRISHVYA <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal explaining recommendation from live telemetry */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Reason Behind Today's Action"
      >
        <div className="space-y-4 text-sm text-gray-700">
          <p className="text-xs text-gray-500">
            KRISHVYA combines your farm's standing crop, real-time satellite radar, soil telemetry, and pathogen scans to generate this guidance:
          </p>

          <div className="space-y-2.5">
            {primaryAction.reasonPoints.map((pt, idx) => (
              <div
                key={idx}
                className="p-3 bg-earth-50 rounded-xl border border-earth-200 flex items-start gap-3"
              >
                {renderReasonIcon(pt.category)}
                <div>
                  <p className="font-bold text-gray-900 text-xs">{pt.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{pt.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-gray-400 pt-2 border-t border-gray-100 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-krishi-700 shrink-0" />
            <span>Telemetry calibrated with IMD weather grids and agronomic ICAR guidelines.</span>
          </div>
        </div>
      </Modal>
    </>
  );
};
