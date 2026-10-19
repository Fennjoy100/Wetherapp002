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
  History,
  Trash2,
  Navigation,
  LayoutDashboard,
  GraduationCap,
  Settings,
} from 'lucide-react';
import { LocationData, TempUnit, UserProfile } from '../types/weather.ts';
import {
  searchWorldwideLocations,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
} from '../services/geocodingService.ts';
import { NumberErrorModal } from './NumberErrorModal.tsx';

interface NavbarProps {
  currentLocation: LocationData;
  onSelectLocation: (location: LocationData) => void;
  onDetectCurrentLocation: () => void;
  isDetectingLocation: boolean;
  user: UserProfile | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenProfile?: () => void;
  onOpenAdmin?: () => void;
  onOpenSettings?: () => void;
  onNavigateToWeather?: () => void;
  activeTab?: 'weather' | 'admin' | 'settings';
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
  onOpenProfile,
  onOpenAdmin,
  onOpenSettings,
  onNavigateToWeather,
  activeTab = 'weather',
  tempUnit,
  onToggleTempUnit,
  isFavorite,
  onToggleFavorite,
  onOpenAiAssistant,
  isAiDrawerOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [recentSearches, setRecentSearches] = useState<LocationData[]>(() => getRecentSearches());
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFavoritesMenu, setShowFavoritesMenu] = useState(false);

  // Number validation error popup state (Feature 3)
  const [numberModal, setNumberModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: 'Invalid City Name',
    message: 'Please enter a valid city name, not a number.',
  });

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const favoritesMenuRef = useRef<HTMLDivElement>(null);

  // Refresh recent searches from storage when menu opens
  const refreshRecentSearches = () => {
    setRecentSearches(getRecentSearches());
  };

  // Live search debouncing for worldwide locations
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSelectedIndex(-1);
      return;
    }

    // Number validation check: if ONLY numbers, do NOT call the weather / geocoding API
    if (/^\d+$/.test(q)) {
      setSearchResults([]);
      setIsSearching(false);
      setSelectedIndex(-1);
      return;
    }

    setIsSearching(true);
    setSelectedIndex(-1);
    const timer = setTimeout(async () => {
      try {
        const results = await searchWorldwideLocations(q);
        setSearchResults(results);
      } catch (_e) {
        setSearchResults([]);
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
    saveRecentSearch(loc);
    refreshRecentSearches();
    onSelectLocation(loc);
    setSearchQuery('');
    setIsSearchOpen(false);
    setSelectedIndex(-1);
  };

  // Perform validation on user search query (Feature 3)
  const validateAndExecuteSearch = async () => {
    const trimmed = searchQuery.trim();

    // 1. Empty field validation
    if (!trimmed) {
      setNumberModal({
        isOpen: true,
        title: 'Search Field Empty',
        message: 'Please enter a valid city or location name to search.',
      });
      return;
    }

    // 2. Only numbers validation (e.g. "12345")
    if (/^\d+$/.test(trimmed)) {
      setNumberModal({
        isOpen: true,
        title: 'Invalid City Name',
        message: 'Please enter a valid city name, not a number.',
      });
      // Do not call weather API
      return;
    }

    // 3. Valid city name (e.g. Chennai, London, Tokyo, Sector 17)
    setIsSearchOpen(false);
    if (searchResults.length > 0) {
      handleSelect(searchResults[0]);
    } else {
      setIsSearching(true);
      try {
        const results = await searchWorldwideLocations(trimmed);
        if (results && results.length > 0) {
          handleSelect(results[0]);
        } else {
          setSearchResults([]);
          setIsSearchOpen(true);
        }
      } catch (_e) {
        // Handled gracefully
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Keyboard navigation for search dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = searchQuery.trim();

      // Validate empty field
      if (!trimmed) {
        setNumberModal({
          isOpen: true,
          title: 'Search Field Empty',
          message: 'Please enter a valid city or location name to search.',
        });
        return;
      }

      // Validate number-only input (Feature 3)
      if (/^\d+$/.test(trimmed)) {
        setNumberModal({
          isOpen: true,
          title: 'Invalid City Name',
          message: 'Please enter a valid city name, not a number.',
        });
        return;
      }

      const items = searchResults.length > 0 ? searchResults : recentSearches;
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        handleSelect(items[selectedIndex]);
      } else if (searchResults.length > 0) {
        handleSelect(searchResults[0]);
      } else {
        validateAndExecuteSearch();
      }
      return;
    }

    if (!isSearchOpen) return;
    const items = searchQuery.trim().length >= 2 ? searchResults : recentSearches;
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  const handleClearRecents = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentSearches();
    setRecentSearches([]);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & College Demo Subtitle */}
          <button
            type="button"
            onClick={onNavigateToWeather || (activeTab === 'admin' ? onOpenAdmin : undefined)}
            className="flex items-center gap-3 shrink-0 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5 leading-snug">
                Weatherwise -weather forcasting application
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5 hidden md:flex items-center gap-1">
                <span>Worldwide Weather & Live Radar</span>
                <span className="text-cyan-400 font-semibold">• College Project Demo</span>
              </span>
            </div>
          </button>

          {/* Global Search Bar with Number Validation Guardrail */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-md mx-2">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => {
                  refreshRecentSearches();
                  setIsSearchOpen(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search city, town, village, or coordinates..."
                className="w-full bg-slate-900/80 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl py-2 pl-9.5 pr-28 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 outline-none transition shadow-inner"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedIndex(-1);
                      inputRef.current?.focus();
                    }}
                    className="p-1 text-slate-500 hover:text-slate-300 rounded cursor-pointer"
                    title="Clear input"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Explicit Search Button (validates numbers / empty before calling API) */}
                <button
                  type="button"
                  onClick={validateAndExecuteSearch}
                  className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                  title="Search location"
                >
                  <Search className="w-3 h-3" />
                  <span className="hidden sm:inline">Search</span>
                </button>

                {/* Device Location Button */}
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
                    <Navigation className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Autocomplete & Recent Searches Dropdown */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-50 max-h-96 overflow-y-auto">
                {searchQuery.trim().length >= 2 ? (
                  /* Search Results View */
                  isSearching ? (
                    <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      Searching global meteorological stations & geocoding...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-1">
                      <div className="px-4 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800/80 flex items-center justify-between">
                        <span>Worldwide Matches ({searchResults.length})</span>
                        <span className="text-[9px] text-slate-600">Select to view forecast</span>
                      </div>
                      {searchResults.map((result, idx) => {
                        const isFocused = selectedIndex === idx;
                        const latStr = `${Math.abs(result.latitude).toFixed(2)}°${result.latitude >= 0 ? 'N' : 'S'}`;
                        const lonStr = `${Math.abs(result.longitude).toFixed(2)}°${result.longitude >= 0 ? 'E' : 'W'}`;
                        return (
                          <button
                            key={`${result.name}-${result.latitude}-${result.longitude}-${idx}`}
                            type="button"
                            onClick={() => handleSelect(result)}
                            className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition cursor-pointer group ${
                              isFocused ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/80 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <MapPin className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition shrink-0" />
                              <div className="min-w-0">
                                <div className="text-sm font-semibold truncate text-white">
                                  {result.name}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                  {[result.region, result.country].filter(Boolean).join(', ')}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end shrink-0 pl-2">
                              <span className="text-[10px] text-emerald-400 font-mono">
                                {latStr}, {lonStr}
                              </span>
                              {result.countryCode && (
                                <span className="text-[9px] text-slate-500 font-mono uppercase">
                                  {result.countryCode}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                      <div>No matching locations found for "{searchQuery}".</div>
                      <div className="text-[11px] text-slate-500">
                        Try searching by city, town, country, zip code, or latitude, longitude.
                      </div>
                    </div>
                  )
                ) : (
                  /* Recent Searches View */
                  <div>
                    <div className="px-4 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-cyan-400" /> Recent Searches
                      </span>
                      {recentSearches.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearRecents}
                          className="text-[10px] text-rose-400 hover:text-rose-300 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Clear
                        </button>
                      )}
                    </div>

                    {recentSearches.length > 0 ? (
                      <div className="py-1">
                        {recentSearches.map((item, idx) => {
                          const isFocused = selectedIndex === idx;
                          return (
                            <button
                              key={`recent-${item.name}-${item.latitude}-${idx}`}
                              type="button"
                              onClick={() => handleSelect(item)}
                              className={`w-full px-4 py-2 text-left flex items-center justify-between text-xs transition cursor-pointer ${
                                isFocused ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/80 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <History className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="font-medium truncate">{item.name}</span>
                                <span className="text-slate-500 text-[11px] truncate">
                                  {[item.region, item.country].filter(Boolean).join(', ')}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 shrink-0 pl-2">
                                {item.latitude.toFixed(1)}°, {item.longitude.toFixed(1)}°
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No recent searches yet. Search any city, town, or coordinates above.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Admin Dashboard Trigger */}
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                title="Open Simulated Admin Dashboard (College Demo)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Admin Dashboard</span>
              </button>
            )}

            {/* Direct Settings Trigger */}
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                title="Open Settings (Dark/Light Mode & 10 Theme Colors)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}

            {/* Temperature Unit Switcher */}
            <button
              type="button"
              onClick={onToggleTempUnit}
              title={`Switch to ${tempUnit === 'celsius' ? 'Fahrenheit' : 'Celsius'}`}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
            >
              <span className={tempUnit === 'celsius' ? 'text-cyan-400 font-bold' : 'text-slate-500'}>°C</span>
              <span className="text-slate-600">/</span>
              <span className={tempUnit === 'fahrenheit' ? 'text-cyan-400 font-bold' : 'text-slate-500'}>°F</span>
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

            {/* Saved Favorites Trigger */}
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

            {/* Feature 1: Demo Login / User Profile Dropdown */}
            <div ref={userMenuRef} className="relative">
              {user ? (
                /* Logged In State: Button shows user's name and profile icon */
                <div>
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 pl-2.5 pr-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition cursor-pointer shadow-sm"
                  >
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 max-w-[100px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </button>

                  {/* Dropdown Menu with: Profile, Admin Dashboard, Logout */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2.5 border-b border-slate-800 mb-1 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{user.name}</div>
                          <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Logged In (Demo)</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {/* Option 1: Profile */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            if (onOpenProfile) onOpenProfile();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl flex items-center gap-2 transition cursor-pointer"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Profile</span>
                        </button>

                        {/* Option 2: Admin Dashboard */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            if (onOpenAdmin) onOpenAdmin();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl flex items-center gap-2 transition cursor-pointer"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Admin Dashboard</span>
                        </button>

                        {/* Option 2.5: Settings */}
                        {onOpenSettings && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserMenu(false);
                              onOpenSettings();
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl flex items-center gap-2 transition cursor-pointer"
                          >
                            <Settings className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Settings</span>
                          </button>
                        )}

                        {/* Option 3: Logout */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            onLogout();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl flex items-center gap-2 transition cursor-pointer border-t border-slate-800/60 mt-1 pt-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Logged Out State: Clean Login button */
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Feature 3: Number Input Error Popup Modal */}
      <NumberErrorModal
        isOpen={numberModal.isOpen}
        onClose={() => setNumberModal((prev) => ({ ...prev, isOpen: false }))}
        title={numberModal.title}
        message={numberModal.message}
      />
    </>
  );
};
