import React from 'react';
import { Bookmark, MapPin, Trash2, X, Plus, ExternalLink } from 'lucide-react';
import { LocationData, TempUnit, UserProfile } from '../types/weather.ts';
import { DEFAULT_LOCATIONS } from '../services/weatherService.ts';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSelectLocation: (location: LocationData) => void;
  onRemoveLocation: (location: LocationData) => void;
  onAddLocation: (location: LocationData) => void;
  currentLocation: LocationData;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  user,
  onSelectLocation,
  onRemoveLocation,
  onAddLocation,
  currentLocation,
}) => {
  if (!isOpen) return null;

  const saved = user?.savedLocations || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Saved Locations</h2>
              <p className="text-xs text-slate-400">Quickly monitor your favorite global destinations</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {saved.length > 0 ? (
            saved.map((loc) => {
              const isSelected =
                loc.name.toLowerCase() === currentLocation.name.toLowerCase();
              return (
                <div
                  key={`${loc.name}-${loc.latitude}`}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/30 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectLocation(loc);
                      onClose();
                    }}
                    className="flex-1 text-left flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-800/80 flex items-center justify-center text-cyan-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        {loc.name}
                        {isSelected && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                            VIEWING
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {[loc.region, loc.country].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveLocation(loc)}
                    title="Remove from saved"
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No saved locations yet. Pin cities by clicking the heart icon in the navigation bar!
            </div>
          )}

          {/* Suggested Cities */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Suggested Metropolises
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_LOCATIONS.map((city) => {
                const alreadySaved = saved.some(
                  (s) => s.name.toLowerCase() === city.name.toLowerCase(),
                );
                return (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => {
                      if (!alreadySaved) onAddLocation(city);
                      onSelectLocation(city);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/80 border border-slate-800/60 text-left text-xs transition cursor-pointer flex items-center justify-between group"
                  >
                    <span className="font-medium text-slate-200 group-hover:text-white truncate">
                      {city.name}
                    </span>
                    {!alreadySaved && (
                      <Plus className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
