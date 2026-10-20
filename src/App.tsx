import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  Compass,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  Info,
  X,
  LayoutDashboard,
  CloudSun,
  CheckCircle2,
  Settings,
  Sliders,
} from 'lucide-react';
import {
  AirQualityData,
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  LocationData,
  TempUnit,
  UserProfile,
} from './types/weather.ts';
import {
  DEFAULT_LOCATIONS,
  fetchAirQualityData,
  fetchWeatherData,
  reverseGeocode,
} from './services/weatherService.ts';
import {
  clearUserSession,
  getStoredUser,
  saveUserSession,
  toggleFavoriteLocation,
} from './services/authService.ts';
import {
  getDemoUser,
  recordDemoLogout,
} from './services/demoAdminService.ts';
import {
  ThemeMode,
  applyTheme,
  getStoredThemeColor,
  getStoredThemeMode,
  saveThemeColor,
  saveThemeMode,
  getStoredBackgroundImage,
  getStoredBackgroundOpacity,
  saveBackgroundImage,
  saveBackgroundOpacity,
  resolveWallpaperUrl,
} from './services/themeService.ts';
import { saveRecentSearch } from './services/geocodingService.ts';
import { Navbar } from './components/Navbar.tsx';
import { CurrentWeatherHero } from './components/CurrentWeatherHero.tsx';
import { LocationDetailsCard } from './components/LocationDetailsCard.tsx';
import { HourlyForecast } from './components/HourlyForecast.tsx';
import { DailyForecast } from './components/DailyForecast.tsx';
import { WeatherMetricsGrid } from './components/WeatherMetricsGrid.tsx';
import { SunMoonCycle } from './components/SunMoonCycle.tsx';
import { WeatherRadarMap } from './components/WeatherRadarMap.tsx';
import { WeatherIntelligenceCard } from './components/WeatherIntelligenceCard.tsx';
import { AiWeatherAssistant } from './components/AiWeatherAssistant.tsx';
import { DemoLoginModal } from './components/DemoLoginModal.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { SettingsPage } from './components/SettingsPage.tsx';
import { FavoritesModal } from './components/FavoritesModal.tsx';

export default function App() {
  // Navigation View: 'weather', 'admin', or 'settings'
  const [currentTab, setCurrentTab] = useState<'weather' | 'admin' | 'settings'>('weather');

  // Theme & Appearance State (Dark / Light Mode & 10 Accent Colors)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredThemeMode());
  const [themeColor, setThemeColor] = useState<string>(() => getStoredThemeColor());
  const [bgImage, setBgImage] = useState<string>(() => getStoredBackgroundImage());
  const [bgOpacity, setBgOpacity] = useState<number>(() => getStoredBackgroundOpacity());

  // Authentication State
  const [user, setUser] = useState<UserProfile | null>(() => getDemoUser() || getStoredUser());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Welcome Toast Notification for demo presentation
  const [welcomeToast, setWelcomeToast] = useState<{
    show: boolean;
    message: string;
    subMessage?: string;
  }>({
    show: false,
    message: '',
  });

  // Active Location & Weather State
  const [currentLocation, setCurrentLocation] = useState<LocationData>(() => {
    const stored = getDemoUser() || getStoredUser();
    if (stored?.savedLocations && stored.savedLocations.length > 0) {
      return stored.savedLocations[0];
    }
    return DEFAULT_LOCATIONS[0]; // Default location (San Francisco)
  });

  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyForecastItem[]>([]);
  const [daily, setDaily] = useState<DailyForecastItem[]>([]);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Unit preferences
  const [tempUnit, setTempUnit] = useState<TempUnit>(() => {
    return user?.preferredUnit || 'celsius';
  });

  // Load weather data for given coordinates
  const loadForecast = useCallback(
    async (loc: LocationData, isManualRefresh = false) => {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);
      setErrorMessage(null);

      try {
        const [weatherRes, aqiRes] = await Promise.all([
          fetchWeatherData(loc.latitude, loc.longitude, loc.timezone),
          fetchAirQualityData(loc.latitude, loc.longitude),
        ]);

        setWeather(weatherRes.current);
        setHourly(weatherRes.hourly);
        setDaily(weatherRes.daily);
        setAirQuality(aqiRes);
        setLastUpdated(new Date());
      } catch (err: any) {
        setErrorMessage(
          err.message || 'Unable to retrieve live forecast. Please check your connection.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  // Auto-detect user GPS on initial load or on demand
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationNotice('Geolocation is not supported by your browser. Please search manually.');
      return;
    }

    setIsDetectingLocation(true);
    setLocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const detectedLoc = await reverseGeocode(latitude, longitude);
          detectedLoc.isCurrentLocation = true;
          saveRecentSearch(detectedLoc);
          setCurrentLocation(detectedLoc);
          loadForecast(detectedLoc);
        } catch (_e) {
          // Handled gracefully
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (_err) => {
        setIsDetectingLocation(false);
        setLocationNotice(
          'Location permission was not granted. You can search any city, town, village, or coordinates in the search bar above.',
        );
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  }, [loadForecast]);

  // Initial load
  useEffect(() => {
    loadForecast(currentLocation);
  }, []);

  // Dismiss notification after 8 seconds
  useEffect(() => {
    if (locationNotice) {
      const timer = setTimeout(() => setLocationNotice(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [locationNotice]);

  // Dismiss welcome toast after 5 seconds
  useEffect(() => {
    if (welcomeToast.show) {
      const timer = setTimeout(() => {
        setWelcomeToast({ show: false, message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [welcomeToast.show]);

  // Global listener for auth sync (e.g., from Admin Dashboard quick login/logout)
  useEffect(() => {
    const handleAuthChange = (e: any) => {
      setUser(e.detail || null);
    };
    window.addEventListener('weatherise:auth_change', handleAuthChange);
    return () => window.removeEventListener('weatherise:auth_change', handleAuthChange);
  }, []);

  // Initialize and keep theme in sync
  useEffect(() => {
    applyTheme(themeMode, themeColor);
  }, [themeMode, themeColor]);

  // Global listener for theme changes
  useEffect(() => {
    const handleThemeEvent = (e: any) => {
      if (e.detail?.mode) setThemeMode(e.detail.mode);
      if (e.detail?.colorId) setThemeColor(e.detail.colorId);
    };
    window.addEventListener('weatherise:theme_change', handleThemeEvent);
    return () => window.removeEventListener('weatherise:theme_change', handleThemeEvent);
  }, []);

  const handleSelectLocation = (newLoc: LocationData) => {
    saveRecentSearch(newLoc);
    setCurrentLocation(newLoc);
    loadForecast(newLoc);
    if (currentTab !== 'weather') {
      setCurrentTab('weather');
    }
  };

  const handleToggleTempUnit = () => {
    setTempUnit((prev) => {
      const next = prev === 'celsius' ? 'fahrenheit' : 'celsius';
      if (user) {
        const updatedUser: UserProfile = { ...user, preferredUnit: next };
        saveUserSession(updatedUser);
        setUser(updatedUser);
      }
      return next;
    });
  };

  const handleToggleFavorite = () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    const { user: updatedUser } = toggleFavoriteLocation(user, currentLocation);
    setUser(updatedUser);
  };

  const isFavoriteCurrent = Boolean(
    user?.savedLocations?.some(
      (loc) =>
        loc.name.toLowerCase() === currentLocation.name.toLowerCase() ||
        (Math.abs(loc.latitude - currentLocation.latitude) < 0.05 &&
          Math.abs(loc.longitude - currentLocation.longitude) < 0.05),
    ),
  );

  // Handle successful demo login (Feature 1)
  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    setTempUnit(loggedInUser.preferredUnit || 'celsius');
    setIsAuthOpen(false);

    // Feature 1: "Welcome, <Name>!" message
    setWelcomeToast({
      show: true,
      message: `Welcome, ${loggedInUser.name}!`,
      subMessage: 'Demo session active • College project demonstration',
    });

    if (loggedInUser.savedLocations && loggedInUser.savedLocations.length > 0) {
      if (!currentLocation.isCurrentLocation) {
        handleSelectLocation(loggedInUser.savedLocations[0]);
      }
    }
  };

  // Handle demo logout (Feature 1)
  const handleLogout = () => {
    recordDemoLogout();
    clearUserSession();
    setUser(null);

    setWelcomeToast({
      show: true,
      message: 'Logged out successfully',
      subMessage: 'Demo login state cleared from browser session',
    });
  };

  return (
    <div
      className={`relative min-h-screen flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-200 ${
        themeMode === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Dynamic Full-Screen Background Wallpaper */}
      {bgImage && bgImage !== 'none' && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-all duration-700">
          <img
            src={resolveWallpaperUrl(bgImage)}
            alt="Weatherwise Atmospheric Wallpaper"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('bg_aurora')) {
                target.src = '/images/bg_aurora.jpg';
              }
            }}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000"
          />
          {/* Adaptive overlay to guarantee pristine readability for all text & cards */}
          <div
            className={`absolute inset-0 transition-colors duration-500 ${
              themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-950'
            }`}
            style={{
              opacity: bgOpacity,
            }}
          />
        </div>
      )}

      {/* Top Navigation */}
      <div className="relative z-20">
        <Navbar
        currentLocation={currentLocation}
        onSelectLocation={handleSelectLocation}
        onDetectCurrentLocation={detectLocation}
        isDetectingLocation={isDetectingLocation}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAdmin={() => setCurrentTab('admin')}
        onOpenSettings={() => setCurrentTab('settings')}
        onNavigateToWeather={() => setCurrentTab('weather')}
        activeTab={currentTab}
        tempUnit={tempUnit}
        onToggleTempUnit={handleToggleTempUnit}
        isFavorite={isFavoriteCurrent}
        onToggleFavorite={handleToggleFavorite}
        onOpenAiAssistant={() => setIsAiDrawerOpen(true)}
        isAiDrawerOpen={isAiDrawerOpen}
      />
      </div>

      {/* Floating Welcome & Notification Toast (Feature 1) */}
      {welcomeToast.show && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 p-4 rounded-3xl bg-slate-900/95 border border-cyan-500/50 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl flex items-center gap-3.5 text-white max-w-sm animate-in slide-in-from-top-4 duration-200">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/25">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-white truncate">
              {welcomeToast.message}
            </div>
            {welcomeToast.subMessage && (
              <div className="text-xs text-slate-400 truncate">
                {welcomeToast.subMessage}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setWelcomeToast({ show: false, message: '' })}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Notice for denied geolocation */}
        {locationNotice && (
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{locationNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setLocationNotice(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => loadForecast(currentLocation, true)}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* View Routing: Admin Dashboard, Settings Page, or Live Weather Forecast */}
        {currentTab === 'admin' ? (
          <AdminDashboard
            user={user}
            onBackToWeather={() => setCurrentTab('weather')}
            onOpenLogin={() => setIsAuthOpen(true)}
            onLogout={handleLogout}
          />
        ) : currentTab === 'settings' ? (
          <SettingsPage
            onBackToWeather={() => setCurrentTab('weather')}
            currentMode={themeMode}
            currentColorId={themeColor}
            onThemeModeChange={(m) => {
              setThemeMode(m);
              saveThemeMode(m);
            }}
            onThemeColorChange={(c) => {
              setThemeColor(c);
              saveThemeColor(c);
            }}
            currentBgImage={bgImage}
            onBgImageChange={(img) => {
              setBgImage(img);
              saveBackgroundImage(img);
            }}
            bgOpacity={bgOpacity}
            onBgOpacityChange={(op) => {
              setBgOpacity(op);
              saveBackgroundOpacity(op);
            }}
            tempUnit={tempUnit}
            onToggleTempUnit={handleToggleTempUnit}
          />
        ) : (
          /* Live Weather Forecast View (Preserves all existing features) */
          <>
            {/* View Switcher Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-cyan-400" />
                <h1 className="font-semibold text-white">Weatherwise -weather forcasting application</h1>
                <span className="hidden sm:inline text-slate-500">• Worldwide Telemetry</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentTab('settings')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition cursor-pointer border border-slate-700/60 flex items-center gap-1.5 shadow-sm"
                  title="Configure dark/light mode and 10 colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Settings & Themes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTab('admin')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-300 hover:text-white font-semibold transition cursor-pointer border border-slate-700/60 flex items-center gap-1.5 shadow-sm"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Go to Admin Dashboard</span>
                </button>
              </div>
            </div>

            {/* Loading Skeleton */}
            {isLoading && !weather ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-64 sm:h-80 bg-slate-900/60 rounded-3xl border border-slate-800/80" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-28 bg-slate-900/40 rounded-2xl border border-slate-800/60"
                    />
                  ))}
                </div>
                <div className="h-44 bg-slate-900/40 rounded-3xl border border-slate-800/60" />
              </div>
            ) : weather && airQuality ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* 1. Hero Current Weather Section */}
                <CurrentWeatherHero
                  location={currentLocation}
                  weather={weather}
                  airQuality={airQuality}
                  tempUnit={tempUnit}
                  lastUpdated={lastUpdated}
                  isRefreshing={isRefreshing}
                  onRefresh={() => loadForecast(currentLocation, true)}
                />

                {/* 2. Location Metadata & Astronomical Information */}
                <LocationDetailsCard
                  location={currentLocation}
                />

                {/* 3. Real-Time Atmospheric Metrics Grid (Pressure, Humidity, Wind, UV, Visibility, Cloud) */}
                <WeatherMetricsGrid
                  weather={weather}
                  airQuality={airQuality}
                  tempUnit={tempUnit}
                />

                {/* 4. AI Weather Intelligence & Practical Recommendations */}
                <WeatherIntelligenceCard
                  location={currentLocation}
                  weather={weather}
                  airQuality={airQuality}
                  daily={daily}
                  onOpenChat={() => setIsAiDrawerOpen(true)}
                />

                {/* 5. 24-Hour Hourly Weather Forecast */}
                <HourlyForecast
                  hourly={hourly}
                  tempUnit={tempUnit}
                />

                {/* 6. 7-Day Extended Daily Forecast */}
                <DailyForecast daily={daily} tempUnit={tempUnit} />

                {/* 7. Interactive World Weather Radar & Map (Click to Inspect Any Global Coordinate) */}
                <WeatherRadarMap
                  location={currentLocation}
                  weather={weather}
                  tempUnit={tempUnit}
                  onLocationSelect={handleSelectLocation}
                />

                {/* 8. Astronomical Sun & Moon Cycles */}
                <SunMoonCycle weather={weather} />
              </div>
            ) : null}
          </>
        )}
      </main>

      {/* Website Footer */}
      <footer className="relative z-10 w-full border-t border-slate-800/80 bg-slate-950/90 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">Weatherwise -weather forcasting application</span>
            <span>• College Project Demonstration</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <button
              type="button"
              onClick={() => setCurrentTab('settings')}
              className="hover:text-cyan-400 transition cursor-pointer"
            >
              Settings & Themes
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setCurrentTab('admin')}
              className="hover:text-cyan-400 transition cursor-pointer"
            >
              Admin Dashboard
            </button>
            <span>·</span>
            <span>Open-Meteo Verified Telemetry</span>
            <span>·</span>
            <span>Simulated Local Auth</span>
          </div>
        </div>
      </footer>

      {/* AI Meteorologist Chat Drawer */}
      {weather && airQuality && (
        <AiWeatherAssistant
          location={currentLocation}
          weather={weather}
          airQuality={airQuality}
          daily={daily}
          isOpen={isAiDrawerOpen}
          onClose={() => setIsAiDrawerOpen(false)}
        />
      )}

      {/* Feature 1: Demo Login Popup Modal with High-Clarity Background Image */}
      <DemoLoginModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        bgImage={bgImage}
        onBgImageChange={(newBg) => setBgImage(newBg)}
        themeMode={themeMode}
      />

      {/* Feature 1: Profile View Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onLogout={handleLogout}
        onOpenAdmin={() => {
          setIsProfileOpen(false);
          setCurrentTab('admin');
        }}
      />

      {/* Saved Favorites Manager Modal */}
      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        user={user}
        onSelectLocation={handleSelectLocation}
        onRemoveLocation={(loc) => {
          if (user) {
            const { user: updated } = toggleFavoriteLocation(user, loc);
            setUser(updated);
          }
        }}
        onAddLocation={(loc) => {
          if (user) {
            const { user: updated } = toggleFavoriteLocation(user, loc);
            setUser(updated);
          }
        }}
        currentLocation={currentLocation}
      />
    </div>
  );
}
