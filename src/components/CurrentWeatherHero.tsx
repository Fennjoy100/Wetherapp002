import React, { useState, useEffect } from 'react';
import {
  MapPin,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Wind,
  Droplets,
  Sun,
  ShieldCheck,
  Calendar,
  Clock,
  Cloud,
} from 'lucide-react';
import { AirQualityData, CurrentWeather, LocationData, TempUnit } from '../types/weather.ts';
import { formatTemp, getWeatherInterpretation } from '../services/weatherService.ts';
import { WeatherIcon } from './WeatherIcon.tsx';

interface CurrentWeatherHeroProps {
  weather: CurrentWeather;
  location: LocationData;
  airQuality: AirQualityData;
  tempUnit: TempUnit;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: Date;
}

export const CurrentWeatherHero: React.FC<CurrentWeatherHeroProps> = ({
  weather,
  location,
  airQuality,
  tempUnit,
  onRefresh,
  isRefreshing,
  lastUpdated,
}) => {
  const interp = getWeatherInterpretation(weather.weatherCode, weather.isDay);

  const [localTime, setLocalTime] = useState<string>('');
  const [localDate, setLocalDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const tz = location.timezone && location.timezone !== 'auto' ? location.timezone : undefined;

        const dateFmt = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });

        const timeFmt = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        setLocalDate(dateFmt.format(now));
        setLocalTime(timeFmt.format(now));
      } catch {
        setLocalDate(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }));
        setLocalTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [location.timezone, location.latitude, location.longitude]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-2xl shadow-2xl transition-all">
      {/* Dynamic atmospheric radial backdrop gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${interp.bgGradient} opacity-60 pointer-events-none transition-all duration-700`}
      />

      {/* Subtle weather ambient glow orbs */}
      <div
        className="absolute -top-16 -right-16 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ backgroundColor: interp.accentColor }}
      />
      <div
        className="absolute -bottom-20 -left-16 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none bg-blue-600"
      />

      <div className="relative z-10 p-6 sm:p-8 lg:p-10">
        {/* Top bar: Location, Date & Refresh */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-cyan-400 shadow-inner">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {location.name}
                </h1>
                {location.isCurrentLocation && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Your Location
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                {[location.region, location.country].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{localDate || 'Today'}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5 font-medium text-cyan-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono">{localTime || '--:--'}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh Real-Time Telemetry"
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`}
                />
                <span className="hidden sm:inline text-[11px]">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hero Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8">
          {/* Left: Temperature & Conditions */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-center backdrop-blur-md shadow-xl">
                <WeatherIcon
                  name={weather.iconName}
                  className="w-16 h-16 sm:w-20 sm:h-20"
                  isDay={weather.isDay}
                />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <div className="text-6xl sm:text-7xl lg:text-8xl font-black text-white tracking-tighter drop-shadow-sm flex items-baseline">
                  <span>{formatTemp(weather.temperature, tempUnit).replace('°', '')}</span>
                  <span className="text-3xl sm:text-4xl lg:text-5xl text-cyan-400 font-sans font-bold ml-1">
                    °{tempUnit === 'celsius' ? 'C' : 'F'}
                  </span>
                </div>
                <div className="text-slate-400 text-xs sm:text-sm font-medium pb-2 pl-2">
                  Feels like{' '}
                  <span className="text-slate-200 font-semibold font-mono">
                    {formatTemp(weather.feelsLike, tempUnit)}
                  </span>
                </div>
              </div>

              <div className="mt-1">
                <div className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
                  {weather.condition}
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  {weather.description}
                </p>
              </div>

              {/* High / Low & Precipitation stats */}
              <div className="flex items-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1 text-rose-300 font-semibold" title="Today High">
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>{formatTemp(weather.tempMax, tempUnit)}</span>
                </div>
                <div className="flex items-center gap-1 text-sky-300 font-semibold" title="Today Low">
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>{formatTemp(weather.tempMin, tempUnit)}</span>
                </div>
                <span className="text-slate-700">·</span>
                <div className="flex items-center gap-1 text-cyan-300" title="Precipitation Probability">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>{weather.precipitationProbability}% chance of rain</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Instant Atmospheric Indicators */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="font-medium">Wind</span>
                <Wind className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="text-lg font-bold text-white font-mono">
                {weather.windSpeed} <span className="text-xs text-slate-400 font-sans">km/h</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Gusts {weather.windGust} km/h · {weather.windDirection}°
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="font-medium">Humidity</span>
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-lg font-bold text-white font-mono">
                {weather.humidity}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Dew point {formatTemp(weather.dewPoint, tempUnit)}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="font-medium">Cloud Cover</span>
                <Cloud className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div className="text-lg font-bold text-white font-mono">
                {weather.cloudCover}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Visibility {weather.visibility} km
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="font-medium">Air Quality</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <span>AQI {airQuality.aqi}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: airQuality.color }}
                />
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {airQuality.label}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
