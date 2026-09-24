import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Search,
  MapPin,
  Heart,
  Sparkles,
  User as UserIcon,
  LogOut,
  ChevronDown,
  X,
  Loader2,
  Bookmark,
  Check,
} from 'lucide-react';
import { LocationData, TempUnit, UserProfile } from '../types/weather.ts';
import { searchLocations } from '../services/weatherService.ts';

interface NavbarProps {
  currentLocation: LocationData;
  onSelectLocation: (location: LocationData) => void;
  onDetectCurrentLocation: () => void;
  isDetectingLocation: boolean;
  user: UserProfile | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  tempUnit: TempUnit;
  onToggleTempUnit: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenAiAssistant: () => void;
  isAiDrawerOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLocation,
  onSelectLocation,
  onDetectCurrentLocation,
  isDetectingLocation,
  user,
  onLogout,
  onOpenAuth,
  tempUnit,
  onToggleTempUnit,
  isFavorite,
  onToggleFavorite,
  onOpenAiAssistant,
  isAiDrawerOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFavoritesMenu, setShowFavoritesMenu] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const favoritesMenuRef = useRef<HTMLDivElement>(null);

  // Live search debouncing
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(searchQuery);
        setSearchResults(results);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        favoritesMenuRef.current &&
        !favoritesMenuRef.current.contains(e.target as Node)
      ) {
        setShowFavoritesMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (loc: LocationData) => {
    onSelectLocation(loc);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              WeatherFlow
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <span className="text-[10px] text-slate-400 block -mt-1 hidden sm:block">
              Precision Live Forecast
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-md mx-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search city, region, or coordinates..."
              className="w-full bg-slate-900/80 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl py-2 pl-9.5 pr-20 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 outline-none transition shadow-inner"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-500 hover:text-slate-300 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onDetectCurrentLocation}
                disabled={isDetectingLocation}
                title="Use Current Device Location"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition cursor-pointer disabled:opacity-50"
              >
                {isDetectingLocation ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                ) : (
                  <MapPin className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && (searchQuery.trim().length >= 2 || searchResults.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/80 overflow-hidden z-50 max-h-80 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  Searching global meteorological stations...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-1">
                  {searchResults.map((result, idx) => (
                    <button
                      key={`${result.name}-${result.latitude}-${idx}`}
                      type="button"
                      onClick={() => handleSelect(result)}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-800/80 flex items-center justify-between transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-slate-200 group-hover:text-white">
                            {result.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {[result.region, result.country].filter(Boolean).join(', ')}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {result.countryCode || ''}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  No matching locations found for "{searchQuery}".
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Temperature Unit Switcher */}
          <button
            type="button"
            onClick={onToggleTempUnit}
            title={`Switch to ${tempUnit === 'celsius' ? 'Fahrenheit' : 'Celsius'}`}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
          >
            <span className={tempUnit === 'celsius' ? 'text-cyan-400' : 'text-slate-500'}>°C</span>
            <span className="text-slate-600">/</span>
            <span className={tempUnit === 'fahrenheit' ? 'text-cyan-400' : 'text-slate-500'}>°F</span>
          </button>

          {/* Pin / Favorite Current City */}
          <button
            type="button"
            onClick={onToggleFavorite}
            title={isFavorite ? 'Remove from saved locations' : 'Save location to favorites'}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isFavorite
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-slate-700'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-400' : ''}`} />
          </button>

          {/* Saved Favorites Drawer Trigger */}
          {user && (user.savedLocations?.length ?? 0) > 0 && (
            <div ref={favoritesMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowFavoritesMenu(!showFavoritesMenu)}
                title="Saved Locations"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 transition cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span>Saved ({user.savedLocations.length})</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showFavoritesMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Saved Locations
                  </div>
                  {user.savedLocations.map((loc) => {
                    const isSelected =
                      loc.name.toLowerCase() === currentLocation.name.toLowerCase();
                    return (
                      <button
                        key={`${loc.name}-${loc.latitude}`}
                        type="button"
                        onClick={() => {
                          onSelectLocation(loc);
                          setShowFavoritesMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-800/80 flex items-center justify-between text-xs transition cursor-pointer group"
                      >
                        <span className="font-medium text-slate-200 group-hover:text-white truncate">
                          {loc.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* AI Meteorologist Chat Assistant Trigger */}
          <button
            type="button"
            onClick={onOpenAiAssistant}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
              isAiDrawerOpen
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border-cyan-900/60 text-cyan-300 hover:border-cyan-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="hidden md:inline">Ask AI</span>
          </button>

          {/* User Account / Profile */}
          <div ref={userMenuRef} className="relative">
            {user ? (
              <div>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition cursor-pointer"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover border border-slate-700"
                  />
                  <span className="text-xs font-medium text-slate-200 hidden lg:inline max-w-[90px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-3 text-slate-200">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-10 h-10 rounded-xl object-cover border border-cyan-500/40"
                      />
                      <div className="overflow-hidden">
                        <div className="text-sm font-semibold truncate text-white">
                          {user.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div className="py-2 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400 px-1 py-1">
                        <span>Pinned Cities</span>
                        <span className="font-mono text-cyan-400 font-semibold">
                          {user.savedLocations.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 px-1 py-1">
                        <span>Preferred Unit</span>
                        <span className="font-mono text-slate-300 uppercase">
                          °{tempUnit === 'celsius' ? 'C' : 'F'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenAuth();
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg flex items-center gap-2 transition cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                        Switch Account / Login
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-cyan-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
