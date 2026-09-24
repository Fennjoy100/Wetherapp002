import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Activity,
  Shirt,
  MessageSquare,
  Volume2,
  VolumeX,
  Compass,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  AirQualityData,
  CurrentWeather,
  DailyForecastItem,
  LocationData,
  WeatherIntelligence,
} from '../types/weather.ts';
import { fetchWeatherIntelligence } from '../services/geminiService.ts';

interface WeatherIntelligenceCardProps {
  location: LocationData;
  weather: CurrentWeather;
  airQuality: AirQualityData;
  daily: DailyForecastItem[];
  onOpenChat: () => void;
}

export const WeatherIntelligenceCard: React.FC<WeatherIntelligenceCardProps> = ({
  location,
  weather,
  airQuality,
  daily,
  onOpenChat,
}) => {
  const [intel, setIntel] = useState<WeatherIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchWeatherIntelligence(
          location.name,
          weather,
          airQuality,
          daily,
        );
        if (mounted) setIntel(data);
      } catch (e) {
        console.error('Intelligence error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [location.name, weather.weatherCode, weather.temperature]);

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!intel) return null;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-72 h-44 bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              Atmospheric Intelligence & Activity Index
            </h2>
            <span className="text-[11px] text-slate-400">
              Live AI analysis powered by real-time meteorological models
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSpeak(`${intel.summary} ${intel.outfitAdvice}`)}
            title="Read summary aloud"
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition cursor-pointer"
          >
            {isSpeaking ? (
              <VolumeX className="w-4 h-4 text-cyan-400 animate-pulse" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onOpenChat}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask Meteorologist</span>
          </button>
        </div>
      </div>

      {/* Summary Narrative */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 mb-5">
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
          {intel.summary}
        </p>
        <div className="mt-2.5 pt-2.5 border-t border-slate-800 flex items-start gap-2 text-xs text-cyan-300">
          <Shirt className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
          <span>
            <strong className="text-slate-100">Wardrobe: </strong>
            {intel.outfitAdvice}
          </span>
        </div>
      </div>

      {/* Activity Suitability Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {intel.outdoorActivities.map((act) => {
          let scoreColor = 'text-emerald-400';
          let barBg = 'bg-emerald-400';
          if (act.score < 50) {
            scoreColor = 'text-rose-400';
            barBg = 'bg-rose-400';
          } else if (act.score < 75) {
            scoreColor = 'text-amber-400';
            barBg = 'bg-amber-400';
          }

          return (
            <div
              key={act.activity}
              className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700/80 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1">
                  <span>{act.activity}</span>
                  <span className={`font-mono font-bold ${scoreColor}`}>
                    {act.score}/100
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden my-2">
                  <div
                    className={`h-full rounded-full ${barBg} transition-all duration-500`}
                    style={{ width: `${act.score}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                {act.advice}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
