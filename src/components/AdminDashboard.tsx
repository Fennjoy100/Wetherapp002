import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  LayoutDashboard,
  ShieldCheck,
  UserCheck,
  UserX,
  LogIn,
  LogOut,
  Clock,
  Activity,
  Sparkles,
  RefreshCw,
  Server,
  CloudSun,
  Database,
  Layers,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import {
  DemoActivityItem,
  DemoStats,
  getDemoActivities,
  getDemoStats,
  getDemoUser,
  recordDemoLogin,
  recordDemoLogout,
  resetDemoData,
} from '../services/demoAdminService.ts';
import { UserProfile } from '../types/weather.ts';
import { NumberErrorModal } from './NumberErrorModal.tsx';

interface AdminDashboardProps {
  user: UserProfile | null;
  onBackToWeather: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  onBackToWeather,
  onOpenLogin,
  onLogout,
}) => {
  const [stats, setStats] = useState<DemoStats>(() => getDemoStats());
  const [activities, setActivities] = useState<DemoActivityItem[]>(() => getDemoActivities());
  const [activeUser, setActiveUser] = useState<UserProfile | null>(() => getDemoUser());
  const [quickLoginName, setQuickLoginName] = useState('');
  const [showQuickLogin, setShowQuickLogin] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [numberModal, setNumberModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: 'Invalid Name',
    message: 'Please enter a valid name, not a number.',
  });

  // Sync with global auth/stats/activity events
  useEffect(() => {
    const handleAuthChange = () => {
      setActiveUser(getDemoUser());
      setStats(getDemoStats());
      setActivities(getDemoActivities());
    };
    const handleStatsChange = () => {
      setStats(getDemoStats());
    };
    const handleActivityChange = () => {
      setActivities(getDemoActivities());
    };

    window.addEventListener('weatherise:auth_change', handleAuthChange);
    window.addEventListener('weatherise:stats_change', handleStatsChange);
    window.addEventListener('weatherise:activity_change', handleActivityChange);

    return () => {
      window.removeEventListener('weatherise:auth_change', handleAuthChange);
      window.removeEventListener('weatherise:stats_change', handleStatsChange);
      window.removeEventListener('weatherise:activity_change', handleActivityChange);
    };
  }, []);

  const handleDashboardLogout = () => {
    recordDemoLogout();
    onLogout();
    setNotice('Logged out successfully. Activity log & counters updated.');
    setTimeout(() => setNotice(null), 4000);
  };

  const handleDashboardQuickLogin = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNotice('Please enter your Gmail to log in.');
      setTimeout(() => setNotice(null), 3500);
      return;
    }

    const isPureNumber =
      /^\d+$/.test(trimmed.replace(/[\s.,\-_]/g, '')) || !isNaN(Number(trimmed));

    if (isPureNumber) {
      setNumberModal({
        isOpen: true,
        title: 'Invalid Name',
        message: 'Please enter a valid name, not a number.',
      });
      return;
    }

    if (/\d/.test(trimmed)) {
      setNumberModal({
        isOpen: true,
        title: 'Invalid Name',
        message: 'Names cannot contain numbers. Please enter a valid name.',
      });
      return;
    }

    recordDemoLogin(trimmed);
    setActiveUser(getDemoUser());
    setStats(getDemoStats());
    setActivities(getDemoActivities());
    setQuickLoginName('');
    setShowQuickLogin(false);
    setNotice(`Logged in as ${trimmed}! Dashboard updated in real time.`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleResetData = () => {
    const { stats: freshStats, activities: freshActivities } = resetDemoData();
    setStats(freshStats);
    setActivities(freshActivities);
    setNotice('Demo statistics & activity timeline reset to baseline presentation values.');
    setTimeout(() => setNotice(null), 4000);
  };

  const isLoggedIn = Boolean(activeUser);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 max-w-7xl mx-auto">
      {/* Top Bar with Navigation & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-80 h-36 bg-gradient-to-l from-cyan-500/10 via-blue-500/10 to-transparent blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3.5 z-10">
          <button
            type="button"
            onClick={onBackToWeather}
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-750 flex items-center gap-2 group shrink-0"
            title="Return to Live Weather Dashboard"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-semibold hidden md:inline">Back to Weather App</span>
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                <span>Admin Dashboard</span>
              </h1>

              {/* College Project Demo Badge */}
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                <span>College Project Demo</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulated administrative control & activity analytics console for project evaluation.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 z-10">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleDashboardLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Demo Logout</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Demo Login</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetData}
            title="Reset demo statistics to default baseline"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-750 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Notice / Toast */}
      {notice && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-white transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Login Drawer / Inline Form when toggled */}
      {showQuickLogin && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <LogIn className="w-4 h-4 text-cyan-400" />
                <span>Simulate Quick Login</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Type any name to test instant dashboard reactivity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickLogin(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              autoFocus
              value={quickLoginName}
              onChange={(e) => setQuickLoginName(e.target.value)}
              placeholder="Enter your Gmail"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 w-64"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDashboardQuickLogin(quickLoginName);
              }}
            />
            <button
              type="button"
              onClick={() => handleDashboardQuickLogin(quickLoginName)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition cursor-pointer"
            >
              Log In
            </button>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 pl-2">
              <span>Or click preset:</span>
              {['student@gmail.com', 'evaluator@gmail.com', 'demo.user@gmail.com'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleDashboardQuickLogin(p)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid: 4 Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Demo Logins */}
        <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Total Demo Logins
            </span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition">
              <LogIn className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight mb-1">
            {stats.totalLogins}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Simulated session count</span>
          </div>
        </div>

        {/* Card 2: Current Login Status */}
        <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Current Login Status
            </span>
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition group-hover:scale-110 ${
                isLoggedIn
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              {isLoggedIn ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
            </div>
          </div>
          <div className="text-2xl font-extrabold tracking-tight mb-1 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isLoggedIn ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className={isLoggedIn ? 'text-emerald-400' : 'text-amber-400'}>
              {isLoggedIn ? 'Logged In' : 'Logged Out'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {isLoggedIn ? `Active User: ${activeUser?.name}` : 'No active session'}
          </div>
        </div>

        {/* Card 3: Last Login */}
        <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Last Login
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white tracking-tight mb-1 truncate" title={stats.lastLoginTime}>
            {stats.lastLoginTime || 'Never'}
          </div>
          <div className="text-[11px] text-slate-400">
            Recorded in local browser session
          </div>
        </div>

        {/* Card 4: Total Logout Events */}
        <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl backdrop-blur-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Total Logout Events
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 group-hover:scale-110 transition">
              <LogOut className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight mb-1">
            {stats.totalLogouts}
          </div>
          <div className="text-[11px] text-slate-400 truncate" title={`Last logout: ${stats.lastLogoutTime}`}>
            {stats.lastLogoutTime ? `Last: ${stats.lastLogoutTime}` : 'Simulated counter'}
          </div>
        </div>
      </div>

      {/* Middle Grid: Active Demo User Profile + System Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Demo Presenter Profile</span>
              </h3>
              <span className="text-[10px] font-semibold text-slate-500 uppercase font-mono">
                Simulated Auth
              </span>
            </div>

            {isLoggedIn && activeUser ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <img
                    src={activeUser.avatarUrl}
                    alt={activeUser.name}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-cyan-500/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-base font-bold text-white truncate">
                      {activeUser.name}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {activeUser.email}
                    </div>
                    <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Demo Admin • Active</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50">
                    <span className="text-slate-400">Current Role</span>
                    <span className="font-semibold text-white">Student / Presenter</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50">
                    <span className="text-slate-400">Client Persistence</span>
                    <span className="font-mono text-cyan-400">localStorage</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50">
                    <span className="text-slate-400">Security Requirement</span>
                    <span className="text-slate-300">None (Simulation Only)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <UserX className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">No User Logged In</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Click below to simulate login with your name.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  Log In to Demo Account
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Demonstration Environment</span>
            <span className="text-emerald-400 font-mono">Ready for Evaluation</span>
          </div>
        </div>

        {/* Project Architecture & College Evaluation Metadata */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Project Technical Specifications & Features</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Weatherise Evaluation Spec
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/70 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <CloudSun className="w-4 h-4 text-amber-400" />
                  <span>Real Weather Telemetry</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Open-Meteo verified meteorological API with no fake weather data. Latitude & longitude live resolution.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/70 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Interactive Map & Radar</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Leaflet.js interactive world map with click-to-weather resolution, radar layers, and coordinate geocoding.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/70 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>AI Weather Assistant</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Server-side Express proxy with Gemini model and graceful meteorological fallback logic.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/70 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Validation & Error Guardrails</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Numeric city input detection popup, empty query validation, and localStorage persistence.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-200">Demonstration Notice:</span> All authentication stats, login/logout events, and user profiles are simulated locally for this academic project demo. No external user database is configured.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Recent Activity Timeline</span>
            </h3>
            <p className="text-xs text-slate-400">
              Real-time feed of authentication events and demonstration actions in this browser.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Live Local Sync Active</span>
          </div>
        </div>

        {/* Activity List */}
        <div className="space-y-2.5">
          {activities.length > 0 ? (
            activities.map((item, idx) => {
              const isLogin = item.type === 'login';
              return (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/50 hover:bg-slate-950/80 border border-slate-800/80 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isLogin
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      {isLogin ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        <span className="truncate">{item.action}</span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        User: <span className="text-slate-300 font-medium">{item.userName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        isLogin
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                      {item.timestamp}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No recent activity recorded yet.
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>Demonstration Data • College Project Presentation</span>
          <button
            type="button"
            onClick={onBackToWeather}
            className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer flex items-center gap-1"
          >
            <span>Return to Weather Forecast</span>
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>
      </div>

      {/* Number Error Popup Modal */}
      <NumberErrorModal
        isOpen={numberModal.isOpen}
        onClose={() => setNumberModal((prev) => ({ ...prev, isOpen: false }))}
        title={numberModal.title}
        message={numberModal.message}
      />
    </div>
  );
};
