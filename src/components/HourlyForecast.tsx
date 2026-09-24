import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Droplets, Wind } from 'lucide-react';
import { HourlyForecastItem, TempUnit } from '../types/weather.ts';
import { formatTemp } from '../services/weatherService.ts';
import { WeatherIcon } from './WeatherIcon.tsx';

interface HourlyForecastProps {
  hourly: HourlyForecastItem[];
  tempUnit: TempUnit;
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({ hourly, tempUnit }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (!hourly || hourly.length === 0) return null;

  // Temperature chart calculations
  const temps = hourly.map((h) =>
    tempUnit === 'fahrenheit' ? Math.round((h.temperature * 9) / 5 + 32) : Math.round(h.temperature),
  );
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = Math.max(1, maxTemp - minTemp);

  // Build SVG path for smooth temperature line
  const svgWidth = Math.max(800, hourly.length * 64);
  const svgHeight = 60;
  const paddingY = 12;

  const points = hourly.map((item, idx) => {
    const x = (idx / (hourly.length - 1)) * (svgWidth - 60) + 30;
    const currentT =
      tempUnit === 'fahrenheit'
        ? Math.round((item.temperature * 9) / 5 + 32)
        : Math.round(item.temperature);
    const normalizedY = (currentT - minTemp) / tempRange;
    const y = svgHeight - paddingY - normalizedY * (svgHeight - paddingY * 2);
    return { x, y, temp: currentT, item };
  });

  const pathData = points.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaData = `${pathData} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Hourly Forecast (24 Hours)
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll('left')}
            title="Scroll Left"
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            title="Scroll Right"
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Temperature Trend Line */}
      <div className="overflow-x-hidden relative mb-2 py-1 select-none hidden sm:block">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-14 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaData} fill="url(#tempGradient)" />
          <path
            d={pathData}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {points.map((pt, idx) => (
            <g key={`pt-${idx}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIdx === idx ? 5 : 3}
                fill={hoveredIdx === idx ? '#38bdf8' : '#0f172a'}
                stroke="#38bdf8"
                strokeWidth="2"
                className="transition-all"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Hourly Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-2.5 overflow-x-auto pb-2 pt-1 scroll-smooth no-scrollbar"
      >
        {hourly.map((item, index) => {
          const isCurrent = index === 0;
          return (
            <div
              key={`${item.time}-${index}`}
              onMouseEnter={() => setHoveredIdx(index)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex-shrink-0 w-24 p-3 rounded-2xl flex flex-col items-center justify-between text-center transition border ${
                isCurrent
                  ? 'bg-gradient-to-b from-cyan-950/40 to-slate-900/90 border-cyan-500/40 shadow-md shadow-cyan-950/50'
                  : 'bg-slate-950/40 hover:bg-slate-850/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <span
                className={`text-xs font-semibold ${
                  isCurrent ? 'text-cyan-400' : 'text-slate-400'
                }`}
              >
                {item.hour}
              </span>

              <div className="my-2">
                <WeatherIcon
                  name={item.iconName}
                  className="w-7 h-7"
                  isDay={item.isDay}
                />
              </div>

              <div className="text-base font-bold text-white font-mono">
                {formatTemp(item.temperature, tempUnit)}
              </div>

              <div className="mt-2 space-y-1 w-full text-[10px]">
                {item.precipitationProbability > 0 ? (
                  <div className="flex items-center justify-center gap-0.5 text-cyan-300 font-medium">
                    <Droplets className="w-3 h-3" />
                    <span>{item.precipitationProbability}%</span>
                  </div>
                ) : (
                  <div className="text-slate-600">0% rain</div>
                )}
                <div className="flex items-center justify-center gap-0.5 text-slate-400">
                  <Wind className="w-2.5 h-2.5 text-teal-400/80" />
                  <span>{item.windSpeed}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
