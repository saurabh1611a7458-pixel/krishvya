import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Camera, ScanLine, Sprout, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const QuickActions: React.FC = () => {
  const { t } = useLanguage();

  const actions = [
    {
      title: t('askAi'),
      subtitle: 'Ask about irrigation, yield, seeds',
      icon: Bot,
      color: 'bg-emerald-500 text-white',
      border: 'hover:border-emerald-400',
      path: '/ai-advisor',
    },
    {
      title: t('checkCrop'),
      subtitle: 'Disease detection from leaf photo',
      icon: Camera,
      color: 'bg-amber-500 text-white',
      border: 'hover:border-amber-400',
      path: '/disease',
    },
    {
      title: t('scanPlant'),
      subtitle: 'Identify weeds & unknown plants',
      icon: ScanLine,
      color: 'bg-teal-500 text-white',
      border: 'hover:border-teal-400',
      path: '/plant-scanner',
    },
    {
      title: t('improveSoil'),
      subtitle: 'Organic carbon & nutrient tips',
      icon: Sprout,
      color: 'bg-krishi-700 text-white',
      border: 'hover:border-krishi-500',
      path: '/soil',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">{t('quickActions')}</h3>
        <span className="text-xs text-gray-400">One-tap tools</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.title}
              to={act.path}
              className={`bg-white p-4 rounded-2xl border border-earth-200/90 shadow-soft hover:shadow-soft-lg transition-all group flex flex-col justify-between ${act.border} touch-card`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${act.color} shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base group-hover:text-krishi-700 transition-colors">
                  {act.title}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{act.subtitle}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
