// Theme, Color, and Background Wallpaper Preference Service for Weatherwise
// Supports Dark / Light mode, 10 curated accent colors, and production-bundled atmospheric background scenery.

import bgAurora from '../assets/images/bg_aurora_night_1792387221303.jpg';
import bgSunset from '../assets/images/bg_sunset_clouds_1792387238520.jpg';
import bgMountains from '../assets/images/bg_misty_mountains_1792387255493.jpg';
import bgRainyCity from '../assets/images/bg_rainy_cityscape_1792387270583.jpg';
import bgGalaxy from '../assets/images/bg_starry_galaxy_1792387285895.jpg';

export { bgAurora, bgSunset, bgMountains, bgRainyCity, bgGalaxy };

export type ThemeMode = 'dark' | 'light';

export interface ThemeColorOption {
  id: string;
  name: string;
  tagline: string;
  primary: string;     // Main accent color
  secondary: string;   // Gradient target / hover tone
  light: string;       // Lighter accent for text in dark mode
  dark: string;        // Darker accent for text in light mode
  glow: string;        // Box-shadow / glow rgba
  bgSoftLight: string; // Soft background in light mode
  bgSoftDark: string;  // Soft background in dark mode
  borderLight: string;
  borderDark: string;
}

export interface BackgroundImageOption {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  tag: string;
}

export const THEME_COLORS: ThemeColorOption[] = [
  {
    id: 'cyan',
    name: 'Electric Cyan',
    tagline: 'Iconic Weatherwise sky & polar atmosphere',
    primary: '#06b6d4',
    secondary: '#0284c7',
    light: '#67e8f9',
    dark: '#0e7490',
    glow: 'rgba(6, 182, 212, 0.35)',
    bgSoftLight: '#ecfeff',
    bgSoftDark: 'rgba(6, 182, 212, 0.15)',
    borderLight: '#a5f3fc',
    borderDark: 'rgba(6, 182, 212, 0.3)',
  },
  {
    id: 'blue',
    name: 'Sapphire Blue',
    tagline: 'Oceanic deep atmospheric pressure system',
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    light: '#93c5fd',
    dark: '#1d4ed8',
    glow: 'rgba(59, 130, 246, 0.35)',
    bgSoftLight: '#eff6ff',
    bgSoftDark: 'rgba(59, 130, 246, 0.15)',
    borderLight: '#bfdbfe',
    borderDark: 'rgba(59, 130, 246, 0.3)',
  },
  {
    id: 'emerald',
    name: 'Aurora Emerald',
    tagline: 'Vibrant Northern Lights & lush biosphere',
    primary: '#10b981',
    secondary: '#047857',
    light: '#6ee7b7',
    dark: '#047857',
    glow: 'rgba(16, 185, 129, 0.35)',
    bgSoftLight: '#ecfdf5',
    bgSoftDark: 'rgba(16, 185, 129, 0.15)',
    borderLight: '#a7f3d0',
    borderDark: 'rgba(16, 185, 129, 0.3)',
  },
  {
    id: 'violet',
    name: 'Cosmic Violet',
    tagline: 'Nebula twilight & evening stratosphere',
    primary: '#8b5cf6',
    secondary: '#6d28d9',
    light: '#c4b5fd',
    dark: '#6d28d9',
    glow: 'rgba(139, 92, 246, 0.35)',
    bgSoftLight: '#f5f3ff',
    bgSoftDark: 'rgba(139, 92, 246, 0.15)',
    borderLight: '#ddd6fe',
    borderDark: 'rgba(139, 92, 246, 0.3)',
  },
  {
    id: 'amber',
    name: 'Solar Gold',
    tagline: 'Radiant morning dawn & warm sunlight',
    primary: '#f59e0b',
    secondary: '#b45309',
    light: '#fcd34d',
    dark: '#b45309',
    glow: 'rgba(245, 158, 11, 0.35)',
    bgSoftLight: '#fffbeb',
    bgSoftDark: 'rgba(245, 158, 11, 0.15)',
    borderLight: '#fde68a',
    borderDark: 'rgba(245, 158, 11, 0.3)',
  },
  {
    id: 'rose',
    name: 'Neon Rose',
    tagline: 'Alpenglow mountain peaks & thermal dusk',
    primary: '#f43f5e',
    secondary: '#be123c',
    light: '#fda4af',
    dark: '#be123c',
    glow: 'rgba(244, 63, 94, 0.35)',
    bgSoftLight: '#fff1f2',
    bgSoftDark: 'rgba(244, 63, 94, 0.15)',
    borderLight: '#fecdd3',
    borderDark: 'rgba(244, 63, 94, 0.3)',
  },
  {
    id: 'orange',
    name: 'Sunset Coral',
    tagline: 'Tropical golden hour & horizon flare',
    primary: '#f97316',
    secondary: '#c2410c',
    light: '#fdba74',
    dark: '#c2410c',
    glow: 'rgba(249, 115, 22, 0.35)',
    bgSoftLight: '#fff7ed',
    bgSoftDark: 'rgba(249, 115, 22, 0.15)',
    borderLight: '#fed7aa',
    borderDark: 'rgba(249, 115, 22, 0.3)',
  },
  {
    id: 'teal',
    name: 'Ocean Teal',
    tagline: 'Subtropical marine tide & coastal breeze',
    primary: '#14b8a6',
    secondary: '#0f766e',
    light: '#5eead4',
    dark: '#0f766e',
    glow: 'rgba(20, 184, 166, 0.35)',
    bgSoftLight: '#f0fdfa',
    bgSoftDark: 'rgba(20, 184, 166, 0.15)',
    borderLight: '#99f6e4',
    borderDark: 'rgba(20, 184, 166, 0.3)',
  },
  {
    id: 'fuchsia',
    name: 'Cyber Fuchsia',
    tagline: 'Vivid magenta pulse & electric aurora',
    primary: '#d946ef',
    secondary: '#a21caf',
    light: '#f0abfc',
    dark: '#a21caf',
    glow: 'rgba(217, 70, 239, 0.35)',
    bgSoftLight: '#fdf4ff',
    bgSoftDark: 'rgba(217, 70, 239, 0.15)',
    borderLight: '#f5d0fe',
    borderDark: 'rgba(217, 70, 239, 0.3)',
  },
  {
    id: 'indigo',
    name: 'Royal Indigo',
    tagline: 'Deep midnight galaxy & starlit clear sky',
    primary: '#6366f1',
    secondary: '#4338ca',
    light: '#a5b4fc',
    dark: '#4338ca',
    glow: 'rgba(99, 102, 241, 0.35)',
    bgSoftLight: '#eef2ff',
    bgSoftDark: 'rgba(99, 102, 241, 0.15)',
    borderLight: '#c7d2fe',
    borderDark: 'rgba(99, 102, 241, 0.3)',
  },
];

export const WALLPAPER_MAP: Record<string, string> = {
  aurora: bgAurora,
  sunset: bgSunset,
  mountains: bgMountains,
  rainy_city: bgRainyCity,
  galaxy: bgGalaxy,
  none: 'none',
};

// Best high-resolution production-bundled background wallpaper images
export const BACKGROUND_IMAGES: BackgroundImageOption[] = [
  {
    id: 'aurora',
    name: 'Northern Aurora & Snowy Peaks',
    subtitle: 'Emerald swirling polar lights over Arctic alpine peaks',
    url: bgAurora,
    tag: 'Recommended',
  },
  {
    id: 'sunset',
    name: 'Golden Sunset Cloudscape',
    subtitle: 'Warm golden sunrays piercing towering cumulus clouds',
    url: bgSunset,
    tag: 'Dramatic',
  },
  {
    id: 'mountains',
    name: 'Misty Alpine Valley',
    subtitle: 'Morning fog rolling through evergreen pines and mountain peaks',
    url: bgMountains,
    tag: 'Serene',
  },
  {
    id: 'rainy_city',
    name: 'Neon Rain & Cyber City',
    subtitle: 'Cinematic rainy evening streets with colorful neon reflections',
    url: bgRainyCity,
    tag: 'Cyberpunk',
  },
  {
    id: 'galaxy',
    name: 'Cosmic Andromeda Galaxy',
    subtitle: 'Deep starry interstellar nebula with glowing cosmic stardust',
    url: bgGalaxy,
    tag: 'Cosmic',
  },
  {
    id: 'none',
    name: 'Clean Solid Backdrop',
    subtitle: 'Pure minimal solid dark/light tone without background photo',
    url: 'none',
    tag: 'Minimal',
  },
];

const STORAGE_KEYS = {
  THEME_MODE: 'weatherise_theme_mode',
  THEME_COLOR: 'weatherise_theme_color',
  BACKGROUND_IMAGE: 'weatherise_bg_image',
  BACKGROUND_OPACITY: 'weatherise_bg_opacity',
};

/**
 * Resolves any wallpaper identifier or legacy URL into a valid, bundled production asset URL.
 * Automatically fixes old unbundled `/src/assets/...` paths previously saved in users' localStorage.
 */
export function resolveWallpaperUrl(rawUrl?: string | null): string {
  if (!rawUrl || rawUrl === 'none') return 'none';

  // Check direct key match in map
  if (WALLPAPER_MAP[rawUrl]) {
    return WALLPAPER_MAP[rawUrl];
  }

  // Check matching by substring or file keyword
  const lower = rawUrl.toLowerCase();
  if (lower.includes('aurora')) return bgAurora;
  if (lower.includes('sunset')) return bgSunset;
  if (lower.includes('mountain') || lower.includes('misty')) return bgMountains;
  if (lower.includes('rainy') || lower.includes('city')) return bgRainyCity;
  if (lower.includes('galaxy') || lower.includes('starry') || lower.includes('cosmos')) return bgGalaxy;

  // If it's an old dev path like /src/assets/images/...
  if (rawUrl.startsWith('/src/')) {
    return bgAurora;
  }

  return rawUrl;
}

// Retrieve saved theme mode ('dark' default)
export function getStoredThemeMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'dark';
}

// Retrieve saved theme color ('cyan' default)
export function getStoredThemeColor(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME_COLOR);
    if (saved && THEME_COLORS.some((c) => c.id === saved)) {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'cyan';
}

// Retrieve saved background image (defaults to Aurora bundled image and migrates stale paths)
export function getStoredBackgroundImage(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.BACKGROUND_IMAGE);
    if (saved) {
      const resolved = resolveWallpaperUrl(saved);
      // If the saved value was an old /src/... path, silently migrate it in localStorage
      if (saved.startsWith('/src/')) {
        saveBackgroundImage(resolved);
      }
      return resolved;
    }
  } catch {
    // ignore
  }
  return bgAurora;
}

// Retrieve background opacity (defaults to 0.70)
export function getStoredBackgroundOpacity(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.BACKGROUND_OPACITY);
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.2 && parsed <= 0.95) return parsed;
    }
  } catch {
    // ignore
  }
  return 0.70;
}

// Save theme mode to localStorage
export function saveThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  } catch {
    // ignore
  }
}

// Save theme color to localStorage
export function saveThemeColor(colorId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME_COLOR, colorId);
  } catch {
    // ignore
  }
}

// Save background image to localStorage
export function saveBackgroundImage(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BACKGROUND_IMAGE, url);
  } catch {
    // ignore
  }
}

// Save background opacity to localStorage
export function saveBackgroundOpacity(opacity: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BACKGROUND_OPACITY, opacity.toString());
  } catch {
    // ignore
  }
}

// Apply theme to document element and CSS variables
export function applyTheme(mode: ThemeMode, colorId: string): void {
  const root = document.documentElement;
  const color = THEME_COLORS.find((c) => c.id === colorId) || THEME_COLORS[0];

  // Apply dark / light class to root
  if (mode === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }

  // Set data-theme-color attribute
  root.setAttribute('data-theme-color', color.id);
  root.setAttribute('data-theme-mode', mode);

  // Set CSS custom variables on root
  root.style.setProperty('--accent-primary', color.primary);
  root.style.setProperty('--accent-secondary', color.secondary);
  root.style.setProperty('--accent-light', color.light);
  root.style.setProperty('--accent-dark', color.dark);
  root.style.setProperty('--accent-glow', color.glow);

  // Dispatch custom event for real-time reactivity in any listening component
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('weatherise:theme_change', {
        detail: { mode, colorId: color.id, color },
      })
    );
  }
}

// Reset theme and wallpaper to baseline defaults
export function resetTheme(): { mode: ThemeMode; colorId: string; bgImage: string; bgOpacity: number } {
  saveThemeMode('dark');
  saveThemeColor('cyan');
  saveBackgroundImage(bgAurora);
  saveBackgroundOpacity(0.70);
  applyTheme('dark', 'cyan');
  return {
    mode: 'dark',
    colorId: 'cyan',
    bgImage: bgAurora,
    bgOpacity: 0.70,
  };
}
