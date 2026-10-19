import React from 'react';
import {
  User as UserIcon,
  X,
  Shield,
  LogOut,
  Calendar,
  Sparkles,
  LayoutDashboard,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import { UserProfile } from '../types/weather.ts';
import { getDemoStats } from '../services/demoAdminService.ts';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  onOpenAdmin,
}) => {
  if (!isOpen || !user) return null;

  const stats = getDemoStats();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-cyan-950/40 p-6 sm:p-7 overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        {/* Glow ambient background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-44 bg-gradient-to-r from-cyan-500/20 via-blue-600/20 to-indigo-600/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Profile Section */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 id="profile-modal-title" className="text-xl font-bold tracking-tight text-white truncate">
                {user.name}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Logged In
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              {user.email}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 mt-0.5">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>College Project Demo Presenter</span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Active Session
            </span>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Authenticated</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">Saved in localStorage</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Total Logins
            </span>
            <div className="text-sm font-bold text-cyan-400">
              {stats.totalLogins} Logins
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">Demo Counter</span>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200/90 mb-6 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold text-white">Demonstration Account</div>
            <div className="text-[11px] text-slate-300">
              Your session is active for this college project presentation. All activity is logged locally in the Admin Dashboard.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAdmin();
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Open Admin Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout from Demo Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
