import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  Compass,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
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
  createGuestUser,
} from './services/authService.ts';
import { Navbar } from './components/Navbar.tsx';
import { CurrentWeatherHero } from './components/CurrentWeatherHero.tsx';
import { HourlyForecast } from './components/HourlyForecast.tsx';
import { DailyForecast } from './components/DailyForecast.tsx';
import { WeatherMetricsGrid } from './components/WeatherMetricsGrid.tsx';
import { SunMoonCycle } from './components/SunMoonCycle.tsx';
import { WeatherRadarMap } from './components/WeatherRadarMap.tsx';
import { WeatherIntelligenceCard } from './components/WeatherIntelligenceCard.tsx';
import { AiWeatherAssistant } from './components/AiWeatherAssistant.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { FavoritesModal } from './components/FavoritesModal.tsx';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(() => !getStoredUser());
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Active Location & Weather State
  const [currentLocation, setCurrentLocation] = useState<LocationData>(() => {
    const stored = getStoredUser();
    if (stored?.savedLocations && stored.savedLocations.length > 0) {
      return stored.savedLocations[0];
    }
    return DEFAULT_LOCATIONS[0]; // San Francisco default
  });

  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyForecastItem[]>([]);
  const [daily, setDaily] = useState<DailyForecastItem[]>([]);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
        console.error('Weather load error:', err);
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

  // Auto-detect user GPS on initial load
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const detectedLoc = await reverseGeocode(latitude, longitude);
          setCurrentLocation(detectedLoc);
          loadForecast(detectedLoc);
        } catch (e) {
          console.warn('Geolocation reverse geocoding failed:', e);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        console.warn('Geolocation access declined or unavailable:', err.message);
        setIsDetectingLocation(false);
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  }, [loadForecast]);

  // Initial load
  useEffect(() => {
    loadForecast(currentLocation);
    // Attempt device geolocation in background
    detectLocation();
  }, []);

  const handleSelectLocation = (newLoc: LocationData) => {
    setCurrentLocation(newLoc);
    loadForecast(newLoc);
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

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    setTempUnit(loggedInUser.preferredUnit || 'celsius');
    setIsAuthOpen(false);
    if (loggedInUser.savedLocations && loggedInUser.savedLocations.length > 0) {
      // Optional: switch to user's first saved location if current is default
      if (!currentLocation.isCurrentLocation) {
        handleSelectLocation(loggedInUser.savedLocations[0]);
      }
    }
  };

  const handleLogout = () => {
    clearUserSession();
    setUser(null);
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <Navbar
        currentLocation={currentLocation}
        onSelectLocation={handleSelectLocation}
        onDetectCurrentLocation={detectLocation}
        isDetectingLocation={isDetectingLocation}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        tempUnit={tempUnit}
        onToggleTempUnit={handleToggleTempUnit}
        isFavorite={isFavoriteCurrent}
        onToggleFavorite={handleToggleFavorite}
        onOpenAiAssistant={() => setIsAiDrawerOpen(true)}
        isAiDrawerOpen={isAiDrawerOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
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

        {/* Loading Skeleton */}
        {isLoading && !weather ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-64 sm:h-72 rounded-3xl bg-slate-900/60 border border-slate-800 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <span className="text-xs font-medium tracking-wide">
                  Calibrating Atmospheric Sensors...
                </span>
              </div>
            </div>
            <div className="h-44 rounded-3xl bg-slate-900/40 border border-slate-800" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 rounded-3xl bg-slate-900/40 border border-slate-800" />
              <div className="h-96 rounded-3xl bg-slate-900/40 border border-slate-800" />
            </div>
          </div>
        ) : weather && airQuality ? (
          <>
            {/* 1. Hero Weather presentation matching WeatherFlow */}
            <CurrentWeatherHero
              weather={weather}
              location={currentLocation}
              airQuality={airQuality}
              tempUnit={tempUnit}
              onRefresh={() => loadForecast(currentLocation, true)}
              isRefreshing={isRefreshing}
              lastUpdated={lastUpdated}
            />

            {/* 2. 24-Hour Hourly Forecast with trend chart */}
            <HourlyForecast hourly={hourly} tempUnit={tempUnit} />

            {/* 3. Two-Column Modular Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (7-Day Outlook & AI Meteorological Intelligence) */}
              <div className="lg:col-span-7 space-y-6">
                <DailyForecast daily={daily} tempUnit={tempUnit} />

                <WeatherIntelligenceCard
                  location={currentLocation}
                  weather={weather}
                  airQuality={airQuality}
                  daily={daily}
                  onOpenChat={() => setIsAiDrawerOpen(true)}
                />
              </div>

              {/* Right Column (Atmospheric Metrics Grid, Radar Map, Sun/Moon Arc) */}
              <div className="lg:col-span-5 space-y-6">
                <WeatherMetricsGrid
                  weather={weather}
                  airQuality={airQuality}
                  tempUnit={tempUnit}
                />

                <SunMoonCycle weather={weather} />

                <WeatherRadarMap
                  location={currentLocation}
                  weather={weather}
                  tempUnit={tempUnit}
                />
              </div>
            </div>
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>WeatherFlow Global Telemetry Active</span>
            <span className="text-slate-700">·</span>
            <span>Real-time WMO High-Resolution Models</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Open-Meteo & RainViewer APIs</span>
            <span>·</span>
            <span>Zero Config Required</span>
          </div>
        </div>
      </footer>

      {/* AI Meteorologist Chat & Intelligence Drawer */}
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

      {/* Login & Registration Portal Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
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
