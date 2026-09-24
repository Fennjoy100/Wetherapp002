import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Globe,
  Navigation,
  Compass,
  Calendar,
  Layers,
} from 'lucide-react';
import { LocationData } from '../types/weather.ts';

interface LocationDetailsCardProps {
  location: LocationData;
}

export const LocationDetailsCard: React.FC<LocationDetailsCardProps> = ({ location }) => {
  const [localTimeStr, setLocalTimeStr] = useState<string>('');
  const [localDateStr, setLocalDateStr] = useState<string>('');
  const [tzDisplay, setTzDisplay] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        // Resolve timezone or use fallback
        let tz = location.timezone && location.timezone !== 'auto' ? location.timezone : undefined;
        
        // If tz is missing or auto, estimate roughly or use system
        const timeFmt = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });

        const dateFmt = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        const tzNameFmt = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          timeZoneName: 'short',
        });

        setLocalTimeStr(timeFmt.format(now));
        setLocalDateStr(dateFmt.format(now));

        const parts = tzNameFmt.formatToParts(now);
        const tzPart = parts.find((p) => p.type === 'timeZoneName');
        const shortName = tzPart ? tzPart.value : (tz || 'Local');
        setTzDisplay(tz ? `${tz} (${shortName})` : shortName);
      } catch (e) {
        const now = new Date();
        setLocalTimeStr(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }));
        setLocalDateStr(now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }));
        setTzDisplay(location.timezone || 'UTC');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [location.timezone, location.latitude, location.longitude]);

  const latStr = `${Math.abs(location.latitude).toFixed(4)}° ${location.latitude >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(location.longitude).toFixed(4)}° ${location.longitude >= 0 ? 'E' : 'W'}`;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Location Details & Global Telemetry
          </h2>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-mono text-cyan-300">
          <Clock className="w-3 h-3 animate-spin text-cyan-400" style={{ animationDuration: '6s' }} />
          <span>Live Local Time</span>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* City / Location */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
            <MapPin className="w-3 h-3 text-cyan-400" /> City / Location
          </span>
          <div className="text-sm font-bold text-white truncate" title={location.name}>
            {location.name}
          </div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5">
            {location.region || 'Metropolitan Area'}
          </div>
        </div>

        {/* Region & Country */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
            <Globe className="w-3 h-3 text-blue-400" /> Country & State
          </span>
          <div className="text-sm font-bold text-white truncate" title={location.country || 'International'}>
            {location.country || 'International'}
          </div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5">
            {location.countryCode ? `Code: ${location.countryCode}` : 'Global territory'}
          </div>
        </div>

        {/* Coordinates */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
            <Navigation className="w-3 h-3 text-emerald-400" /> Coordinates
          </span>
          <div className="text-xs font-mono font-bold text-emerald-300">
            {latStr}, {lonStr}
          </div>
          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
            Lat: {location.latitude.toFixed(4)} | Lon: {location.longitude.toFixed(4)}
          </div>
        </div>

        {/* Local Time & Timezone */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-950/60 to-slate-900/60 border border-cyan-500/30 shadow-inner">
          <span className="text-[10px] uppercase font-semibold text-cyan-300 tracking-wider flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-cyan-400" /> Local Station Time
          </span>
          <div className="text-sm font-mono font-extrabold text-cyan-200 tracking-tight">
            {localTimeStr || '--:--:--'}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5" title={tzDisplay}>
            {localDateStr} · {tzDisplay || 'UTC'}
          </div>
        </div>
      </div>
    </div>
  );
};
