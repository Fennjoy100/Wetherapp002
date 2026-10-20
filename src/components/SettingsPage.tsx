import React, { useState } from 'react';
import {
  ArrowLeft,
  Moon,
  Sun,
  Palette,
  Check,
  CheckCircle2,
  RotateCcw,
  Sliders,
  CloudSun,
  Sparkles,
  Thermometer,
  Wind,
  Droplets,
  Image as ImageIcon,
  GraduationCap,
  Eye,
} from 'lucide-react';
import {
  THEME_COLORS,
  BACKGROUND_IMAGES,
  ThemeColorOption,
  BackgroundImageOption,
  ThemeMode,
  applyTheme,
  saveThemeColor,
  saveThemeMode,
  saveBackgroundImage,
  saveBackgroundOpacity,
  resolveWallpaperUrl,
  resetTheme,
} from '../services/themeService.ts';
import { TempUnit } from '../types/weather.ts';

interface SettingsPageProps {
  onBackToWeather: () => void;
  currentMode: ThemeMode;
  currentColorId: string;
  onThemeModeChange: (mode: ThemeMode) => void;
  onThemeColorChange: (colorId: string) => void;
  currentBgImage: string;
  onBgImageChange: (url: string) => void;
  bgOpacity: number;
  onBgOpacityChange: (opacity: number) => void;
  tempUnit: TempUnit;
  onToggleTempUnit: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onBackToWeather,
  currentMode,
  currentColorId,
  onThemeModeChange,
  onThemeColorChange,
  currentBgImage,
  onBgImageChange,
  bgOpacity,
  onBgOpacityChange,
  tempUnit,
  onToggleTempUnit,
}) => {
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const activeColorObj =
    THEME_COLORS.find((c) => c.id === currentColorId) || THEME_COLORS[0];

  const triggerFeedback = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => {
      setFeedbackNotice((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  const handleModeSelect = (mode: ThemeMode) => {
    onThemeModeChange(mode);
    saveThemeMode(mode);
    applyTheme(mode, currentColorId);
    triggerFeedback(`Switched to ${mode === 'dark' ? 'Dark Mode' : 'Light Mode'}`);
  };

  const handleColorSelect = (color: ThemeColorOption) => {
    onThemeColorChange(color.id);
    saveThemeColor(color.id);
    applyTheme(currentMode, color.id);
    triggerFeedback(`Theme accent changed to ${color.name}`);
  };

  const handleBgImageSelect = (bg: BackgroundImageOption) => {
    onBgImageChange(bg.url);
    saveBackgroundImage(bg.url);
    triggerFeedback(`Background set to "${bg.name}"`);
  };

  const handleOpacitySelect = (opacity: number) => {
    onBgOpacityChange(opacity);
    saveBackgroundOpacity(opacity);
    triggerFeedback(`Background overlay adjusted to ${Math.round(opacity * 100)}%`);
  };

  const handleResetDefaults = () => {
    const { mode, colorId, bgImage, bgOpacity: defaultOpacity } = resetTheme();
    onThemeModeChange(mode);
    onThemeColorChange(colorId);
    onBgImageChange(bgImage);
    onBgOpacityChange(defaultOpacity);
    triggerFeedback('Theme and wallpaper reset to default settings');
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-200 max-w-7xl mx-auto relative z-10">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow ambient background based on active theme */}
        <div
          className="absolute top-0 right-0 w-96 h-40 opacity-20 blur-3xl pointer-events-none transition-all duration-500"
          style={{ backgroundColor: activeColorObj.primary }}
        />

        <div className="flex items-center gap-3.5 z-10">
          <button
            type="button"
            onClick={onBackToWeather}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700/60 flex items-center gap-2 group shrink-0"
            title="Return to Live Weather Dashboard"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-semibold hidden md:inline">Back to Weather App</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${activeColorObj.primary}, ${activeColorObj.secondary})`,
                }}
              >
                <Sliders className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Settings & Appearance
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                Live Customizer
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize Dark/Light mode, pick from 10 vibrant accent colors, and choose your favorite scenic background wallpaper.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 z-10 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer shadow-sm"
            title="Reset theme and color to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Real-time Feedback Toast / Alert Banner */}
      {feedbackNotice && (
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 text-xs text-cyan-300 flex items-center gap-2.5 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-medium text-white">{feedbackNotice}</span>
          <span className="text-slate-400 text-[11px] ml-auto">Saved in LocalStorage</span>
        </div>
      )}

      {/* SECTION 1: BACKGROUND WALLPAPER & SCENERY */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-cyan-400" />
              <span>Background Wallpaper & Scenery</span>
            </h2>
            <p className="text-xs text-slate-400">
              Select any scenery below to display as the full-screen atmospheric backdrop behind your weather dashboard.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Overlay Darkness:</span>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              {[
                { label: '50%', value: 0.50 },
                { label: '70%', value: 0.70 },
                { label: '85%', value: 0.85 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleOpacitySelect(opt.value)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    Math.abs(bgOpacity - opt.value) < 0.05
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Wallpaper Image Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BACKGROUND_IMAGES.map((bg) => {
            const isSelected =
              resolveWallpaperUrl(currentBgImage) === resolveWallpaperUrl(bg.url) ||
              currentBgImage === bg.id;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => handleBgImageSelect(bg)}
                className={`relative group rounded-3xl border text-left overflow-hidden transition-all duration-200 cursor-pointer flex flex-col ${
                  isSelected
                    ? 'border-2 border-cyan-400 shadow-2xl ring-2 ring-cyan-400/25 bg-slate-900'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                {/* Image Preview Box */}
                <div className="relative w-full h-36 overflow-hidden bg-slate-950">
                  {bg.url !== 'none' ? (
                    <img
                      src={bg.url}
                      alt={bg.name}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('bg_aurora')) {
                          target.src = '/images/bg_aurora.jpg';
                        }
                      }}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex items-center justify-center text-slate-500">
                      <div className="flex flex-col items-center gap-1.5">
                        <Moon className="w-6 h-6 text-slate-600" />
                        <span className="text-xs font-semibold">Solid Pure Color</span>
                      </div>
                    </div>
                  )}

                  {/* Top Badge: Tag */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-white border border-white/10 shadow-sm">
                      {bg.tag}
                    </span>
                  </div>

                  {/* Active Selection Checkmark Overlay */}
                  <div
                    className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-lg scale-100'
                        : 'bg-slate-950/70 border border-slate-700 text-transparent scale-90 group-hover:scale-100'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>

                {/* Information */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-200 transition">
                        {bg.name}
                      </h3>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {bg.subtitle}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-cyan-400 font-medium">
                      <Eye className="w-3 h-3" />
                      <span>{isSelected ? 'Currently in background' : 'Click to preview & apply'}</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">16:9 8K</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: DARK MODE / LIGHT MODE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-400" />
              <span>Theme Mode</span>
            </h2>
            <p className="text-xs text-slate-400">
              Select your preferred visual brightness mode for all weather views and dashboards.
            </p>
          </div>

          {/* Quick toggle pill */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => handleModeSelect('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                currentMode === 'light'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeSelect('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                currentMode === 'dark'
                  ? 'bg-slate-800 text-cyan-300 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
          </div>
        </div>

        {/* 2 Big Visual Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dark Mode Card */}
          <div
            onClick={() => handleModeSelect('dark')}
            className={`relative p-5 rounded-3xl border transition-all cursor-pointer group overflow-hidden ${
              currentMode === 'dark'
                ? 'bg-slate-900/90 border-cyan-500 shadow-2xl ring-2 ring-cyan-500/20'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 shadow-inner">
                  <Moon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Dark Mode</h3>
                    {currentMode === 'dark' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Deep twilight sky aesthetic with vivid luminescence.
                  </p>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                  currentMode === 'dark'
                    ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                    : 'border-slate-700 bg-slate-800 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>

            {/* Visual Preview Box */}
            <div className="mt-4 p-3 rounded-2xl bg-slate-950/90 border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="font-mono text-[11px] text-slate-400">Background: #020617 (Deep Slate)</span>
              </div>
              <span className="text-cyan-400 font-semibold text-[11px]">Best for night & low-glare</span>
            </div>
          </div>

          {/* Light Mode Card */}
          <div
            onClick={() => handleModeSelect('light')}
            className={`relative p-5 rounded-3xl border transition-all cursor-pointer group overflow-hidden ${
              currentMode === 'light'
                ? 'bg-slate-900/90 border-amber-400 shadow-2xl ring-2 ring-amber-400/20'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <Sun className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Light Mode</h3>
                    {currentMode === 'light' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Crisp daylight palette with soft elevated card surfaces.
                  </p>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                  currentMode === 'light'
                    ? 'bg-amber-400 border-amber-300 text-slate-950'
                    : 'border-slate-700 bg-slate-800 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>

            {/* Visual Preview Box */}
            <div className="mt-4 p-3 rounded-2xl bg-slate-950/90 border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="font-mono text-[11px] text-slate-400">Background: #f8fafc (Day Sky)</span>
              </div>
              <span className="text-amber-400 font-semibold text-[11px]">Best for daytime & bright rooms</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: 10 BEST COLORS (Click to Change) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-cyan-400" />
              <span>10 Best Theme Colors</span>
            </h2>
            <p className="text-xs text-slate-400">
              Choose and click any color below to instantly update all accent colors, badges, and buttons.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>Active Color:</span>
            <span
              className="font-bold px-2 py-0.5 rounded-lg border text-white"
              style={{
                backgroundColor: activeColorObj.primary,
                borderColor: activeColorObj.light,
              }}
            >
              {activeColorObj.name}
            </span>
          </div>
        </div>

        {/* 10 Colors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {THEME_COLORS.map((color, index) => {
            const isSelected = color.id === currentColorId;
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => handleColorSelect(color)}
                className={`relative p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-2 shadow-xl ring-2'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
                style={{
                  borderColor: isSelected ? color.primary : undefined,
                  boxShadow: isSelected ? `0 10px 25px -5px ${color.glow}` : undefined,
                }}
              >
                {/* Top: Swatch & Checkmark */}
                <div className="flex items-center justify-between mb-3">
                  {/* Color Swatch Circle */}
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})`,
                      boxShadow: `0 4px 14px 0 ${color.glow}`,
                    }}
                  >
                    {isSelected ? (
                      <Check className="w-5 h-5 text-white stroke-[3] animate-in zoom-in-75 duration-150" />
                    ) : (
                      <span className="text-[10px] font-bold text-white/80 font-mono">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* Active Badge */}
                  {isSelected && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white shadow-sm"
                      style={{ backgroundColor: color.primary }}
                    >
                      Active
                    </span>
                  )}
                </div>

                {/* Details */}
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-200 transition">
                    {color.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {color.tagline}
                  </p>
                </div>

                {/* Bottom: Gradient Bar & Hex */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <div
                    className="h-2 w-14 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${color.primary}, ${color.secondary})`,
                    }}
                  />
                  <span>{color.primary.toUpperCase()}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: LIVE REAL-TIME PREVIEW CARD */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>Live Interactive Weather Preview</span>
          </h2>
          <p className="text-xs text-slate-400">
            See how your selected background image, theme mode ({currentMode.toUpperCase()}), and accent color ({activeColorObj.name}) render together.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl relative overflow-hidden">
          {/* Background image preview inside preview container */}
          {currentBgImage && currentBgImage !== 'none' && (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              <img
                src={currentBgImage}
                alt="Background preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-25"
              />
            </div>
          )}

          {/* Subtle Ambient glow based on chosen color */}
          <div
            className="absolute -top-10 -right-10 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none transition-all duration-500"
            style={{ backgroundColor: activeColorObj.primary }}
          />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left: Weather Highlight */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-xl text-white shadow-sm flex items-center gap-1.5"
                  style={{
                    background: `linear-gradient(135deg, ${activeColorObj.primary}, ${activeColorObj.secondary})`,
                  }}
                >
                  <CloudSun className="w-3.5 h-3.5" />
                  <span>Previewing {activeColorObj.name}</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Mode: <strong className="text-white">{currentMode.toUpperCase()}</strong>
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-extrabold text-white tracking-tight">
                  {tempUnit === 'celsius' ? '24°C' : '75°F'}
                </span>
                <span className="text-lg font-medium text-slate-300">
                  Partly Cloudy • Gentle Breeze
                </span>
              </div>

              {/* Sample Metrics Badges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1 text-slate-400 mb-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Humidity</span>
                  </div>
                  <div className="font-bold text-white text-sm">62%</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1 text-slate-400 mb-1">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Wind</span>
                  </div>
                  <div className="font-bold text-white text-sm">14 km/h</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1 text-slate-400 mb-1">
                    <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>UV Index</span>
                  </div>
                  <div className="font-bold text-white text-sm">3 (Moderate)</div>
                </div>
              </div>
            </div>

            {/* Right: Interactive button preview */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
              <div className="text-xs font-semibold text-slate-300">
                Action Button Styling
              </div>
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl text-white font-semibold text-xs transition shadow-lg cursor-pointer preserve-white"
                style={{
                  background: `linear-gradient(135deg, ${activeColorObj.primary}, ${activeColorObj.secondary})`,
                  boxShadow: `0 8px 20px -4px ${activeColorObj.glow}`,
                }}
              >
                Theme Styled Button
              </button>
              <p className="text-[11px] text-slate-500">
                All buttons, badges, highlights, and borders automatically inherit this color.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: UNIT PREFERENCES */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-cyan-400" />
            <span>Unit Preferences</span>
          </h2>
          <p className="text-xs text-slate-400">
            Configure default measurement units for temperature and atmospheric readings.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-cyan-400">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Temperature Scale</div>
              <div className="text-xs text-slate-400">
                Current unit: {tempUnit === 'celsius' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleTempUnit}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition cursor-pointer border border-slate-700 flex items-center gap-2 self-start sm:self-auto"
          >
            <span>Switch to {tempUnit === 'celsius' ? 'Fahrenheit (°F)' : 'Celsius (°C)'}</span>
          </button>
        </div>
      </section>

      {/* College Project Demo Footer Note */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>College Project Demonstration • Persistent Local Theme & Background Engine</span>
        </div>
        <button
          type="button"
          onClick={onBackToWeather}
          className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
        >
          Return to Weather
        </button>
      </div>
    </div>
  );
};
