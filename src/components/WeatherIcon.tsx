import React from 'react';
import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  SunMedium,
  MoonStar,
  Compass,
  Droplets,
  Eye,
  Gauge,
  Thermometer,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface WeatherIconProps {
  name: string;
  className?: string;
  size?: number;
  isDay?: boolean;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  name,
  className = 'w-6 h-6',
  size,
  isDay = true,
}) => {
  const iconProps = {
    className,
    size,
  };

  switch (name) {
    case 'Sun':
      return <Sun {...iconProps} className={`${className} text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]`} />;
    case 'SunMedium':
      return <SunMedium {...iconProps} className={`${className} text-amber-300`} />;
    case 'Moon':
      return <Moon {...iconProps} className={`${className} text-indigo-300 drop-shadow-[0_0_10px_rgba(165,180,252,0.4)]`} />;
    case 'MoonStar':
      return <MoonStar {...iconProps} className={`${className} text-indigo-200`} />;
    case 'CloudSun':
      return <CloudSun {...iconProps} className={`${className} text-amber-300`} />;
    case 'CloudMoon':
      return <CloudMoon {...iconProps} className={`${className} text-indigo-300`} />;
    case 'CloudRain':
      return <CloudRain {...iconProps} className={`${className} text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]`} />;
    case 'CloudDrizzle':
      return <CloudDrizzle {...iconProps} className={`${className} text-teal-400`} />;
    case 'CloudSnow':
      return <CloudSnow {...iconProps} className={`${className} text-sky-200 drop-shadow-[0_0_8px_rgba(186,230,253,0.4)]`} />;
    case 'CloudLightning':
      return <CloudLightning {...iconProps} className={`${className} text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]`} />;
    case 'CloudFog':
      return <CloudFog {...iconProps} className={`${className} text-slate-300`} />;
    case 'Cloud':
      return <Cloud {...iconProps} className={`${className} text-slate-300`} />;
    case 'Wind':
      return <Wind {...iconProps} className={`${className} text-teal-300`} />;
    case 'Droplets':
      return <Droplets {...iconProps} className={`${className} text-sky-400`} />;
    case 'Gauge':
      return <Gauge {...iconProps} className={`${className} text-blue-400`} />;
    case 'Thermometer':
      return <Thermometer {...iconProps} className={`${className} text-rose-400`} />;
    case 'Eye':
      return <Eye {...iconProps} className={`${className} text-slate-400`} />;
    case 'Compass':
      return <Compass {...iconProps} className={`${className} text-cyan-400`} />;
    case 'ShieldCheck':
      return <ShieldCheck {...iconProps} className={`${className} text-emerald-400`} />;
    case 'Sparkles':
      return <Sparkles {...iconProps} className={`${className} text-indigo-400`} />;
    default:
      return isDay ? (
        <Sun {...iconProps} className={`${className} text-amber-400`} />
      ) : (
        <Moon {...iconProps} className={`${className} text-indigo-300`} />
      );
  }
};
