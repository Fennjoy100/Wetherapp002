import React, { useState } from 'react';
import { CalendarDays, Droplets, Wind, Sun, ChevronDown, ChevronUp } from 'lucide-react';
import { DailyForecastItem, TempUnit } from '../types/weather.ts';
import { formatTemp } from '../services/weatherService.ts';
import { WeatherIcon } from './WeatherIcon.tsx';

interface DailyForecastProps {
  daily: DailyForecastItem[];
  tempUnit: TempUnit;
}

export const DailyForecast: React.FC<DailyForecastProps> = ({ daily, tempUnit }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!daily || daily.length === 0) return null;

  // Calculate week-wide min and max for proportioned temperature range bars
  const allMins = daily.map((d) => d.tempMin);
  const allMaxs = daily.map((d) => d.tempMax);
  const weekMin = Math.min(...allMins);
  const weekMax = Math.max(...allMaxs);
  const weekSpan = Math.max(1, weekMax - weekMin);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
            7-Day Extended Forecast
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">Daily Outlook</span>
      </div>

      <div className="space-y-2.5">
        {daily.map((day, idx) => {
          const isToday = idx === 0;
          const isExpanded = expandedIndex === idx;

          // Proportional bar offset and width
          const leftPercent = ((day.tempMin - weekMin) / weekSpan) * 100;
          const rightPercent = ((weekMax - day.tempMax) / weekSpan) * 100;

          return (
            <div
              key={day.date}
              className={`rounded-2xl border transition-all ${
                isToday
                  ? 'bg-slate-950/60 border-cyan-500/30'
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="p-3 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                {/* Day name & date */}
                <div className="w-24 sm:w-32 shrink-0">
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    {day.dayName}
                    {isToday && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                        NOW
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">{day.fullDate}</div>
                </div>

                {/* Condition Icon & Description */}
                <div className="flex items-center gap-2.5 w-32 sm:w-44 shrink-0">
                  <WeatherIcon name={day.iconName} className="w-6 h-6 shrink-0" />
                  <span className="text-xs font-medium text-slate-300 truncate hidden sm:inline">
                    {day.condition}
                  </span>
                </div>

                {/* Rain probability */}
                <div className="w-16 shrink-0 text-center">
                  {day.precipitationProbability > 0 ? (
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400">
                      <Droplets className="w-3 h-3" />
                      <span>{day.precipitationProbability}%</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-600">—</span>
                  )}
                </div>

                {/* Temperature Range Bar */}
                <div className="flex-1 flex items-center gap-2 max-w-xs">
                  <span className="text-xs font-mono font-semibold text-sky-300 w-8 text-right">
                    {formatTemp(day.tempMin, tempUnit)}
                  </span>

                  <div className="flex-1 h-2 bg-slate-800/80 rounded-full relative overflow-hidden hidden xs:block">
                    <div
                      className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-400"
                      style={{
                        left: `${Math.max(0, leftPercent)}%`,
                        right: `${Math.max(0, rightPercent)}%`,
                      }}
                    />
                  </div>

                  <span className="text-xs font-mono font-semibold text-rose-300 w-8 text-left">
                    {formatTemp(day.tempMax, tempUnit)}
                  </span>
                </div>

                <div className="text-slate-500 pl-1">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>

              {/* Detailed dropdown metrics for the day */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 flex items-center gap-1 mb-1">
                      <Droplets className="w-3 h-3 text-cyan-400" />
                      <span>Total Rain</span>
                    </div>
                    <div className="font-mono font-bold text-white">
                      {day.precipitationSum} mm
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 flex items-center gap-1 mb-1">
                      <Wind className="w-3 h-3 text-teal-400" />
                      <span>Max Wind</span>
                    </div>
                    <div className="font-mono font-bold text-white">
                      {day.windSpeedMax} km/h
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 flex items-center gap-1 mb-1">
                      <Sun className="w-3 h-3 text-amber-400" />
                      <span>Max UV Index</span>
                    </div>
                    <div className="font-mono font-bold text-white">
                      {day.uvIndexMax}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 flex items-center gap-1 mb-1">
                      <span>Condition</span>
                    </div>
                    <div className="font-medium text-slate-200 truncate">
                      {day.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
