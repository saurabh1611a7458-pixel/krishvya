import { LanguageCode } from '../types';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

// Strictly Alphabetical as required
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'bhojpuri', name: 'Bhojpuri', nativeName: 'भोजपुरी' },
  { code: 'english', name: 'English', nativeName: 'English' },
  { code: 'hindi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'kannada', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'marathi', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'tamil', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'telugu', name: 'Telugu', nativeName: 'తెలుగు' },
];
