// Voice Service using Web Speech API (SpeechRecognition & SpeechSynthesis)
// Specially tailored for Indian languages

import { LanguageCode } from '../types';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

const LANG_BCP47_MAP: Record<LanguageCode, string> = {
  hindi: 'hi-IN',
  bhojpuri: 'hi-IN', // standard fallback for Bhojpuri TTS/STT in browsers
  marathi: 'mr-IN',
  tamil: 'ta-IN',
  telugu: 'te-IN',
  kannada: 'kn-IN',
  english: 'en-IN',
};

class VoiceService {
  private synth: SpeechSynthesis | null = null;
  private recognition: SpeechRecognitionInstance | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
      }
      const SpeechRecognitionConstructor =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionConstructor) {
        this.recognition = new SpeechRecognitionConstructor();
      }
    }
  }

  isSpeechRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  isSpeechSynthesisSupported(): boolean {
    return this.synth !== null;
  }

  /**
   * Speak text out loud in the selected language
   */
  speak(text: string, lang: LanguageCode = 'english'): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      this.synth.cancel(); // Stop any active speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG_BCP47_MAP[lang] || 'en-IN';
      utterance.rate = 0.95; // Slightly slower for clarity in rural listening
      utterance.pitch = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      this.synth.speak(utterance);
    });
  }

  stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Listen for user speech and return transcript
   */
  startListening(
    lang: LanguageCode = 'english',
    onResult: (transcript: string) => void,
    onError?: (err: string) => void,
    onEnd?: () => void
  ): { stop: () => void } {
    if (!this.recognition) {
      if (onError) onError('Speech recognition not supported on this browser.');
      return { stop: () => {} };
    }

    try {
      this.recognition.lang = LANG_BCP47_MAP[lang] || 'en-IN';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };

      this.recognition.onerror = (event: { error: string }) => {
        if (onError) onError(event.error);
      };

      this.recognition.onend = () => {
        if (onEnd) onEnd();
      };

      this.recognition.start();
    } catch {
      if (onError) onError('Failed to initialize microphone listener.');
    }

    return {
      stop: () => {
        try {
          this.recognition?.stop();
        } catch {
          // ignore
        }
      },
    };
  }
}

export const voiceService = new VoiceService();
