import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Volume2,
  VolumeX,
  Bot,
  User,
  Activity,
  Shirt,
  AlertTriangle,
  Loader2,
  X,
  Compass,
} from 'lucide-react';
import {
  AirQualityData,
  ChatMessage,
  CurrentWeather,
  DailyForecastItem,
  LocationData,
  WeatherIntelligence,
} from '../types/weather.ts';
import { askMeteorologist, fetchWeatherIntelligence } from '../services/geminiService.ts';

interface AiWeatherAssistantProps {
  location: LocationData;
  weather: CurrentWeather;
  airQuality: AirQualityData;
  daily: DailyForecastItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const AiWeatherAssistant: React.FC<AiWeatherAssistantProps> = ({
  location,
  weather,
  airQuality,
  daily,
  isOpen,
  onClose,
}) => {
  const [intelligence, setIntelligence] = useState<WeatherIntelligence | null>(null);
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am Nimbus, your WeatherFlow meteorological assistant for ${location.name}. Ask me anything about current conditions, outfit ideas, rain timing, or upcoming plans!`,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load intelligence briefing when location or weather changes
  useEffect(() => {
    let isMounted = true;
    async function loadBriefing() {
      setLoadingIntelligence(true);
      try {
        const data = await fetchWeatherIntelligence(
          location.name,
          weather,
          airQuality,
          daily,
        );
        if (isMounted) setIntelligence(data);
      } catch (_err) {
        // Quiet fallback handled by fetchWeatherIntelligence
      } finally {
        if (isMounted) setLoadingIntelligence(false);
      }
    }
    loadBriefing();
    return () => {
      isMounted = false;
    };
  }, [location.name, weather.weatherCode, weather.temperature]);

  // Scroll to bottom on new chat message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnswering]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isAnswering) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsAnswering(true);

    try {
      const reply = await askMeteorologist(
        query,
        location.name,
        weather,
        airQuality,
        daily,
      );

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (_e) {
      // Quiet fallback
    } finally {
      setIsAnswering(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const quickPrompts = [
    'What should I wear today?',
    'Will it rain this afternoon?',
    'Is it good for outdoor running?',
    'Weekend outlook summary?',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full text-slate-100 overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                Nimbus AI Meteorologist
              </div>
              <div className="text-[11px] text-slate-400">
                Grounded in live telemetry for {location.name}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Intelligence Briefing Highlight */}
        {intelligence && (
          <div className="p-4 bg-gradient-to-b from-cyan-950/30 to-transparent border-b border-slate-800/80">
            {intelligence.headlineAlert && (
              <div className="mb-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{intelligence.headlineAlert}</span>
              </div>
            )}

            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5" /> What to Wear
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleSpeak(
                      `${intelligence.summary} Clothing recommendation: ${intelligence.outfitAdvice}`,
                    )
                  }
                  title="Listen to briefing"
                  className="p-1 text-slate-400 hover:text-cyan-300 transition"
                >
                  {isSpeaking ? (
                    <VolumeX className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {intelligence.outfitAdvice}
              </p>
            </div>
          </div>
        )}

        {/* Chat Message Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((msg) => {
            const isAi = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                {isAi && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-cyan-300" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    isAi
                      ? 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-sm'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm shadow-md'
                  }`}
                >
                  <p>{msg.content}</p>
                  <span className="block text-[9px] text-slate-400/80 mt-1 text-right">
                    {msg.timestamp}
                  </span>
                </div>
                {!isAi && (
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            );
          })}

          {isAnswering && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-cyan-300 animate-pulse" />
              </div>
              <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl rounded-tl-sm p-3 flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                Analyzing weather patterns...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-950/50 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0 border border-slate-700/60"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about rain, outfit, temperatures..."
            disabled={isAnswering}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl py-2 px-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isAnswering}
            className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition disabled:opacity-40 cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
