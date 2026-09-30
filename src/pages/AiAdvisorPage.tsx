import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { useFarm } from '../context/FarmContext';
import { useFarmIntelligence } from '../context/FarmIntelligenceContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { voiceService } from '../services/voiceService';
import { supabaseService } from '../services/supabaseService';
import { Farm } from '../types';
import { FormattedMarkdown } from '../components/common/FormattedMarkdown';
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Plus,
  Sprout,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

// Generate 4-5 dynamic suggested questions based on real farm context
const generateDynamicQuestions = (farm: Farm, hasFarm: boolean, language: string): string[] => {
  const crop = hasFarm && farm.crop?.name ? farm.crop.name : null;
  const isHindi = language === 'hindi';

  if (isHindi) {
    return [
      crop ? `क्या आज मेरे ${crop} में सिंचाई करनी चाहिए?` : 'क्या आज खेत में सिंचाई करनी चाहिए?',
      crop ? `क्या बारिश से मेरे ${crop} पर असर पड़ेगा?` : 'क्या बारिश से मेरी फसल पर असर पड़ेगा?',
      crop ? `मेरी ${crop} फसल की सेहत कैसी है?` : 'मेरी फसल की सेहत कैसी है?',
      crop ? `मेरे ${crop} की पत्तियां पीली क्यों हो रही हैं?` : 'पत्तियां पीली क्यों हो रही हैं?',
      'मेरी मिट्टी की सेहत सुधारने के लिए क्या करना चाहिए?',
    ];
  }

  return [
    crop ? `Should I irrigate my ${crop} today?` : 'Should I irrigate today?',
    crop ? `Will rain affect my ${crop}?` : 'Will rain affect my crop?',
    crop ? `How is my ${crop} health right now?` : 'How is my crop?',
    crop ? `Why are my ${crop} leaves turning yellow?` : 'Why are my leaves yellow?',
    'What should I do for my soil?',
  ];
};

export const AiAdvisorPage: React.FC = () => {
  const { farm, farms, user } = useFarm();
  const { intelligence } = useFarmIntelligence();
  const { user: clerkUser } = useUser();
  const { language } = useLanguage();

  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Derive real user and farm identity without hardcoded fallbacks
  const realUserName =
    user.name ||
    clerkUser?.fullName ||
    clerkUser?.firstName ||
    'Farmer';

  const activeUserId = clerkUser?.id || user.id || '';

  const hasFarm = Boolean(
    farms && farms.length > 0 && farm && farm.name
  );

  // Chat State
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isResumedChat, setIsResumedChat] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Dynamic suggestions
  const suggestedQuestions = useMemo(() => {
    return generateDynamicQuestions(farm, hasFarm, language);
  }, [farm, hasFarm, language]);

  // Load Previous Conversation & Chat History from Supabase
  useEffect(() => {
    let isMounted = true;

    const initConversation = async () => {
      setLoadingHistory(true);
      try {
        const farmId = hasFarm ? farm.id : undefined;
        const existingConv = await supabaseService.getLatestConversation(activeUserId, farmId);

        if (existingConv && isMounted) {
          setConversationId(existingConv.id);
          const loadedMsgs = await supabaseService.getConversationMessages(existingConv.id);
          if (isMounted) {
            if (loadedMsgs && loadedMsgs.length > 0) {
              const formatted: ChatMessage[] = loadedMsgs.map((m: any) => ({
                id: m.id,
                role: m.role === 'model' ? 'model' : 'user',
                text: m.message,
                timestamp: new Date(m.created_at || Date.now()).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              }));
              setMessages(formatted);
              setIsResumedChat(true);
            } else {
              setMessages([]);
              setIsResumedChat(false);
            }
          }
        } else if (isMounted) {
          // Create initial conversation thread
          const newConv = await supabaseService.createConversation(
            activeUserId,
            farmId,
            `Advisory for ${farm.crop?.name || 'Farm'}`
          );
          if (isMounted) {
            setConversationId(newConv.id);
            setMessages([]);
            setIsResumedChat(false);
          }
        }
      } catch (err) {
        console.warn('[AI Advisor] Failed to load chat history:', err);
      } finally {
        if (isMounted) {
          setLoadingHistory(false);
        }
      }
    };

    initConversation();

    return () => {
      isMounted = false;
    };
  }, [activeUserId, farm.id, hasFarm]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle "+ New Chat"
  const handleStartNewChat = async () => {
    if (isTyping) return;
    try {
      const farmId = hasFarm ? farm.id : undefined;
      const newConv = await supabaseService.createConversation(
        activeUserId,
        farmId,
        `New Advisory ${new Date().toLocaleDateString()}`
      );
      setConversationId(newConv.id);
      setMessages([]);
      setIsResumedChat(false);
      setInputQuery('');
      inputRef.current?.focus();
    } catch (err) {
      console.warn('[AI Advisor] Error creating new chat:', err);
    }
  };

  // Handle Sending a Message
  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isTyping) return;

    let currentConvId = conversationId;
    if (!currentConvId) {
      const created = await supabaseService.createConversation(
        activeUserId,
        hasFarm ? farm.id : undefined
      );
      currentConvId = created.id;
      setConversationId(created.id);
    }

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsTyping(true);

    // 1. Save user message to Supabase
    supabaseService.saveChatMessage(currentConvId, 'user', textToSend, activeUserId).catch((e) =>
      console.warn('[AI Advisor] Save user message error:', e)
    );

    // 2. Log farm event in Supabase if farm exists
    if (hasFarm && farm.id) {
      supabaseService.logFarmEvent(activeUserId, farm.id, 'advisor_chat', textToSend.slice(0, 100));
    }

    // 3. Assemble Farm Context strictly from real data if available
    const farmContext = hasFarm
      ? {
          farmerName: realUserName,
          name: farm.name,
          location: farm.location,
          crop: farm.crop,
          size: farm.size,
          sizeUnit: farm.sizeUnit,
          soil: farm.soil,
          irrigationType: farm.irrigationType,
          weather: farm.weather,
          todayPrimaryAction: `${intelligence.primaryAction.title}: ${intelligence.primaryAction.advice}`,
          todayActionReason: intelligence.primaryAction.whatItMeans,
          aiPromptContext: intelligence.aiPromptContext,
        }
      : null;

    // 4. Memory: Take only recent messages for contextual grounding
    const historyPayload = messages.slice(-4).map((m) => ({
      role: m.role,
      content: m.text,
    }));

    try {
      const res = await api.askAdvisor(textToSend, historyPayload, language, farmContext);

      let replyText = '';
      if (res && res.success && res.data?.reply) {
        replyText = res.data.reply;
      } else {
        // Output actual error to development console
        console.error('⚠️ [AI Advisor Pipeline Error]', res);

        const errorType = (res as any)?.errorType;
        if (errorType === 'API_KEY_MISSING' || (res as any)?.message?.includes('not configured')) {
          replyText = 'AI service is not configured.';
        } else if (errorType === 'FARM_DATA_ERROR' || (res as any)?.message?.includes('Farm data could not be loaded')) {
          replyText = 'Farm data could not be loaded.';
        } else if (errorType === 'NO_FARM' || (res as any)?.message?.includes('Please add your farm first')) {
          replyText = 'Please add your farm first.';
        } else {
          replyText = (res as any)?.message || (res as any)?.error || 'AI service error occurred.';
        }
      }

      const aiMessage: ChatMessage = {
        id: `msg_${Date.now()}_model`,
        role: 'model',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Save AI reply to Supabase
      supabaseService.saveChatMessage(currentConvId, 'model', replyText, activeUserId).catch((e) =>
        console.warn('[AI Advisor] Save AI message error:', e)
      );
    } catch (err: any) {
      console.error('⚠️ [AI Advisor Network/Client Error Stack]', err);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'model',
        text: err?.message ? `Connection error: ${err.message}` : 'Failed to reach AI service.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Voice Recognition Handling
  const handleToggleVoice = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    voiceService.startListening(
      language,
      (transcript) => {
        setIsListening(false);
        if (transcript && transcript.trim()) {
          handleSend(transcript);
        }
      },
      (err) => {
        console.warn('[Voice] Speech error:', err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F8F4] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden pb-16 lg:pb-0">
        {/* ========================================================================= */}
        {/* TOP APP BAR: Simplified Header with Separate Farm Context & New Chat      */}
        {/* ========================================================================= */}
        <header className="bg-white border-b border-[#E5E7EB] px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#166534] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-[#1F2937] tracking-tight leading-tight">
                Ask KRISHVYA
              </h1>
              <p className="text-xs text-[#6B7280] font-medium">
                Your farm assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Separate Farm Context Pill */}
            {hasFarm && (
              <div className="hidden sm:flex flex-col items-end bg-[#EAF4EC]/80 border border-[#D1E7D6] px-3.5 py-1.5 rounded-xl">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#166534]">
                  <Sprout className="w-3.5 h-3.5 text-[#166534]" />
                  <span className="truncate max-w-[200px]">{farm.name}</span>
                </div>
                <div className="text-[11px] text-[#6B7280] font-medium">
                  {[
                    farm.size ? `${farm.size} ${farm.sizeUnit || 'acres'}` : null,
                    farm.crop?.name,
                    farm.crop?.stage || null,
                  ].filter(Boolean).join(' • ') || 'Active Farm'}
                </div>
              </div>
            )}

            {/* New Chat Button */}
            <button
              onClick={handleStartNewChat}
              type="button"
              disabled={isTyping}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#EAF4EC] text-[#1F2937] hover:text-[#166534] font-semibold text-xs border border-[#E5E7EB] hover:border-[#D1E7D6] shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Start a new conversation"
            >
              <Plus className="w-4 h-4 text-[#166534]" />
              <span className="hidden xs:inline">New Chat</span>
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* CHAT SCROLL AREA                                                          */}
        {/* ========================================================================= */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto w-full space-y-6">
          {/* Mobile Farm Context Banner */}
          {hasFarm && (
            <div className="sm:hidden flex items-center justify-between bg-[#EAF4EC]/90 border border-[#D1E7D6] px-3.5 py-2 rounded-xl text-xs">
              <div className="inline-flex items-center gap-1.5 font-bold text-[#166534] truncate">
                <Sprout className="w-3.5 h-3.5 text-[#166534] shrink-0" />
                <span className="truncate">{farm.name}</span>
              </div>
              <div className="text-[11px] text-[#6B7280] shrink-0 font-medium">
                {[
                  farm.size ? `${farm.size} ${farm.sizeUnit || 'acres'}` : null,
                  farm.crop?.name,
                  farm.crop?.stage || null,
                ].filter(Boolean).join(' • ')}
              </div>
            </div>
          )}

          {/* Previous Conversation Resumed Indicator */}
          {isResumedChat && messages.length > 0 && (
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-white text-[#6B7280] border border-[#E5E7EB] shadow-2xs">
                <Clock className="w-3 h-3 text-[#6B7280]" />
                <span>Continue your farm conversation</span>
              </span>
            </div>
          )}

          {/* HOME VIEW: Shown when no messages yet or conversation is new */}
          {messages.length === 0 && !loadingHistory && (
            <div className="py-8 sm:py-12 space-y-6 text-center animate-in fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#EAF4EC] border border-[#D1E7D6] text-[#166534] shadow-xs">
                <Bot className="w-8 h-8" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight">
                  👋 Hi, {realUserName}
                </h2>
                <p className="text-sm sm:text-base text-[#6B7280] font-medium">
                  How can I help with your farm?
                </p>
              </div>

              {/* Farm summary pill if available */}
              {hasFarm && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white text-[#1F2937] border border-[#E5E7EB] shadow-xs">
                  <Sprout className="w-3.5 h-3.5 text-[#166534] shrink-0" />
                  <span className="font-bold text-[#166534]">{farm.name}</span>
                  <span className="text-[#E5E7EB]">•</span>
                  <span className="text-[#6B7280]">
                    {[
                      farm.size ? `${farm.size} ${farm.sizeUnit || 'acres'}` : null,
                      farm.crop?.name,
                      farm.crop?.stage || null,
                    ].filter(Boolean).join(' • ')}
                  </span>
                </div>
              )}

              {/* 5 Dynamic Suggested Questions */}
              <div className="pt-2 space-y-2.5 max-w-lg mx-auto text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280] px-1 text-center">
                  Suggested Questions
                </p>
                <div className="space-y-2">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(q)}
                      disabled={isTyping}
                      className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-[#EAF4EC] border border-[#E5E7EB] hover:border-[#D1E7D6] text-[#1F2937] font-medium text-xs sm:text-sm transition-all shadow-xs flex items-center justify-between group cursor-pointer"
                    >
                      <span className="pr-2 leading-snug">{q}</span>
                      <Sparkles className="w-4 h-4 text-[#6B7280] group-hover:text-[#166534] shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHAT MESSAGES STREAM */}
          <div className="space-y-5">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 items-start ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* AI Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-[#166534] text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#166534] text-white rounded-tr-xs shadow-xs'
                        : 'bg-[#EAF4EC] text-[#1F2937] border border-[#D1E7D6] rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    ) : (
                      <FormattedMarkdown content={msg.text} />
                    )}
                    <div
                      className={`text-[10px] mt-2 flex items-center gap-1 font-medium ${
                        isUser ? 'text-emerald-100/80 justify-end' : 'text-[#6B7280] justify-start'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-[#EAF4EC] text-[#166534] border border-[#D1E7D6] flex items-center justify-center shrink-0 mt-1 font-bold text-xs shadow-2xs">
                      {realUserName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI Thinking Indicator */}
            {isTyping && (
              <div className="flex gap-3 items-start justify-start animate-in fade-in">
                <div className="w-8 h-8 rounded-xl bg-[#166534] text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-[#EAF4EC] text-[#166534] border border-[#D1E7D6] rounded-2xl rounded-tl-xs px-4 py-3 text-xs sm:text-sm font-semibold shadow-xs flex items-center gap-2">
                  <Sprout className="w-4 h-4 animate-spin text-[#166534]" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>
        </main>

        {/* ========================================================================= */}
        {/* BOTTOM INPUT BAR: Accessible Mic & High-Contrast Send Button              */}
        {/* ========================================================================= */}
        <div className="bg-white border-t border-[#E5E7EB] px-4 sm:px-6 lg:px-8 py-3.5 sticky bottom-0 z-10 shrink-0">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 bg-[#F8F8F4] p-1.5 sm:p-2 rounded-2xl border border-[#E5E7EB] focus-within:border-[#166534] focus-within:bg-white transition-all shadow-xs"
            >
              {/* Mic Voice Button (min 44px for farmer accessibility) */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-[#DC2626] text-white animate-pulse shadow-md ring-4 ring-red-100'
                    : 'bg-[#EAF4EC] hover:bg-[#d8edd9] text-[#166534] border border-[#D1E7D6] shadow-2xs'
                }`}
                title={isListening ? 'Stop listening' : 'Tap to speak (Voice input)'}
                aria-label={isListening ? 'Stop listening' : 'Tap to speak'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Text Input */}
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                disabled={isTyping}
                placeholder={
                  isListening
                    ? 'Listening... Speak now...'
                    : 'Ask anything about your crops, soil, weather, irrigation...'
                }
                className="flex-1 py-2 px-3 text-xs sm:text-sm bg-transparent text-[#1F2937] focus:outline-none placeholder-[#6B7280] font-medium min-w-0"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputQuery.trim() || isTyping}
                className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-xl bg-[#166534] hover:bg-[#14532D] text-white font-bold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                title="Send question"
              >
                <span>Send</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};
export default AiAdvisorPage;
