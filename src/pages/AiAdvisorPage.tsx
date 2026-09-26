import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { useFarm } from '../context/FarmContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { voiceService } from '../services/voiceService';
import { supabaseService } from '../services/supabaseService';
import { Farm } from '../types';
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Plus,
  Sprout,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

// Generate 3 dynamic suggested questions based on real farm context
const generateDynamicQuestions = (farm: Farm, hasFarm: boolean, language: string): string[] => {
  const crop = hasFarm ? farm.crop?.name : null;
  const stage = hasFarm ? farm.crop?.stage : null;
  const rain = hasFarm ? farm.weather?.rainProbability : null;
  const isRainExpected = typeof rain === 'number' && rain >= 50;

  if (crop) {
    if (isRainExpected) {
      if (language === 'hindi') {
        return [
          `क्या आज बारिश के बाद ${crop} में सिंचाई करनी चाहिए?`,
          `बारिश के मौसम में ${crop} को फंगस और रोग से कैसे बचाएं?`,
          `क्या आज ${crop} पर खाद या स्प्रे करना ठीक रहेगा?`,
        ];
      }
      if (language === 'marathi') {
        return [
          `पावसामुळे आज ${crop} पिकाला पाणी द्यावे का?`,
          `पावसाच्या दिवसांत ${crop} पिकाला बुरशीपासून कसे वाचवावे?`,
          `आज ${crop} पिकावर खत किंवा फवारणी करावी का?`,
        ];
      }
      return [
        `Should I water my ${crop} today after the rain?`,
        `How to protect ${crop} from fungal diseases in wet weather?`,
        `Should I apply fertilizer or spray on ${crop} today?`,
      ];
    }

    if (stage) {
      if (language === 'hindi') {
        return [
          `क्या आज मेरे ${crop} में सिंचाई करनी चाहिए?`,
          `${stage} अवस्था में ${crop} के लिए कौन सा पोषण सर्वोत्तम है?`,
          `आज मेरे ${crop} खेत में क्या मुख्य कार्य करना चाहिए?`,
        ];
      }
      if (language === 'marathi') {
        return [
          `आज माझ्या ${crop} पिकाला पाणी देणे गरजेचे आहे का?`,
          `${stage} अवस्थेत ${crop} साठी कोणते खत योग्य राहील?`,
          `आज माझ्या ${crop} शेतात कोणते काम करावे?`,
        ];
      }
      return [
        `Should I irrigate my ${crop} today?`,
        `What fertilizer is best for ${crop} at ${stage} stage?`,
        `What should I do in my ${crop} field today?`,
      ];
    }

    return [
      `Should I irrigate my ${crop} today?`,
      `How is my ${crop} health based on current conditions?`,
      `What should I do in my ${crop} field today?`,
    ];
  }

  // Fallback if user has not registered a crop yet
  if (language === 'hindi') {
    return [
      'आज मेरे खेत में क्या मुख्य कार्य करना चाहिए?',
      'मेरी मिट्टी और मौसम के लिए कौन सी फसल उत्तम रहेगी?',
      'मौसम को देखते हुए क्या सिंचाई की आवश्यकता है?',
    ];
  }
  if (language === 'marathi') {
    return [
      'आज शेतात कोणते काम करणे फायदेशीर ठरेल?',
      'माझ्या जमिनीसाठी कोणते पीक सर्वात योग्य आहे?',
      'हवामानानुसार आज पिकाला पाणी द्यावे का?',
    ];
  }
  return [
    'What should I do in my field today?',
    'What crop is best suited for my soil and region?',
    'Should I irrigate today based on the weather forecast?',
  ];
};

export const AiAdvisorPage: React.FC = () => {
  const { farm, farms, user, activeUserKey } = useFarm();
  const { user: clerkUser } = useUser();
  const { language } = useLanguage();

  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Derive real user and farm identity without hardcoded fallbacks
  const realUserName =
    (user.name && user.name !== 'Ramesh Shwet' && user.name !== 'Ramesh Singh' ? user.name : null) ||
    clerkUser?.fullName ||
    clerkUser?.firstName ||
    'Farmer';

  const activeUserId =
    activeUserKey === 'clerk' && clerkUser?.id ? clerkUser.id : (user.id || 'usr_farmer');

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
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden pb-16 lg:pb-0">
        {/* ========================================================================= */}
        {/* TOP APP BAR: Minimal & Clean Header with Farm Badge and New Chat Button   */}
        {/* ========================================================================= */}
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight truncate">
                AI Farm Advisor
              </h1>
              <p className="text-xs text-gray-500 truncate">
                {hasFarm ? (
                  <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
                    <Sprout className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{farm.name}</span>
                    {farm.crop?.name && <span>• {farm.crop.name}</span>}
                  </span>
                ) : (
                  <span>General Agricultural Scientist</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* New Chat Button */}
            <button
              onClick={handleStartNewChat}
              type="button"
              disabled={isTyping}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-earth-100 text-gray-700 font-bold text-xs border border-earth-300 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title="Start a new conversation thread"
            >
              <Plus className="w-3.5 h-3.5 text-krishi-700" />
              <span>New Chat</span>
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* CHAT SCROLL AREA                                                          */}
        {/* ========================================================================= */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-3xl mx-auto w-full space-y-6">
          {/* Previous Conversation Resumed Indicator */}
          {isResumedChat && messages.length > 0 && (
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-earth-100/80 text-gray-600 border border-earth-200">
                <Clock className="w-3 h-3 text-gray-500" />
                <span>Continue your farm conversation</span>
              </span>
            </div>
          )}

          {/* HOME VIEW: Shown when no messages yet or conversation is new */}
          {messages.length === 0 && !loadingHistory && (
            <div className="py-8 sm:py-12 space-y-6 text-center animate-in fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 shadow-soft">
                <Bot className="w-8 h-8" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  👋 Hi, {realUserName}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 font-medium">
                  How can I help with your farm?
                </p>
              </div>

              {/* Farm summary pill if available */}
              {hasFarm && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-gray-700 border border-earth-200 shadow-2xs">
                  <MapPin className="w-3.5 h-3.5 text-krishi-700 shrink-0" />
                  <span>{farm.location?.address || farm.location?.district || 'Your Farm'}</span>
                  {farm.crop?.name && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>
                        {farm.crop.name} ({farm.crop.stage || 'Active'})
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* 3 Dynamic Suggested Questions */}
              <div className="pt-2 space-y-2 max-w-lg mx-auto text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1 text-center">
                  Suggested Questions
                </p>
                <div className="space-y-2">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(q)}
                      disabled={isTyping}
                      className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-emerald-50/60 border border-earth-200 hover:border-emerald-300 text-gray-800 hover:text-emerald-950 font-medium text-xs sm:text-sm transition-all shadow-xs flex items-center justify-between group cursor-pointer"
                    >
                      <span className="pr-2 leading-snug">{q}</span>
                      <Sparkles className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CHAT MESSAGES STREAM */}
          <div className="space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 items-start ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* AI Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-krishi-700 text-white rounded-tr-xs shadow-soft'
                        : 'bg-white text-gray-900 border border-earth-200 rounded-tl-xs shadow-soft whitespace-pre-wrap'
                    }`}
                  >
                    <div>{msg.text}</div>
                    <div
                      className={`text-[10px] mt-1.5 flex items-center gap-1 ${
                        isUser ? 'text-krishi-100 justify-end' : 'text-gray-400 justify-start'
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-earth-200 text-earth-800 flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                      {realUserName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI Thinking Indicator */}
            {isTyping && (
              <div className="flex gap-3 items-start justify-start animate-in fade-in">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white text-emerald-800 border border-emerald-200/80 rounded-3xl rounded-tl-xs px-4 py-3 text-xs sm:text-sm font-semibold shadow-soft flex items-center gap-2">
                  <Sprout className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>🌱 Thinking...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>
        </main>

        {/* ========================================================================= */}
        {/* BOTTOM INPUT BAR: Clean, Responsive, with Mic & Send Controls             */}
        {/* ========================================================================= */}
        <div className="bg-white border-t border-earth-200/80 px-4 sm:px-6 lg:px-8 py-3.5 sticky bottom-0 z-10 shrink-0">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 bg-[#FBFBF7] p-1.5 sm:p-2 rounded-2xl border border-earth-300 focus-within:border-emerald-600 focus-within:bg-white transition-all shadow-xs"
            >
              {/* Mic Voice Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-md'
                    : 'bg-white hover:bg-emerald-50 text-krishi-700 border border-earth-200 shadow-2xs'
                }`}
                title={isListening ? 'Stop listening' : 'Tap to speak'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
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
                className="flex-1 py-2 px-2 text-xs sm:text-sm bg-transparent text-gray-900 focus:outline-none placeholder-gray-400 font-medium min-w-0"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputQuery.trim() || isTyping}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-krishi-700 hover:bg-krishi-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
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
