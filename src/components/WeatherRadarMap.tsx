import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Layers,
  Play,
  Pause,
  RotateCcw,
  MapPin,
  Crosshair,
  Radio,
  Sliders,
  Plus,
  Minus,
  CloudRain,
  Cloud,
  Thermometer,
  Wind,
  Globe,
  Loader2,
} from 'lucide-react';
import L from 'leaflet';
import { LocationData, CurrentWeather, TempUnit } from '../types/weather.ts';
import { formatTemp } from '../services/weatherService.ts';
import { reverseGeocodeLocation } from '../services/geocodingService.ts';

export type WeatherLayerType = 'radar' | 'satellite' | 'temperature' | 'wind';

interface WeatherRadarMapProps {
  location: LocationData;
  weather: CurrentWeather;
  tempUnit: TempUnit;
  onLocationSelect?: (location: LocationData) => void;
}

export const WeatherRadarMap: React.FC<WeatherRadarMapProps> = ({
  location,
  weather,
  tempUnit,
  onLocationSelect,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const clickMarkerRef = useRef<L.Marker | null>(null);
  const weatherLayerRef = useRef<L.TileLayer | null>(null);
  const basemapLayerRef = useRef<L.TileLayer | null>(null);

  const [radarTimestamps, setRadarTimestamps] = useState<number[]>([]);
  const [satelliteTimestamps, setSatelliteTimestamps] = useState<number[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeLayer, setActiveLayer] = useState<WeatherLayerType>('radar');
  const [showWeatherLayer, setShowWeatherLayer] = useState<boolean>(true);
  const [layerOpacity, setLayerOpacity] = useState<number>(0.75);
  const [basemapType, setBasemapType] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [isResolvingClick, setIsResolvingClick] = useState<boolean>(false);
  const [clickedCoord, setClickedCoord] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch live RainViewer radar and satellite frames
  useEffect(() => {
    let isMounted = true;
    async function loadRadarFrames() {
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.radar && data.radar.past) {
            const timestamps = data.radar.past.map((item: any) => item.time);
            if (data.radar.nowcast) {
              const nowcastTs = data.radar.nowcast.map((item: any) => item.time);
              timestamps.push(...nowcastTs);
            }
            setRadarTimestamps(timestamps);
            setCurrentFrameIndex(timestamps.length - 1);
          }
          if (data.satellite && data.satellite.infrared) {
            const satTs = data.satellite.infrared.map((item: any) => item.time);
            setSatelliteTimestamps(satTs);
          }
        }
      } catch (_err) {
        // Radar frames fallback
      }
    }
    loadRadarFrames();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update basemap tile layer
  const updateBasemap = useCallback((type: 'dark' | 'satellite' | 'streets') => {
    if (!mapInstanceRef.current) return;
    if (basemapLayerRef.current) {
      mapInstanceRef.current.removeLayer(basemapLayerRef.current);
    }

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let subdomains = 'abcd';
    let maxZoom = 19;

    if (type === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      subdomains = '';
      maxZoom = 18;
    } else if (type === 'streets') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      subdomains = 'abc';
      maxZoom = 19;
    }

    const newBasemap = L.tileLayer(url, {
      subdomains,
      maxZoom,
      zIndex: 1,
    });

    newBasemap.addTo(mapInstanceRef.current);
    basemapLayerRef.current = newBasemap;
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [location.latitude, location.longitude],
        zoom: 7,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: true,
      });

      // Default dark basemap
      const basemap = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          subdomains: 'abcd',
          maxZoom: 19,
          zIndex: 1,
        },
      ).addTo(map);
      basemapLayerRef.current = basemap;

      // Active location marker
      const customIcon = L.divIcon({
        className: 'custom-weather-marker',
        html: `
          <div style="
            background: #0ea5e9;
            color: white;
            padding: 5px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 16px rgba(14,165,233,0.5);
            border: 2px solid white;
            white-space: nowrap;
          ">
            <span>📍 ${location.name}</span>
            <span style="background: rgba(0,0,0,0.35); padding: 2px 6px; border-radius: 6px;">${formatTemp(
              weather.temperature,
              tempUnit,
            )}</span>
          </div>
        `,
        iconSize: [120, 32],
        iconAnchor: [60, 16],
      });

      const marker = L.marker([location.latitude, location.longitude], {
        icon: customIcon,
        zIndexOffset: 100,
      }).addTo(map);

      // Handle map click/tap anywhere worldwide
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        // Normalize longitude between -180 and 180
        let normLng = lng % 360;
        if (normLng > 180) normLng -= 360;
        else if (normLng < -180) normLng += 360;

        setClickedCoord({ lat, lng: normLng });
        setIsResolvingClick(true);

        // Put a temporary loading ping marker on the map
        if (clickMarkerRef.current) {
          map.removeLayer(clickMarkerRef.current);
        }

        const clickPingIcon = L.divIcon({
          className: 'click-ping-marker',
          html: `
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: rgba(6, 182, 212, 0.4);
              border: 2px solid #22d3ee;
              display: flex;
              align-items: center;
              justify-content: center;
              animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
            ">
              <div style="width: 8px; height: 8px; border-radius: 50%; background: #22d3ee;"></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const tempMarker = L.marker([lat, normLng], { icon: clickPingIcon }).addTo(map);
        clickMarkerRef.current = tempMarker;

        try {
          const resolvedLoc = await reverseGeocodeLocation(lat, normLng);
          if (onLocationSelect) {
            onLocationSelect(resolvedLoc);
          }
        } catch (_err) {
          // Geocode fallback handled
        } finally {
          setIsResolvingClick(false);
          if (clickMarkerRef.current) {
            map.removeLayer(clickMarkerRef.current);
            clickMarkerRef.current = null;
          }
        }
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;
    }
  }, []);

  // Update map view when active location changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([location.latitude, location.longitude], mapInstanceRef.current.getZoom() || 7, {
        duration: 1.2,
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([location.latitude, location.longitude]);
        const customIcon = L.divIcon({
          className: 'custom-weather-marker',
          html: `
            <div style="
              background: #0ea5e9;
              color: white;
              padding: 5px 10px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 6px;
              box-shadow: 0 4px 16px rgba(14,165,233,0.5);
              border: 2px solid white;
              white-space: nowrap;
            ">
              <span>📍 ${location.name}</span>
              <span style="background: rgba(0,0,0,0.35); padding: 2px 6px; border-radius: 6px;">${formatTemp(
                weather.temperature,
                tempUnit,
              )}</span>
            </div>
          `,
          iconSize: [120, 32],
          iconAnchor: [60, 16],
        });
        markerRef.current.setIcon(customIcon);
      }
    }
  }, [location.latitude, location.longitude, location.name, weather.temperature, tempUnit]);

  // Update weather overlay tile layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (weatherLayerRef.current) {
      mapInstanceRef.current.removeLayer(weatherLayerRef.current);
      weatherLayerRef.current = null;
    }

    if (!showWeatherLayer) return;

    if (activeLayer === 'radar' && radarTimestamps.length > 0) {
      const ts = radarTimestamps[currentFrameIndex];
      if (ts) {
        const radarLayer = L.tileLayer(
          `https://tilecache.rainviewer.com/v2/radar/${ts}/256/{z}/{x}/{y}/2/1_1.png`,
          {
            opacity: layerOpacity,
            zIndex: 10,
          },
        );
        radarLayer.addTo(mapInstanceRef.current);
        weatherLayerRef.current = radarLayer;
      }
    } else if (activeLayer === 'satellite' && satelliteTimestamps.length > 0) {
      const ts = satelliteTimestamps[satelliteTimestamps.length - 1];
      if (ts) {
        const satLayer = L.tileLayer(
          `https://tilecache.rainviewer.com/v2/satellite/${ts}/256/{z}/{x}/{y}/0/0_0.png`,
          {
            opacity: layerOpacity * 0.8,
            zIndex: 9,
          },
        );
        satLayer.addTo(mapInstanceRef.current);
        weatherLayerRef.current = satLayer;
      }
    } else if (activeLayer === 'temperature' || activeLayer === 'wind') {
      // High-resolution OpenStreetMap weather overlay
      const tempTileUrl = 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=';
      // Or fallback graceful precipitation/cloud overlay
      const ts = radarTimestamps[currentFrameIndex] || radarTimestamps[radarTimestamps.length - 1];
      if (ts) {
        const radarLayer = L.tileLayer(
          `https://tilecache.rainviewer.com/v2/radar/${ts}/256/{z}/{x}/{y}/4/1_1.png`,
          {
            opacity: layerOpacity,
            zIndex: 10,
          },
        );
        radarLayer.addTo(mapInstanceRef.current);
        weatherLayerRef.current = radarLayer;
      }
    }
  }, [
    currentFrameIndex,
    radarTimestamps,
    satelliteTimestamps,
    showWeatherLayer,
    layerOpacity,
    activeLayer,
  ]);

  // Animation player loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && radarTimestamps.length > 0) {
      interval = setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % radarTimestamps.length);
      }, 700);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, radarTimestamps.length]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    mapInstanceRef.current?.flyTo([location.latitude, location.longitude], 7);
  };

  const currentTs = radarTimestamps[currentFrameIndex];
  const timeFormatted = currentTs
    ? new Date(currentTs * 1000).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : 'Live';

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl flex flex-col">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Interactive World Weather Map & Radar
          </h2>
        </div>

        {/* Layer Switches & Basemap selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layer toggles */}
          <div className="inline-flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveLayer('radar');
                setShowWeatherLayer(true);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeLayer === 'radar' && showWeatherLayer
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>Radar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveLayer('satellite');
                setShowWeatherLayer(true);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeLayer === 'satellite' && showWeatherLayer
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Clouds</span>
            </button>
          </div>

          {/* Basemap switcher */}
          <div className="inline-flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setBasemapType('dark');
                updateBasemap('dark');
              }}
              className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${
                basemapType === 'dark' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => {
                setBasemapType('satellite');
                updateBasemap('satellite');
              }}
              className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${
                basemapType === 'satellite' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowWeatherLayer(!showWeatherLayer)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              showWeatherLayer
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showWeatherLayer ? 'Layer On' : 'Layer Off'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Map Container */}
      <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

        {/* Click Instruction Banner */}
        <div className="absolute top-3 left-3 z-20 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2 shadow-lg pointer-events-none">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click anywhere worldwide to get instant weather</span>
        </div>

        {/* Click Resolving Spinner */}
        {isResolvingClick && (
          <div className="absolute inset-0 z-30 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs text-white">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Retrieving live weather for coordinates...</span>
            </div>
          </div>
        )}

        {/* Map Zoom & Recenter Controls Overlay */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="w-8 h-8 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="w-8 h-8 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center shadow-lg transition cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRecenter}
            title="Recenter Map on Active Location"
            className="w-8 h-8 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center shadow-lg transition cursor-pointer"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Radar Controls Bar */}
        {showWeatherLayer && activeLayer === 'radar' && radarTimestamps.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 z-20 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-800/90 p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-md transition cursor-pointer shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-slate-950" />
                ) : (
                  <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                )}
              </button>

              <div className="text-xs font-mono">
                <span className="text-slate-400 text-[10px] block leading-tight">FRAME TIME</span>
                <span className="text-white font-bold">{timeFormatted}</span>
              </div>
            </div>

            {/* Slider track */}
            <div className="flex-1 min-w-[120px] max-w-xs flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={radarTimestamps.length - 1}
                value={currentFrameIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentFrameIndex(Number(e.target.value));
                }}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Opacity control */}
            <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="range"
                min={0.2}
                max={1.0}
                step={0.05}
                value={layerOpacity}
                onChange={(e) => setLayerOpacity(parseFloat(e.target.value))}
                className="w-16 accent-cyan-400 cursor-pointer h-1 bg-slate-800 rounded"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Radar Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span>Precipitation:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-sky-500" />
            <span className="text-[10px]">Light</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-amber-400" />
            <span className="text-[10px]">Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-rose-500" />
            <span className="text-[10px]">Heavy</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500">
          Source: RainViewer Live Telemetry & Open-Meteo
        </div>
      </div>
    </div>
  );
};
