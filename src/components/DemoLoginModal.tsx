import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  X,
  LogIn,
  Sparkles,
  AlertCircle,
  GraduationCap,
  Image as ImageIcon,
  Compass,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { recordDemoLogin } from '../services/demoAdminService.ts';
import { UserProfile } from '../types/weather.ts';
import { NumberErrorModal } from './NumberErrorModal.tsx';
import {
  BACKGROUND_IMAGES,
  getStoredBackgroundImage,
  saveBackgroundImage,
  resolveWallpaperUrl,
  ThemeMode,
} from '../services/themeService.ts';

interface DemoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  bgImage?: string;
  onBgImageChange?: (url: string) => void;
  themeMode?: ThemeMode;
}

const PRESET_ACCOUNTS = [
  { gmail: 'demo.user@gmail.com', pass: 'demo1234', role: 'Demo User' },
  { gmail: 'student@gmail.com', pass: 'student2026', role: 'Student' },
  { gmail: 'evaluator@gmail.com', pass: 'evaluator123', role: 'Evaluator' },
  { gmail: 'teacher@gmail.com', pass: 'teacher2026', role: 'Teacher' },
];

export const DemoLoginModal: React.FC<DemoLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  bgImage,
  onBgImageChange,
  themeMode = 'dark',
}) => {
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBg, setSelectedBg] = useState<string>(() => bgImage || getStoredBackgroundImage());
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: 'Invalid Gmail',
    message: 'Please enter a valid Gmail, not a number.',
  });

  if (!isOpen) return null;

  // Sync and resolve selected background for production builds (Vercel)
  const activeBg = resolveWallpaperUrl(bgImage || selectedBg);
  const activeWallpaperObj =
    BACKGROUND_IMAGES.find((b) => b.url === activeBg || b.id === (bgImage || selectedBg)) ||
    BACKGROUND_IMAGES[0];

  const handleSelectBackground = (url: string) => {
    setSelectedBg(url);
    saveBackgroundImage(url);
    if (onBgImageChange) {
      onBgImageChange(url);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedGmail = gmail.trim();
    const trimmedPassword = password.trim();

    // Empty Gmail validation
    if (!trimmedGmail) {
      setErrorMessage('Please enter your Gmail to log in.');
      return;
    }

    // Number validation: Check if user entered numbers only in Gmail
    const isPureNumber =
      /^\d+$/.test(trimmedGmail.replace(/[\s.,\-_@]/g, '')) || !isNaN(Number(trimmedGmail));

    if (isPureNumber) {
      const msg = 'Please enter a valid Gmail, not a number.';
      setErrorMessage(msg);
      setErrorModal({
        isOpen: true,
        title: 'Invalid Gmail',
        message: msg,
      });
      return;
    }

    // Password validation
    if (!trimmedPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (trimmedPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const user = recordDemoLogin(trimmedGmail);
      setIsSubmitting(false);
      setGmail('');
      setPassword('');
      onLoginSuccess(user);
    }, 250);
  };

  const handleQuickSelect = (presetGmail: string, presetPass = 'demo1234') => {
    setGmail(presetGmail);
    setPassword(presetPass);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
      {/* Fullscreen High-Clarity Background Image Display */}
      {activeBg && activeBg !== 'none' ? (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <img
            src={activeBg}
            alt="Login Background Wallpaper"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('bg_aurora')) {
                target.src = '/images/bg_aurora.jpg';
              }
            }}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.05] scale-100 transition-all duration-700"
          />
          {/* Subtle translucent dark gradient overlay preserving wallpaper clarity & color */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/20 to-slate-950/60" />
        </div>
      ) : (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/60" />
      )}

      {/* Top Floating App Bar */}
      <div className="fixed top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-950/70 backdrop-blur-xl border border-white/15 text-xs text-white shadow-xl">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span className="font-bold tracking-tight">Weatherwise -weather forcasting application</span>
          <span className="text-slate-400 hidden sm:inline">• Login Portal</span>
        </div>

        {activeBg && activeBg !== 'none' && (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-950/70 backdrop-blur-xl border border-white/15 text-xs text-cyan-300 shadow-xl">
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium text-slate-300">Active Wallpaper:</span>
            <span className="font-semibold text-cyan-300 truncate max-w-[220px]">
              {activeWallpaperObj?.name}
            </span>
          </div>
        )}
      </div>

      {/* Frosted Glass Login Dialog */}
      <div
        className="relative w-full max-w-lg my-auto z-10 bg-slate-950/80 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200 pointer-events-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-login-title"
      >
        {/* Glow ambient background highlight */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-44 bg-gradient-to-r from-cyan-500/25 via-blue-600/25 to-indigo-600/25 blur-3xl pointer-events-none" />

        {/* Scenic Wallpaper Showcase Banner */}
        {activeBg && activeBg !== 'none' ? (
          <div className="relative h-28 sm:h-32 w-full overflow-hidden border-b border-white/10 group">
            <img
              src={activeBg}
              alt="Active Wallpaper Preview"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('bg_aurora')) {
                  target.src = '/images/bg_aurora.jpg';
                }
              }}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 filter brightness-[0.92]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-950/80 backdrop-blur-md text-cyan-300 border border-white/20 flex items-center gap-1.5 shadow-md">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="truncate max-w-[220px]">{activeWallpaperObj?.name}</span>
              </span>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-white backdrop-blur-md border border-white/20 transition cursor-pointer shadow-md"
                title="Close Login"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="absolute bottom-2.5 left-4 right-4 flex items-center justify-between text-xs text-white">
              <span className="text-[11px] font-medium text-slate-200 drop-shadow flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3 text-cyan-400" />
                <span>{activeWallpaperObj?.subtitle}</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="pt-4 px-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close Login"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-5 sm:p-7 space-y-4">
          {/* Modal Title & Brand Subtitle */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 shrink-0 border border-white/10">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="demo-login-title" className="text-base sm:text-lg font-bold tracking-tight text-white leading-snug">
                  Weatherwise -weather forcasting application
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 shrink-0">
                  <GraduationCap className="w-3 h-3" /> College Demo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Enter your Gmail and password to sign in and access the weather dashboard.
              </p>
            </div>
          </div>

          {/* Quick Background Image Selector Bar directly on Login Screen */}
          <div className="p-2.5 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Background Wallpaper:</span>
              </span>
              <span className="text-[10px] text-cyan-400 font-medium">Click to change background</span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {BACKGROUND_IMAGES.map((item) => {
                const isSelected = activeBg === item.url;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectBackground(item.url)}
                    className={`relative h-11 rounded-xl overflow-hidden border transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-md shadow-cyan-500/30 scale-105'
                        : 'border-white/10 hover:border-white/40 opacity-70 hover:opacity-100 hover:scale-102'
                    }`}
                    title={`${item.name} (${item.tag})`}
                  >
                    {item.url !== 'none' ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[10px] text-slate-400 font-semibold">
                        Solid
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-cyan-500/30 backdrop-blur-[1px] flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white drop-shadow font-bold" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Gmail Input Field */}
            <div>
              <label htmlFor="demo-gmail-input" className="block text-xs font-semibold text-slate-200 mb-1.5">
                Your Gmail <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="demo-gmail-input"
                  type="text"
                  autoFocus
                  value={gmail}
                  onChange={(e) => {
                    setGmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter your Gmail"
                  className={`w-full bg-slate-950/85 border rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-400 outline-none transition backdrop-blur-sm ${
                    errorMessage && !gmail.trim()
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-white/15 hover:border-white/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                  }`}
                />
              </div>
            </div>

            {/* Password Input Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="demo-password-input" className="block text-xs font-semibold text-slate-200">
                  Password <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-normal">Min 4 characters</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="demo-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`w-full bg-slate-950/85 border rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-400 outline-none transition backdrop-blur-sm ${
                    errorMessage && (!password.trim() || password.trim().length < 4)
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-white/15 hover:border-white/30 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-300" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400 hover:text-cyan-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Auto-Fill Help */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none text-[11px]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/20 bg-slate-900 w-3.5 h-3.5 accent-cyan-500"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setPassword('demo1234')}
                className="text-cyan-400 hover:text-cyan-300 text-[11px] font-medium transition cursor-pointer"
              >
                Auto-fill test password
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quick Demo Accounts Selection */}
            <div className="pt-1">
              <div className="text-[11px] font-medium text-slate-300 mb-2 flex items-center justify-between">
                <span>Quick Demo Accounts:</span>
                <span className="text-[10px] text-cyan-400">Click to auto-fill</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_ACCOUNTS.map((preset) => (
                  <button
                    key={preset.gmail}
                    type="button"
                    onClick={() => handleQuickSelect(preset.gmail, preset.pass)}
                    className={`px-2.5 py-1.5 rounded-xl text-left text-xs font-medium transition cursor-pointer border ${
                      gmail === preset.gmail
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-sm'
                        : 'bg-slate-900/80 border-white/10 text-slate-300 hover:bg-slate-800 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="truncate font-semibold text-slate-200">{preset.gmail}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
                      <span>pass: {preset.pass}</span>
                      <span className="text-cyan-400/80">{preset.role}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info callout */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Weatherwise Authentication</span>
              </div>
              <p>
                Enter your Gmail and password to log in. Session and personal weather settings will be saved securely for this device.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/80 transition cursor-pointer border border-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Logging in...</span>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Login</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Number Error Popup Modal */}
      <NumberErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal((prev) => ({ ...prev, isOpen: false }))}
        title={errorModal.title}
        message={errorModal.message}
      />
    </div>
  );
};
