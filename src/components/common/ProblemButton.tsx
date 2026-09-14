import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ProblemButtonProps {
  className?: string;
  size?: 'md' | 'lg';
  fullWidth?: boolean;
}

export const ProblemButton: React.FC<ProblemButtonProps> = ({
  className = '',
  size = 'lg',
  fullWidth = false,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const isLg = size === 'lg';

  return (
    <button
      onClick={() => navigate('/problem')}
      type="button"
      className={`relative group inline-flex items-center justify-center font-bold rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-lg hover:shadow-red-300 hover:from-red-500 hover:to-red-600 active:scale-98 transition-all duration-200 border-2 border-red-400/40 select-none touch-card ${
        isLg ? 'px-6 py-3.5 text-lg min-h-[58px]' : 'px-4 py-2.5 text-base min-h-[46px]'
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      aria-label="I Have a Problem - Immediate Farm Help"
    >
      {/* Subtle pulsing indicator */}
      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white"></span>
      </span>

      <span className="flex items-center gap-2.5">
        <span className="text-xl">🆘</span>
        <span className="tracking-wide uppercase font-black drop-shadow-sm">
          {t('haveAProblem')}
        </span>
        <AlertCircle className="h-5 w-5 text-red-200 group-hover:rotate-12 transition-transform ml-1 hidden sm:inline-block" />
      </span>
    </button>
  );
};
