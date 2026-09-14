import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { LanguageCode } from '../../types';

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => l.code === language) || languages[1];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-2 rounded-xl border border-earth-300/80 bg-white/95 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-earth-50 focus:outline-none focus:ring-2 focus:ring-krishi-500 transition-colors ${
          compact ? 'px-2 py-1.5 text-xs' : 'px-3.5 py-2'
        }`}
      >
        <Globe className="h-4 w-4 text-krishi-700" />
        <span className="font-semibold">{currentLang.nativeName}</span>
        {!compact && <span className="text-gray-400 text-xs">({currentLang.name})</span>}
        <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-white p-1.5 shadow-soft-lg ring-1 ring-black/5 focus:outline-none z-50 animate-in fade-in slide-in-from-top-1">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
            Select Language (भाषा)
          </div>
          <div className="py-1">
            {languages.map((item, index) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  onClick={() => handleSelect(item.code)}
                  className={`flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-krishi-50 text-krishi-900 font-semibold'
                      : 'text-gray-700 hover:bg-earth-100 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-gray-400 w-4 font-mono">{index + 1}.</span>
                    <div>
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.nativeName}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-krishi-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
