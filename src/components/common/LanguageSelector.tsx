import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Check, ChevronDown } from 'lucide-react';
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
        className={`inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1F2937] hover:bg-[#EAF4EC] hover:text-[#166534] hover:border-[#D1E7D6] transition-colors cursor-pointer shadow-2xs ${
          compact ? 'px-2 py-1 text-[11px]' : ''
        }`}
      >
        <span className="text-xs leading-none">🌐</span>
        <span>{currentLang.nativeName}</span>
        <ChevronDown className={`h-3 w-3 text-[#6B7280] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 origin-top-right rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/5 border border-[#E5E7EB] focus:outline-none z-50 animate-in fade-in slide-in-from-top-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6B7280] border-b border-[#E5E7EB]">
            Select Language (भाषा)
          </div>
          <div className="py-1 max-h-60 overflow-y-auto">
            {languages.map((item, index) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  onClick={() => handleSelect(item.code)}
                  className={`flex w-full items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#EAF4EC] text-[#166534] font-bold'
                      : 'text-[#1F2937] hover:bg-[#EAF4EC]/70 hover:text-[#166534]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#6B7280] w-3 font-mono">{index + 1}.</span>
                    <div>
                      <div className="text-xs font-medium">{item.name}</div>
                      <div className="text-[10px] text-[#6B7280]">{item.nativeName}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-[#166534]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
