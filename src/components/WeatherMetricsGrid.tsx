import React from 'react';
import {
  Compass,
  Sun,
  ShieldCheck,
  Droplets,
  Gauge,
  Eye,
  Wind,
  Cloud,
} from 'lucide-react';
import { AirQualityData, CurrentWeather, TempUnit } from '../types/weather.ts';
import { formatTemp } from '../services/weatherService.ts';

interface WeatherMetricsGridProps {
  weather: CurrentWeather;
  airQuality: AirQualityData;
  tempUnit: TempUnit;
}

function getWindCardinal(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((degrees % 360) / 45)) % 8;
  return directions[index];
}

export const WeatherMetricsGrid: React.FC<WeatherMetricsGridProps> = ({
  weather,
  airQuality,
  tempUnit,
}) => {
  const cardinal = getWindCardinal(weather.windDirection);

  // Pressure trend
  const pressureInHg = (weather.pressure * 0.02953).toFixed(2);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Wind & Dynamic Compass Needle */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            Wind & Direction
          </span>
          <span className="font-mono text-slate-500">{weather.windDirection}°</span>
        </div>

        <div className="flex items-center justify-between gap-4 my-auto">
          <div>
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {weather.windSpeed}{' '}
              <span className="text-sm font-sans font-medium text-slate-400">km/h</span>
            </div>
            <div className="text-xs text-slate-300 font-semibold mt-1 flex items-center gap-1">
              <span>{cardinal}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">Gusts up to {weather.windGust} km/h</span>
            </div>
          </div>

          {/* Animated Compass Rose */}
          <div className="relative w-16 h-16 rounded-full border border-slate-700/80 bg-slate-950/80 flex items-center justify-center shrink-0 shadow-inner">
            <span className="absolute top-1 text-[9px] font-bold text-slate-500">N</span>
            <span className="absolute right-1 text-[9px] font-bold text-slate-500">E</span>
            <span className="absolute bottom-1 text-[9px] font-bold text-slate-500">S</span>
            <span className="absolute left-1 text-[9px] font-bold text-slate-500">W</span>
            <div
              className="w-8 h-8 flex items-center justify-center transition-transform duration-700"
              style={{ transform: `rotate(${weather.windDirection}deg)` }}
            >
              <div className="w-1 h-7 rounded-full bg-gradient-to-t from-teal-400 to-transparent relative shadow-sm">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-teal-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
          Steady breeze with low turbulence
        </div>
      </div>

      {/* 2. UV Index & Protection */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            UV Index
          </span>
          <span className="font-mono text-amber-400 font-semibold">
            {weather.uvIndex >= 8
              ? 'Very High'
              : weather.uvIndex >= 6
              ? 'High'
              : weather.uvIndex >= 3
              ? 'Moderate'
              : 'Low'}
          </span>
        </div>

        <div className="my-auto">
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            {weather.uvIndex} <span className="text-sm font-sans text-slate-500 font-normal">/ 11+</span>
          </div>

          {/* UV Meter Bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (weather.uvIndex / 11) * 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
          {weather.uvIndex >= 6
            ? 'Sunscreen SPF 30+ & eye protection strongly advised.'
            : 'Safe UV exposure under normal conditions.'}
        </div>
      </div>

      {/* 3. Air Quality Index (AQI) */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Air Quality (AQI)
          </span>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: airQuality.color, backgroundColor: `${airQuality.color}20` }}
          >
            {airQuality.label}
          </span>
        </div>

        <div className="my-auto">
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            {airQuality.aqi}
          </div>

          {/* Key pollutants micro-breakdown */}
          <div className="grid grid-cols-4 gap-2 mt-3 text-center text-[10px]">
            <div className="p-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-slate-400 font-medium">PM2.5</div>
              <div className="font-mono font-bold text-slate-200 mt-0.5">
                {airQuality.pollutants.pm2_5.value}
              </div>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-slate-400 font-medium">PM10</div>
              <div className="font-mono font-bold text-slate-200 mt-0.5">
                {airQuality.pollutants.pm10.value}
              </div>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-slate-400 font-medium">NO₂</div>
              <div className="font-mono font-bold text-slate-200 mt-0.5">
                {airQuality.pollutants.no2.value}
              </div>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-slate-400 font-medium">O₃</div>
              <div className="font-mono font-bold text-slate-200 mt-0.5">
                {airQuality.pollutants.o3.value}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 truncate">
          {airQuality.description}
        </div>
      </div>

      {/* 4. Humidity & Dew Point */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            Humidity & Moisture
          </span>
          <span className="font-medium text-slate-300">
            {weather.humidity > 70 ? 'Humid' : weather.humidity < 35 ? 'Dry' : 'Ideal'}
          </span>
        </div>

        <div className="my-auto">
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            {weather.humidity}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Dew point is{' '}
            <span className="text-slate-200 font-mono font-medium">
              {formatTemp(weather.dewPoint, tempUnit)}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
          The dew point tells you the moisture level in the atmosphere.
        </div>
      </div>

      {/* 5. Barometric Pressure */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            Pressure
          </span>
          <span className="font-mono text-slate-400">{pressureInHg} inHg</span>
        </div>

        <div className="my-auto">
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            {weather.pressure}{' '}
            <span className="text-sm font-sans text-slate-400 font-medium">hPa</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {weather.pressure >= 1013 ? 'High pressure system (Stable)' : 'Low pressure front (Unsettled)'}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
          Atmospheric sea-level pressure
        </div>
      </div>

      {/* 6. Visibility & Cloud Cover */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-5 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            Visibility & Sky
          </span>
          <span className="font-medium text-cyan-400 flex items-center gap-1">
            <Cloud className="w-3 h-3" />
            {weather.cloudCover}% clouds
          </span>
        </div>

        <div className="my-auto">
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            {weather.visibility}{' '}
            <span className="text-sm font-sans text-slate-400 font-medium">km</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {weather.visibility >= 10
              ? 'Crystal clear horizon visibility'
              : weather.visibility >= 5
              ? 'Moderate haze or mist'
              : 'Poor visibility'}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
          Safe for all aviation & highway driving
        </div>
      </div>
    </div>
  );
};
