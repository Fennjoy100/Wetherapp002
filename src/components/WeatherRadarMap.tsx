import React, { useEffect, useRef, useState } from 'react';
import {
  Layers,
  Play,
  Pause,
  RotateCcw,
  MapPin,
  Crosshair,
  Radio,
  Sliders,
} from 'lucide-react';
import L from 'leaflet';
import { LocationData, CurrentWeather, TempUnit } from '../types/weather.ts';
import { formatTemp } from '../services/weatherService.ts';

interface WeatherRadarMapProps {
  location: LocationData;
  weather: CurrentWeather;
  tempUnit: TempUnit;
}

export const WeatherRadarMap: React.FC<WeatherRadarMapProps> = ({
  location,
  weather,
  tempUnit,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);

  const [radarTimestamps, setRadarTimestamps] = useState<number[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [layerOpacity, setLayerOpacity] = useState<number>(0.75);

  // Fetch live RainViewer radar frames (free, no API key)
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
        }
      } catch (err) {
        console.warn('Could not load RainViewer radar frames:', err);
      }
    }
    loadRadarFrames();
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [location.latitude, location.longitude],
        zoom: 9,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Dark Matter / OSM dark tiles
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          subdomains: 'abcd',
          maxZoom: 19,
        },
      ).addTo(map);

      // Custom marker icon
      const customIcon = L.divIcon({
        className: 'custom-weather-marker',
        html: `
          <div style="
            background: #0ea5e9;
            color: white;
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 4px 14px rgba(14,165,233,0.5);
            border: 2px solid white;
            white-space: nowrap;
          ">
            <span>📍 ${location.name}</span>
            <span style="background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 4px;">${formatTemp(
              weather.temperature,
              tempUnit,
            )}</span>
          </div>
        `,
        iconSize: [100, 30],
        iconAnchor: [50, 15],
      });

      const marker = L.marker([location.latitude, location.longitude], {
        icon: customIcon,
      }).addTo(map);

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      // Keep map active across location changes
    };
  }, []);

  // Update map view when location changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([location.latitude, location.longitude], 9, {
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
              padding: 4px 8px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: bold;
              display: flex;
              align-items: center;
              gap: 4px;
              box-shadow: 0 4px 14px rgba(14,165,233,0.5);
              border: 2px solid white;
              white-space: nowrap;
            ">
              <span>📍 ${location.name}</span>
              <span style="background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 4px;">${formatTemp(
                weather.temperature,
                tempUnit,
              )}</span>
            </div>
          `,
          iconSize: [100, 30],
          iconAnchor: [50, 15],
        });
        markerRef.current.setIcon(customIcon);
      }
    }
  }, [location, weather.temperature, tempUnit]);

  // Update radar tile layer when timestamp or showRadar changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (radarLayerRef.current) {
      mapInstanceRef.current.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }

    if (showRadar && radarTimestamps.length > 0) {
      const ts = radarTimestamps[currentFrameIndex];
      if (ts) {
        // RainViewer radar tile URL: /v2/radar/{ts}/256/{z}/{x}/{y}/2/1_1.png
        const radarLayer = L.tileLayer(
          `https://tilecache.rainviewer.com/v2/radar/${ts}/256/{z}/{x}/{y}/2/1_1.png`,
          {
            opacity: layerOpacity,
            zIndex: 10,
          },
        );
        radarLayer.addTo(mapInstanceRef.current);
        radarLayerRef.current = radarLayer;
      }
    }
  }, [currentFrameIndex, radarTimestamps, showRadar, layerOpacity]);

  // Animation player loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && radarTimestamps.length > 0) {
      interval = setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % radarTimestamps.length);
      }, 750);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, radarTimestamps.length]);

  const handleCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([location.latitude, location.longitude], 9);
    }
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
            Live Weather Radar & Precipitation Loop
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRadar(!showRadar)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              showRadar
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showRadar ? 'Radar Active' : 'Base Map'}</span>
          </button>

          <button
            type="button"
            onClick={handleCenter}
            title="Center on current location"
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map viewport */}
      <div className="relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-800/90 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full dark-map-tiles" />

        {/* Floating Playback Controls Bar */}
        {showRadar && radarTimestamps.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 z-[400] p-3 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800/90 flex flex-wrap items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition cursor-pointer shadow-md shadow-cyan-500/30"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
              </button>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Frame: {timeFormatted}</span>
                  {currentFrameIndex === radarTimestamps.length - 1 && (
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-semibold">
                      LATEST
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">
                  Step {currentFrameIndex + 1} of {radarTimestamps.length}
                </div>
              </div>
            </div>

            {/* Range slider */}
            <div className="flex-1 min-w-[120px] max-w-xs mx-2">
              <input
                type="range"
                min={0}
                max={radarTimestamps.length - 1}
                value={currentFrameIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentFrameIndex(parseInt(e.target.value));
                }}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Radar Intensity Legend */}
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
              <span>Light</span>
              <div className="w-20 h-2 rounded-full bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-rose-600" />
              <span>Heavy Rain</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
