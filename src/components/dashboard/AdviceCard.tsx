import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Sparkles, HelpCircle, AlertTriangle, Droplets } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ASSETS } from '../../data/mockData';

interface AdviceCardProps {
  advice: string;
}

export const AdviceCard: React.FC<AdviceCardProps> = ({ advice }) => {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card className="border-krishi-300 bg-gradient-to-r from-krishi-50/70 via-white to-earth-50/50 p-5 md:p-6 shadow-soft">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-krishi-600 text-white">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-krishi-900">
                {t('todaysAdvice')}
              </span>
              <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                Actionable
              </span>
            </div>

            <p className="text-lg md:text-xl font-bold text-gray-900 leading-snug">
              "{advice}"
            </p>

            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(true)}
                icon={<HelpCircle className="w-4 h-4" />}
                className="bg-white hover:bg-krishi-50 text-krishi-800 border-krishi-300 font-semibold"
              >
                {t('whyThisRecommendation')}
              </Button>
            </div>
          </div>

          <div className="w-full md:w-56 h-36 rounded-2xl overflow-hidden shadow-md flex-shrink-0 relative border border-white">
            <img
              src={ASSETS.cropLeaf}
              alt="Healthy crop in field"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
              <span className="text-[11px] font-bold text-white flex items-center gap-1">
                🌱 Real-time field analysis
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal explaining recommendation */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Reason Behind Today's Advice"
      >
        <div className="space-y-4 text-sm text-gray-700">
          <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex items-start gap-3">
            <Droplets className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sky-900">Rain Forecast Detected</p>
              <p className="text-xs text-sky-700 mt-0.5">
                Local weather radar predicts 60% probability of rain over your village within the next 24 hours.
              </p>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Waterlogging Prevention</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Your soil moisture is currently at 42% (optimal). Irrigating now ahead of rainfall could cause root aeration issues and waste electricity/diesel pump costs.
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
            Guidance calculated by combining Indian Meteorological Department (IMD) grid data with your crop flowering stage requirements.
          </div>
        </div>
      </Modal>
    </>
  );
};
