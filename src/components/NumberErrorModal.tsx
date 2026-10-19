import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

interface NumberErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const NumberErrorModal: React.FC<NumberErrorModalProps> = ({
  isOpen,
  onClose,
  title = 'Invalid City Name',
  message = 'Please enter a valid city name, not a number.',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-rose-950/30 p-6 text-slate-100 overflow-hidden animate-in zoom-in-95 duration-150 text-center"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="number-error-title"
      >
        {/* Ambient glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-32 bg-amber-500/15 blur-2xl pointer-events-none" />

        {/* Close 'X' */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
          <AlertTriangle className="w-7 h-7" />
        </div>

        {/* Title */}
        <h3 id="number-error-title" className="text-lg font-bold text-white mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
          {message}
        </p>

        {/* OK Button */}
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" />
          <span>OK</span>
        </button>
      </div>
    </div>
  );
};
