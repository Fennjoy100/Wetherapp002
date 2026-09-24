import React from 'react';
import { Sun, Moon, Sunrise, Sunset, Clock, Sparkles } from 'lucide-react';
import { CurrentWeather } from '../types/weather.ts';

interface SunMoonCycleProps {
  weather: CurrentWeather;
}

export const SunMoonCycle: React.FC<SunMoonCycleProps> = ({ weather }) => {
  const sunriseTime = weather.sunrise
    ? new Date(weather.sunrise).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    : '06:30 AM';

  const sunsetTime = weather.sunset
    ? new Date(weather.sunset).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    : '07:45 PM';

  // Calculate sun position percentage (0 to 1) based on current time
  const now = new Date();
  const sunriseDate = weather.sunrise ? new Date(weather.sunrise) : new Date(now.setHours(6, 30));
  const sunsetDate = weather.sunset ? new Date(weather.sunset) : new Date(now.setHours(19, 45));

  const totalDaylightMs = Math.max(1, sunsetDate.getTime() - sunriseDate.getTime());
  const elapsedDaylightMs = Math.max(0, Date.now() - sunriseDate.getTime());
  const progressRatio = Math.min(1, Math.max(0, elapsedDaylightMs / totalDaylightMs));

  // Sun coordinate on parabolic arc (SVG width 300, height 120)
  const arcWidth = 300;
  const arcHeight = 90;
  const sunX = 30 + progressRatio * (arcWidth - 60);
  // Parabola: y = 4 * h * (x/w) * (1 - x/w)
  const sunY = arcHeight - 4 * (arcHeight - 20) * progressRatio * (1 - progressRatio);

  const hoursDuration = Math.floor(weather.daylightDuration / 3600);
  const minutesDuration = Math.floor((weather.daylightDuration % 3600) / 60);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Sun Trajectory Arc */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            Solar Trajectory
          </span>
          <span className="text-slate-300 font-mono">
            {hoursDuration}h {minutesDuration}m daylight
          </span>
        </div>

        {/* SVG Sun Arc */}
        <div className="relative w-full h-32 flex items-center justify-center my-1 select-none">
          <svg viewBox={`0 0 ${arcWidth} ${arcHeight + 20}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="sunArcGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Base horizon dashed line */}
            <line
              x1="20"
              y1={arcHeight}
              x2={arcWidth - 20}
              y2={arcHeight}
              stroke="#334155"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Arc Path */}
            <path
              d={`M 30 ${arcHeight} Q ${arcWidth / 2} 10, ${arcWidth - 30} ${arcHeight}`}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="3 3"
              strokeOpacity="0.4"
            />

            {/* Active Sun glow & position */}
            {weather.isDay ? (
              <g transform={`translate(${sunX}, ${sunY})`}>
                <circle r="14" fill="#f59e0b" fillOpacity="0.25" className="animate-ping" />
                <circle r="8" fill="#f59e0b" />
                <circle r="4" fill="#fef3c7" />
              </g>
            ) : (
              <g transform={`translate(${arcWidth / 2}, ${arcHeight + 10})`}>
                <circle r="6" fill="#6366f1" fillOpacity="0.5" />
              </g>
            )}
          </svg>
        </div>

        {/* Sunrise & Sunset footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Sunrise className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Sunrise</div>
              <div className="font-semibold text-white font-mono">{sunriseTime}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div>
              <div className="text-[10px] text-slate-400 text-right">Sunset</div>
              <div className="font-semibold text-white font-mono">{sunsetTime}</div>
            </div>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sunset className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Moon Phase & Illumination */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5 text-indigo-300" />
            Lunar Phase
          </span>
          <span className="text-indigo-300 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Night Sky
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 my-auto py-2">
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {weather.moonPhase.phaseName}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Illumination:{' '}
              <span className="font-mono font-semibold text-indigo-200">
                {weather.moonPhase.illumination}%
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Synodic lunar cycle progression
            </div>
          </div>

          <div className="w-20 h-20 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center text-4xl shadow-lg shadow-indigo-950/50">
            {weather.moonPhase.icon}
          </div>
        </div>

        {/* Progress bar of lunar cycle */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span>Lunar Illumination</span>
            <span className="font-mono font-medium">{weather.moonPhase.illumination}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
              style={{ width: `${weather.moonPhase.illumination}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
