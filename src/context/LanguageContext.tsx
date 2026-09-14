import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode } from '../types';
import { en, TranslationKey } from '../i18n/en';
import { hi } from '../i18n/hi';
import { SUPPORTED_LANGUAGES, LanguageOption } from '../i18n/languages';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey) => string;
  languages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'krishvya_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved as LanguageCode;
    }
    return 'english';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  useEffect(() => {
    document.documentElement.lang = language === 'hindi' ? 'hi' : 'en';
  }, [language]);

  const t = (key: TranslationKey): string => {
    if (language === 'hindi') {
      const translation = hi[key];
      if (translation) return translation;
    }
    // For other regional languages in Phase 1, fallback gracefully to English
    return en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
