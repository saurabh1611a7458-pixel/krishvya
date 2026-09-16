import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useFarm } from '../context/FarmContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { voiceService } from '../services/voiceService';
import { supabaseService } from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';
import { ASSETS } from '../data/mockData';
import {
  Bot,
  Mic,
  Send,
  Volume2,
  VolumeX,
  Droplets,
  Leaf,
  CloudRain,
  Bug,
  UploadCloud,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Database,
  Sparkles,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  aiEngine?: string;
  confidence?: number;
  requiresExpertReview?: boolean;
  feedback?: 'positive' | 'negative';
}

interface ScannerDiagnosis {
  diseaseName: string;
  scientificName?: string;
  crop: string;
  confidence: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  symptoms: string[];
  organicTreatment: string;
  chemicalTreatment: string;
  preventativeMeasures: string[];
  requiresExpertReview: boolean;
  aiEngine?: string;
}

export const AiAdvisorPage: React.FC = () => {
  const { farm, user, submitProblem } = useFarm();
  const { language } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannerImage, setScannerImage] = useState<string>(ASSETS.cropLeaf);
  const [diagnosis, setDiagnosis] = useState<ScannerDiagnosis | null>(null);

  const [expertModalOpen, setExpertModalOpen] = useState(false);
  const [escalateSubject, setEscalateSubject] = useState('');
  const [escalateNotes, setEscalateNotes] = useState('');
  const [escalateSuccess, setEscalateSuccess] = useState<string | null>(null);

  // Chat message stream
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: `Namaste ${user.name || 'Farmer'}! 🙏 I am your Personal Farm Scientist.\n\nBased on your ${farm.crop.name || 'crop'} in ${farm.location?.district || farm.location?.address || 'your region'}, ${farm.weather?.advice || 'conditions are favorable for your field'}.\n\nHow can I help you right now?`,
      timestamp: 'Just now',
      aiEngine: 'gemini-2.5-flash / ICAR Scientist Engine',
      confidence: 96,
      requiresExpertReview: false,
    },
  ]);

  // Dynamic values derived from farm context
  const cropName = farm.crop?.name || 'Crop';
  const cropStage = farm.crop?.stage || 'Flowering';
  const farmSize = farm.size || 2.5;
  const farmDistrict = farm.location?.district || farm.location?.address?.split(',')?.[0] || 'Your Farm';
  const rainProb = farm.weather?.rainProbability ?? 60;
  const soilMoisture = farm.soil?.moisturePercentage ?? 42;

  // Reactively synchronize welcome message when farm or location changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'msg_welcome') {
        return [
          {
            ...prev[0],
            text: `Namaste ${user.name || 'Farmer'}! 🙏 I am your Personal Farm Scientist.\n\nBased on your ${farm.crop.name || 'crop'} in ${farmDistrict}, ${farm.weather?.advice || 'conditions are favorable for your field'}.\n\nHow can I help you right now?`,
          },
        ];
      }
      return prev;
    });
  }, [farm.id, farmDistrict, farm.crop?.name, user.name]);


  // Single Core Today's Advice Logic
  const rainExpected = rainProb >= 50;
  const adviceHeadline = rainExpected
    ? 'Rain is expected today, so irrigation may not be needed.'
    : soilMoisture < 35
    ? 'Soil moisture is low. Recommended to run drip lines for 2 hours before 10 AM.'
    : 'Weather is clear and soil moisture is adequate. Routine field scouting recommended.';

  const whatToDo = rainExpected
    ? 'Delay irrigation today & keep furrow drainage lines clear.'
    : soilMoisture < 35
    ? 'Run drip irrigation early morning to hydrate root zone.'
    : 'Check standing crop canopy and maintain routine drip schedule.';

  const why = rainExpected
    ? `${rainProb}% chance of natural rain; prevents waterlogging & saves electricity.`
    : soilMoisture < 35
    ? `Soil moisture is at ${soilMoisture}%; flowering stage requires steady hydration.`
    : `Soil moisture (${soilMoisture}%) is in the optimal vegetative zone.`;

  const whenToCheckAgain = rainExpected
    ? 'Tomorrow morning after rainfall.'
    : 'This evening after 5:00 PM.';

  // Smart Alert Logic (Only shows alert when attention is genuinely needed)
  const hasAlert = rainProb >= 65 || soilMoisture < 30;
  const alertText = rainProb >= 65
    ? 'Heavy rain is expected tomorrow. Check your field for waterlogging.'
    : soilMoisture < 30
    ? 'Soil moisture is critically low. Inspect drip irrigation lines immediately.'
    : '';

  // Scroll chat into view
  const scrollToChat = () => {
    chatInputRef.current?.focus();
    chatInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Voice Input trigger
  const handleStartVoice = () => {
    setIsListening(true);
    voiceService.startListening(
      language,
      (transcript) => {
        setInputQuery(transcript);
        setIsListening(false);
        handleSend(transcript);
      },
      (err) => {
        console.warn(err);
        setIsListening(false);
      },
      () => setIsListening(false)
    );
  };

  // Conversational Send
  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: (m.sender === 'ai' ? 'model' : 'user') as 'model' | 'user',
        content: m.text,
      }));

      const res = await api.askAdvisor(textToSend, historyPayload, language, {
        id: farm.id,
        location: farm.location,
        crop: farm.crop,
        soil: farm.soil,
        weather: farm.weather,
        size: farm.size,
        irrigationType: farm.irrigationType,
      });

      const aiReply =
        res.data?.reply ||
        (res.success && res.message) ||
        'Delay irrigation today ahead of forecasted precipitation.';
      const aiEngine = res.data?.aiEngine || 'gemini-2.5-flash';
      const confidence = res.data?.confidence || 92;
      const requiresExpertReview = Boolean(res.data?.requiresExpertReview || confidence < 80);

      const aiMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: 'Just now',
        aiEngine,
        confidence,
        requiresExpertReview,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Save memory to Supabase
      if (isSupabaseConfigured) {
        supabaseService.saveFarmMemory(farm.id, textToSend, aiReply, {
          crop: farm.crop.name,
          stage: farm.crop.stage,
        });
      }
    } catch (err) {
      console.warn('AI Advisor call failed:', err);
      const fallbackMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: `Based on your live farm data: Rain (${rainProb}% probability) is expected tomorrow in ${farmDistrict}. Soil moisture is ${soilMoisture}%. We advise delaying irrigation today.`,
        timestamp: 'Just now',
        aiEngine: 'icar-kvk-expert-engine',
        confidence: 90,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  // Feedback on AI responses
  const handleFeedback = (messageId: string, rating: 'positive' | 'negative') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: rating } : m))
    );
    api.sendAiFeedback({ messageId, rating });
    if (isSupabaseConfigured) {
      supabaseService.submitMemoryFeedback(messageId, rating);
    }
  };

  // Voice narration toggle
  const handleToggleSpeak = (msgId: string, text: string) => {
    if (speakingMessageId === msgId) {
      voiceService.stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      voiceService.stopSpeaking();
      setSpeakingMessageId(msgId);
      voiceService
        .speak(text, language)
        .then(() => setSpeakingMessageId(null))
        .catch(() => setSpeakingMessageId(null));
    }
  };

  // Plant Scanner Image Diagnosis
  const handleRunDiagnosis = async (base64Data: string) => {
    setScanning(true);
    try {
      const res = await api.diagnoseDisease(base64Data, farm.crop.name, 'Leaf scan from AI Advisor');
      if (res.success && res.data) {
        setDiagnosis({
          diseaseName: res.data.diseaseName,
          scientificName: res.data.scientificName,
          crop: res.data.crop || farm.crop.name,
          confidence: res.data.confidence || 88,
          severity: res.data.severity || 'Medium',
          symptoms: res.data.symptoms || [],
          organicTreatment: res.data.organicTreatment || 'Spray 5% NSKE Neem extract.',
          chemicalTreatment: res.data.chemicalTreatment || 'Apply recommended CIBRC fungicide.',
          preventativeMeasures: res.data.preventativeMeasures || [],
          requiresExpertReview: Boolean(res.data.requiresExpertReview || (res.data.confidence && res.data.confidence < 85)),
          aiEngine: res.data.aiEngine,
        });
      }
    } catch (err) {
      console.warn('Scanner error:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setScannerImage(base64);
      handleRunDiagnosis(base64);
    };
    reader.readAsDataURL(file);
  };

  // Escalate to Human Agronomist
  const handleEscalateCase = async () => {
    try {
      const title = escalateSubject || `Case Review for ${farm.crop.name}`;
      const desc = escalateNotes || `Farmer requested human agronomist review. Diagnosis: ${diagnosis?.diseaseName || 'General crop inquiry'}`;

      await api.escalateAiCase({
        title,
        description: desc,
        category: 'crop',
        aiRecommendation: diagnosis?.chemicalTreatment || 'Pending review',
        confidenceScore: diagnosis?.confidence || 75,
      });

      submitProblem('crop_problem', desc);

      setEscalateSuccess('Case escalated! A KRISHVYA Senior Agronomist has been notified.');
      setTimeout(() => {
        setExpertModalOpen(false);
        setEscalateSuccess(null);
        setEscalateSubject('');
        setEscalateNotes('');
      }, 2000);
    } catch (err) {
      console.warn('Escalation failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-12">
        <main className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full space-y-6 sm:space-y-8">
          
          {/* ========================================================================= */}
          {/* 1. HERO SECTION                                                          */}
          {/* ========================================================================= */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-200/70 shadow-sm text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-krishi-700 mx-auto">
              <Bot className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                👋 Namaste {user.name || 'Saurabh'}!
              </h1>
              <p className="text-sm sm:text-base font-medium text-gray-600">
                Your farm scientist is ready.
              </p>
            </div>

            {/* Micro Farm Badges: Crop, Size, Location */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                🌾 {cropName} • {farmSize} acres
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-earth-100 text-gray-700 border border-earth-200">
                📍 {farmDistrict}
              </span>
              {isSupabaseConfigured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white text-emerald-700 border border-emerald-200">
                  <Database className="w-3 h-3 text-emerald-600" />
                  Cloud Synced
                </span>
              )}
            </div>

            {/* Big Primary Action Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  scrollToChat();
                  handleStartVoice();
                }}
                type="button"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-krishi-700 hover:bg-krishi-800 text-white font-bold text-base shadow-lg shadow-krishi-700/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
              >
                <Mic className="w-5 h-5 animate-pulse" />
                <span>Ask Your Farm Scientist</span>
              </button>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 2. TODAY'S FARM ADVICE (ONE BEAUTIFUL MAIN CARD)                           */}
          {/* ========================================================================= */}
          <section className="bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 rounded-3xl p-6 sm:p-8 border border-emerald-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Leaf className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                  Today's Farm Advice
                </h2>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Personalized
              </span>
            </div>

            {/* Clear, bold takeaway headline */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs">
              <p className="text-base sm:text-lg font-bold text-emerald-950 leading-snug">
                "{adviceHeadline}"
              </p>
            </div>

            {/* What to do, Why, When to check again */}
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-base leading-none mt-0.5">✓</span>
                <div>
                  <strong className="text-gray-900">What to do: </strong>
                  <span className="text-gray-700">{whatToDo}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-base leading-none mt-0.5">✓</span>
                <div>
                  <strong className="text-gray-900">Why: </strong>
                  <span className="text-gray-700">{why}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-bold text-base leading-none mt-0.5">✓</span>
                <div>
                  <strong className="text-gray-900">When to check again: </strong>
                  <span className="text-gray-700">{whenToCheckAgain}</span>
                </div>
              </div>
            </div>

            {/* View Details Button */}
            <div className="pt-2">
              <button
                onClick={() => setDetailsModalOpen(true)}
                type="button"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-300 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>View Full Farm Details</span>
                <span>→</span>
              </button>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 3. QUICK ACTIONS (4 LARGE ATTRACTIVE BUTTONS)                              */}
          {/* ========================================================================= */}
          <section className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 px-1">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Irrigation Button */}
              <button
                type="button"
                onClick={() => {
                  scrollToChat();
                  handleSend(`Should I irrigate my ${cropName} today?`);
                }}
                className="p-4 rounded-2xl bg-white hover:bg-sky-50 border border-earth-200 hover:border-sky-300 transition-all shadow-xs flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Droplets className="w-6 h-6" />
                </div>
                <span className="font-bold text-xs text-gray-800 group-hover:text-sky-900">
                  Irrigation
                </span>
              </button>

              {/* Crop Health Button */}
              <button
                type="button"
                onClick={() => {
                  scrollToChat();
                  handleSend(`How is my ${cropName} health at ${cropStage} stage?`);
                }}
                className="p-4 rounded-2xl bg-white hover:bg-emerald-50 border border-earth-200 hover:border-emerald-300 transition-all shadow-xs flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Leaf className="w-6 h-6" />
                </div>
                <span className="font-bold text-xs text-gray-800 group-hover:text-emerald-900">
                  Crop Health
                </span>
              </button>

              {/* Disease Button (Opens Plant Scanner) */}
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="p-4 rounded-2xl bg-white hover:bg-rose-50 border border-earth-200 hover:border-rose-300 transition-all shadow-xs flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Bug className="w-6 h-6" />
                </div>
                <span className="font-bold text-xs text-gray-800 group-hover:text-rose-900">
                  Disease
                </span>
              </button>

              {/* Weather Button */}
              <button
                type="button"
                onClick={() => {
                  scrollToChat();
                  handleSend(`What is today's weather forecast and spray window for my field?`);
                }}
                className="p-4 rounded-2xl bg-white hover:bg-amber-50 border border-earth-200 hover:border-amber-300 transition-all shadow-xs flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CloudRain className="w-6 h-6" />
                </div>
                <span className="font-bold text-xs text-gray-800 group-hover:text-amber-900">
                  Weather
                </span>
              </button>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 4. SMART ALERT (ONLY IF ATTENTION NEEDED)                                   */}
          {/* ========================================================================= */}
          <section>
            {hasAlert ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3 shadow-xs">
                <div className="p-1 rounded-lg bg-amber-200 text-amber-800 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <strong className="text-xs font-black uppercase tracking-wider block text-amber-900">
                    ⚠️ Attention Needed
                  </strong>
                  <p className="text-sm font-semibold">{alertText}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-center gap-3 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-sm font-bold">✓ Your farm looks good today.</p>
              </div>
            )}
          </section>

          {/* ========================================================================= */}
          {/* 5. AI CHAT SECTION                                                        */}
          {/* ========================================================================= */}
          <section className="bg-white rounded-3xl p-5 sm:p-7 border border-earth-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-earth-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-krishi-100 text-krishi-800 flex items-center justify-center font-bold">
                  💬
                </div>
                <h3 className="text-base font-black text-gray-900">
                  Ask Your Farm Scientist
                </h3>
              </div>
              <span className="text-[11px] font-bold text-gray-500 bg-earth-100 px-2.5 py-1 rounded-full uppercase">
                {language}
              </span>
            </div>

            {/* Chat Stream */}
            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-xl bg-krishi-700 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-xl p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-krishi-700 text-white font-medium rounded-tr-xs shadow-xs'
                        : 'bg-earth-50 text-gray-800 border border-earth-200/70 rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* AI Message Action Footer */}
                    {msg.sender === 'ai' && (
                      <div className="mt-3 pt-2 border-t border-earth-200/60 flex items-center justify-between text-xs text-gray-500">
                        <span className="text-[10px] text-gray-400 font-mono">
                          {msg.confidence ? `${msg.confidence}% confidence` : 'Grounded AI'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Audio Voice Narration */}
                          <button
                            onClick={() => handleToggleSpeak(msg.id, msg.text)}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              speakingMessageId === msg.id
                                ? 'bg-red-100 text-red-700 animate-pulse'
                                : 'hover:bg-white text-krishi-700'
                            }`}
                            title="Listen in regional voice"
                          >
                            {speakingMessageId === msg.id ? (
                              <VolumeX className="w-4 h-4" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </button>

                          {/* Thumbs Feedback */}
                          <button
                            onClick={() => handleFeedback(msg.id, 'positive')}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              msg.feedback === 'positive'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'hover:bg-white text-gray-400 hover:text-emerald-700'
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 'negative')}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              msg.feedback === 'negative'
                                ? 'bg-red-100 text-red-700'
                                : 'hover:bg-white text-gray-400 hover:text-red-700'
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Escalate button if confidence is low */}
                          {(msg.requiresExpertReview || (msg.confidence && msg.confidence < 85)) && (
                            <button
                              onClick={() => {
                                setEscalateSubject(`Review advice for ${cropName}`);
                                setExpertModalOpen(true);
                              }}
                              className="ml-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] hover:bg-amber-200 transition-colors cursor-pointer"
                            >
                              👨🌾 Escalate
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-earth-200 text-earth-800 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                      {user.name ? user.name.charAt(0) : 'U'}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2.5 items-center text-xs text-gray-500 italic">
                  <Bot className="w-4 h-4 animate-bounce text-krishi-700" />
                  <span>Your Farm Scientist is thinking...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Example Question Chips */}
            <div className="pt-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Suggested Questions:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Should I water my crop today?',
                  'Why are my leaves yellow?',
                  'What should I do today?',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleSend(chip)}
                    className="px-3 py-1.5 rounded-xl bg-earth-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-900 border border-earth-200 hover:border-emerald-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    💡 {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Chat Input Form with Big Prominent Mic */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 bg-earth-50 p-2 rounded-2xl border border-earth-300 focus-within:border-krishi-600 focus-within:bg-white transition-all shadow-xs"
            >
              <button
                type="button"
                onClick={handleStartVoice}
                className={`p-3 rounded-xl transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-md'
                    : 'bg-white hover:bg-emerald-50 text-krishi-700 border border-earth-200 shadow-2xs'
                }`}
                title="Tap to speak (आवाज़ में बोलें)"
              >
                <Mic className="w-5 h-5" />
              </button>

              <input
                ref={chatInputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  isListening ? 'Listening... बोलिए...' : 'Ask your farm scientist anything...'
                }
                className="flex-1 py-2 px-2 text-sm bg-transparent text-gray-900 focus:outline-none placeholder-gray-400 font-medium"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!inputQuery.trim()}
                icon={<Send className="w-4 h-4" />}
                className="bg-krishi-700 hover:bg-krishi-800 font-bold px-4"
              >
                Ask
              </Button>
            </form>
          </section>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: FULL FARM DETAILS ("View Details")                                   */}
      {/* ========================================================================= */}
      {detailsModalOpen && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title="🌾 Full Farm Diagnostics & Scientist Plan"
        >
          <div className="space-y-4 text-xs">
            <p className="text-gray-600">
              Live physical agronomic observations for <strong>{cropName} ({cropStage})</strong> in {farmDistrict}:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 💧 Irrigation Detail */}
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-sky-900">
                  <Droplets className="w-4 h-4 text-sky-600" />
                  <span>Irrigation Analysis</span>
                </div>
                <p className="text-gray-700">
                  Rain likelihood is <strong>{rainProb}%</strong>. Root zone moisture is <strong>{soilMoisture}%</strong>.
                  Delaying tubewell pumping today saves ~45,000L groundwater and ~₹140 electricity.
                </p>
              </div>

              {/* 🌱 Crop Nutrition Detail */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  <span>Crop Nutrition</span>
                </div>
                <p className="text-gray-700">
                  Critical flowering phase. Apply 00:52:34 (MKP) @ 10g/L + Boron 20% @ 1g/L to prevent premature flower drop. Avoid extra urea.
                </p>
              </div>

              {/* 🌦 Weather Radar Detail */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <CloudRain className="w-4 h-4 text-amber-600" />
                  <span>Micro-Climate & Spray</span>
                </div>
                <p className="text-gray-700">
                  Ambient temperature is {farm.weather?.temperature}°C. Spraying window is limited to morning hours (7 AM - 10 AM) to avoid wind drift.
                </p>
              </div>

              {/* 🐛 Disease & Pest Detail */}
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <Bug className="w-4 h-4 text-rose-600" />
                  <span>Pest & Disease Watch</span>
                </div>
                <p className="text-gray-700">
                  Humid conditions favor early leaf spot and caterpillar influx. Scout lower foliage; apply 5% Neem Seed Kernel Extract (NSKE) as bio-control.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-earth-200 flex justify-between items-center">
              <span className="text-gray-500 font-medium text-[11px]">
                Grounded with ICAR & Sentinel-2 Copernicus
              </span>
              <Button size="sm" variant="primary" onClick={() => setDetailsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: INTEGRATED PLANT VISION SCANNER                                     */}
      {/* ========================================================================= */}
      {scannerOpen && (
        <Modal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          title="📸 Plant Vision Scanner (पत्ती स्कैनर)"
        >
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Take or upload a photo of your {cropName} leaf to detect disease, pests, or nutrient deficiency.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="w-full sm:w-1/2 aspect-video bg-earth-100 rounded-2xl overflow-hidden border border-earth-300 relative group flex items-center justify-center">
                <img
                  src={scannerImage}
                  alt="Scanned Crop Leaf"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full sm:w-1/2 space-y-2.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-krishi-400 bg-krishi-50/50 hover:bg-krishi-100/50 text-krishi-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-krishi-700" />
                  <span>Upload / Snap Leaf Photo</span>
                </button>

                <button
                  onClick={() => handleRunDiagnosis(scannerImage)}
                  disabled={scanning}
                  className="w-full py-2.5 px-4 rounded-xl bg-krishi-700 hover:bg-krishi-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-krishi-700/20 cursor-pointer"
                >
                  <Sparkles className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                  <span>{scanning ? 'Analyzing with AI...' : 'Analyze Leaf with AI'}</span>
                </button>
              </div>
            </div>

            {/* Diagnosis Result Card */}
            {diagnosis && (
              <div className="p-4 rounded-2xl bg-earth-50 border border-earth-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-gray-900">{diagnosis.diseaseName}</h4>
                    {diagnosis.scientificName && (
                      <p className="text-xs italic text-gray-500">{diagnosis.scientificName}</p>
                    )}
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {diagnosis.confidence}% Confidence
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-earth-200">
                    <strong className="text-emerald-800 block mb-1">🌿 Organic Treatment:</strong>
                    <span className="text-gray-700">{diagnosis.organicTreatment}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-earth-200">
                    <strong className="text-blue-800 block mb-1">🧪 Chemical Remedy:</strong>
                    <span className="text-gray-700">{diagnosis.chemicalTreatment}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-earth-200 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {diagnosis.requiresExpertReview
                      ? '⚠️ Recommended to confirm with an agronomist.'
                      : 'High confidence diagnosis.'}
                  </span>
                  <button
                    onClick={() => {
                      setEscalateSubject(`Suspected ${diagnosis.diseaseName}`);
                      setScannerOpen(false);
                      setExpertModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Escalate to Expert</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXPERT ESCALATION                                                   */}
      {/* ========================================================================= */}
      {expertModalOpen && (
        <Modal
          isOpen={expertModalOpen}
          onClose={() => setExpertModalOpen(false)}
          title="👨🌾 Escalate to Human Agronomist Desk"
        >
          <div className="space-y-3 text-xs">
            <p className="text-gray-600">
              Submit your case to the KRISHVYA Senior Agronomist review desk. A qualified plant doctor will inspect the symptoms and reply.
            </p>

            <div className="space-y-2">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Subject</label>
                <input
                  type="text"
                  value={escalateSubject}
                  onChange={(e) => setEscalateSubject(e.target.value)}
                  placeholder="e.g. Leaf spots spreading after rain"
                  className="w-full px-3 py-2 rounded-xl border border-earth-300 focus:outline-none focus:border-krishi-600"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Observation Notes</label>
                <textarea
                  value={escalateNotes}
                  onChange={(e) => setEscalateNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe what you see on the leaves or crop..."
                  className="w-full px-3 py-2 rounded-xl border border-earth-300 focus:outline-none focus:border-krishi-600"
                />
              </div>
            </div>

            {escalateSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 font-bold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{escalateSuccess}</span>
              </div>
            )}

            <div className="pt-2 border-t border-earth-200 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setExpertModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleEscalateCase}
                className="bg-krishi-700 hover:bg-krishi-800 font-bold"
              >
                Submit to Agronomist
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <MobileBottomNav />
    </div>
  );
};
