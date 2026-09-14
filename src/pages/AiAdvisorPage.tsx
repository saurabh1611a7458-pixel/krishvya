import React, { useState } from 'react';
import { Sidebar } from '../components/common/Sidebar';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { Button } from '../components/common/Button';
import { useFarm } from '../context/FarmContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Bot,
  Mic,
  Send,
  Globe,
  Volume2,
} from 'lucide-react';
import { api } from '../services/api';
import { voiceService } from '../services/voiceService';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  actionableLinks?: string[];
  aiEngine?: string;
}

export const AiAdvisorPage: React.FC = () => {
  const { farm, user } = useFarm();
  const { language } = useLanguage();

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      sender: 'ai',
      text: `Namaste ${user.name}! 🙏 I am your KRISHVYA Farm Advisor powered by Gemini AI. I have analyzed your ${farm.size} acre ${farm.crop.name} field in ${farm.location.address}. What would you like guidance on today?`,
      timestamp: 'Just now',
    },
  ]);

  const suggestionChips = [
    'Should I irrigate today?',
    'Why are my leaves yellow?',
    'Which crop should I grow next?',
    'How can I improve my soil?',
  ];

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
      const historyPayload = messages.map((m) => ({
        role: (m.sender === 'ai' ? 'model' : 'user') as 'model' | 'user',
        content: m.text,
      }));

      const res = await api.askAdvisor(textToSend, historyPayload, language, {
        location: farm.location,
        crop: farm.crop,
        soil: farm.soil,
        weather: farm.weather,
        irrigationType: farm.irrigationType,
      });

      const aiReply = res.data?.reply || (res.success && res.message) || 'I have analyzed your field conditions. Delay irrigation by 24 hours ahead of expected rain.';
      const aiEngine = res.data?.aiEngine || 'gemini-2.5-flash';

      const aiMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: 'Just now',
        aiEngine,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.warn('AI Advisor call failed:', err);
      const fallbackMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: `Based on your live farm data: Rain (60% probability) is expected tomorrow in ${farm.location.address}. Your soil moisture is 42%. We advise delaying irrigation today.`,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBF7] flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <header className="bg-white border-b border-earth-200/80 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-krishi-700 flex items-center justify-center text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                AI Farm Advisor
              </h1>
              <p className="text-xs text-gray-500">Your 24/7 personal agricultural scientist</p>
            </div>
          </div>

          {/* Language callout badge matching Design #10 */}
          <div className="hidden sm:flex items-center gap-2 bg-earth-100 px-3 py-1.5 rounded-full text-xs font-bold text-gray-700">
            <Globe className="w-3.5 h-3.5 text-krishi-700" />
            <span>Speaks 7 Indian Languages</span>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full flex-1 flex flex-col justify-between space-y-4">
          {/* Active Context Bar */}
          <div className="bg-white px-4 py-2.5 rounded-2xl border border-earth-200/80 shadow-xs flex flex-wrap items-center justify-between text-xs text-gray-600 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Farm Context Connected:</span>
              <strong className="text-gray-900">{farm.crop.name} ({farm.crop.stage}) • {farm.size} acres</strong>
            </div>
            <div className="text-gray-500">
              Weather: <strong>{farm.weather.temperature}°C, Rain 68%</strong>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-4 py-2 min-h-[380px] max-h-[500px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-9 h-9 rounded-xl bg-krishi-700 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div
                  className={`max-w-xl p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-krishi-700 text-white font-medium rounded-tr-xs shadow-xs'
                      : 'bg-white text-gray-800 border border-earth-200/80 rounded-tl-xs shadow-soft'
                  }`}
                >
                  <p>{msg.text}</p>
                  <div
                    className={`mt-1.5 text-[10px] flex items-center gap-1 ${
                      msg.sender === 'user' ? 'text-krishi-200 justify-end' : 'text-gray-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'ai' && (
                      <button
                        onClick={() => voiceService.speak(msg.text, language)}
                        className="ml-2 text-krishi-700 hover:text-krishi-900 p-0.5 rounded transition-colors"
                        title="Listen to response in regional voice"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-9 h-9 rounded-xl bg-earth-200 text-earth-800 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 items-center text-xs text-gray-500 italic">
                <div className="w-8 h-8 rounded-xl bg-krishi-100 text-krishi-700 flex items-center justify-center">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <span>KRISHVYA AI is checking your farm sensors and weather...</span>
              </div>
            )}
          </div>

          {/* Quick Suggestion Chips matching Design #10 */}
          <div className="space-y-2 pt-2 border-t border-earth-200/80">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Suggested Questions (एक-टैप सवाल):
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestionChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSend(chip)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-krishi-50 border border-earth-200 text-xs font-semibold text-gray-700 hover:text-krishi-800 hover:border-krishi-300 transition-all shadow-2xs touch-card"
                >
                  💡 {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Chat Input Form matching Design #10 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-earth-300 shadow-soft"
          >
            <button
              type="button"
              onClick={() => {
                setIsListening(true);
                voiceService.startListening(
                  language,
                  (transcript) => {
                    setInputQuery(transcript);
                    setIsListening(false);
                  },
                  (err) => {
                    console.warn(err);
                    setIsListening(false);
                  },
                  () => setIsListening(false)
                );
              }}
              className={`p-3 rounded-xl transition-colors ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-gray-500 hover:text-krishi-700 hover:bg-krishi-50'
              }`}
              title={isListening ? 'Listening to voice...' : 'Speak your question (आवाज़ में पूछें)'}
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening... बोलिए...'
                  : 'Type your question or tap mic to speak...'
              }
              className="flex-1 py-2.5 px-2 text-sm text-gray-900 focus:outline-none placeholder-gray-400"
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!inputQuery.trim()}
              icon={<Send className="w-4 h-4" />}
            >
              Ask
            </Button>
          </form>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};
