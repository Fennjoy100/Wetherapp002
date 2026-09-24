import React, { useState } from 'react';
import {
  Cloud,
  Compass,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DEMO_USERS, saveUserSession, createGuestUser } from '../services/authService.ts';
import { UserProfile } from '../types/weather.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user: UserProfile = {
        id: `user-${Date.now()}`,
        name: tab === 'signup' ? name.trim() || 'Sky Observer' : email.split('@')[0],
        email: email.trim(),
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        preferredUnit: 'celsius',
        preferredWindUnit: 'kmh',
        savedLocations: DEMO_USERS[0].savedLocations,
      };

      saveUserSession(user);
      onLoginSuccess(user);
    }, 450);
  };

  const handleDemoLogin = (demoUser: UserProfile) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      saveUserSession(demoUser);
      onLoginSuccess(demoUser);
    }, 300);
  };

  const handleGuestLogin = () => {
    const guest = createGuestUser();
    saveUserSession(guest);
    onLoginSuccess(guest);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md my-auto bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl shadow-cyan-950/30 overflow-hidden text-slate-100">
        {/* Glow ambient header */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-44 bg-gradient-to-r from-cyan-500/20 via-blue-600/20 to-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="p-6 sm:p-8">
          {/* Brand header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25 mb-3">
              <Compass className="w-6 h-6 text-white animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              WeatherFlow
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Precision Atmospheric Dashboard & Predictive Insights
            </p>
          </div>

          {/* Tab selector */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/70 border border-slate-800 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'signin'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setError(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'signup'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/20 bg-slate-900 w-3.5 h-3.5"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setError('Password reset instructions will be sent to your registered email.')}
                className="text-cyan-400 hover:text-cyan-300 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{tab === 'signin' ? 'Sign In to Dashboard' : 'Complete Registration'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative px-3 bg-slate-900 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Quick 1-Click Access
            </span>
          </div>

          {/* Quick Demo Accounts */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleDemoLogin(DEMO_USERS[0])}
              className="w-full p-2.5 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between text-left transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <img
                  src={DEMO_USERS[0].avatarUrl}
                  alt={DEMO_USERS[0].name}
                  className="w-8 h-8 rounded-full object-cover border border-cyan-500/30"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                    {DEMO_USERS[0].name}
                    <span className="text-[10px] px-1.5 py-0.2 bg-cyan-500/10 text-cyan-400 rounded">
                      Metric (°C)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Favorites: SF, Tokyo, Paris
                  </div>
                </div>
              </div>
              <Zap className="w-4 h-4 text-cyan-400 opacity-60 group-hover:opacity-100 transition" />
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin(DEMO_USERS[1])}
              className="w-full p-2.5 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between text-left transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <img
                  src={DEMO_USERS[1].avatarUrl}
                  alt={DEMO_USERS[1].name}
                  className="w-8 h-8 rounded-full object-cover border border-blue-500/30"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                    {DEMO_USERS[1].name}
                    <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/10 text-blue-400 rounded">
                      Imperial (°F)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Favorites: NYC, London, Sydney
                  </div>
                </div>
              </div>
              <Zap className="w-4 h-4 text-blue-400 opacity-60 group-hover:opacity-100 transition" />
            </button>

            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-xl transition text-center cursor-pointer block"
            >
              Or continue immediately as a Guest Explorer →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
