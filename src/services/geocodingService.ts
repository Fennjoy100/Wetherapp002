import type { LocationData } from '../types/weather.ts';

const RECENT_SEARCHES_KEY = 'weatherflow_recent_searches';

// Parse coordinate strings like "13.0827, 80.2707" or "40.7128 -74.0060"
export function parseCoordinates(query: string): { latitude: number; longitude: number } | null {
  const trimmed = query.trim();
  const coordRegex = /^([-+]?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*([-+]?\d{1,3}(?:\.\d+)?)$/;
  const match = trimmed.match(coordRegex);

  if (!match) return null;

  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);

  if (isNaN(lat) || isNaN(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

  return { latitude: lat, longitude: lon };
}

// Search locations worldwide using Open-Meteo + Nominatim for comprehensive global coverage
export async function searchWorldwideLocations(query: string): Promise<LocationData[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  // 1. Direct coordinate input
  const coords = parseCoordinates(trimmed);
  if (coords) {
    const loc = await reverseGeocodeLocation(coords.latitude, coords.longitude);
    return [loc];
  }

  const results: LocationData[] = [];
  const seenIds = new Set<string>();

  // 2. Open-Meteo Geocoding API (Fast, 150,000+ populated places worldwide)
  try {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', trimmed);
    url.searchParams.set('count', '10');
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    const res = await fetch(url.toString());
    if (res.ok) {
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          const idKey = `${item.name}-${item.latitude.toFixed(3)}-${item.longitude.toFixed(3)}`;
          if (!seenIds.has(idKey)) {
            seenIds.add(idKey);
            results.push({
              id: item.id,
              name: item.name,
              region: item.admin1 || item.admin2 || '',
              country: item.country || '',
              countryCode: item.country_code || '',
              latitude: item.latitude,
              longitude: item.longitude,
              timezone: item.timezone || 'auto',
            });
          }
        }
      }
    }
  } catch (_err) {
    // Open-Meteo geocoding fallback
  }

  // 3. OpenStreetMap Nominatim Fallback (Catches postal codes, airports, small hamlets, landmarks)
  if (results.length < 3) {
    try {
      const nomUrl = new URL('https://nominatim.openstreetmap.org/search');
      nomUrl.searchParams.set('q', trimmed);
      nomUrl.searchParams.set('format', 'json');
      nomUrl.searchParams.set('addressdetails', '1');
      nomUrl.searchParams.set('limit', '8');

      const nomRes = await fetch(nomUrl.toString(), {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'WeatherFlow-Worldwide/1.0 (https://weatherflow.app)',
        },
      });

      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (Array.isArray(nomData)) {
          for (const item of nomData) {
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            const idKey = `${item.display_name}-${lat.toFixed(3)}-${lon.toFixed(3)}`;

            if (!seenIds.has(idKey)) {
              seenIds.add(idKey);
              const addr = item.address || {};
              const placeName =
                addr.city ||
                addr.town ||
                addr.village ||
                addr.suburb ||
                addr.hamlet ||
                addr.municipality ||
                addr.aeroway ||
                item.name ||
                item.display_name.split(',')[0];

              const region = addr.state || addr.province || addr.region || addr.county || '';
              const country = addr.country || '';
              const countryCode = (addr.country_code || '').toUpperCase();

              results.push({
                id: item.osm_id || Math.floor(Math.random() * 1000000),
                name: placeName,
                region,
                country,
                countryCode,
                latitude: lat,
                longitude: lon,
                timezone: 'auto',
              });
            }
          }
        }
      }
    } catch (_nomErr) {
      // Nominatim fallback
    }
  }

  return results;
}

// Reverse Geocode latitude/longitude coordinates to a valid location name
export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
): Promise<LocationData> {
  // 1. Try BigDataCloud
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
    );
    if (res.ok) {
      const data = await res.json();
      const name =
        data.city ||
        data.locality ||
        data.principalSubdivision ||
        (data.countryName ? `${data.countryName} Region` : '');

      if (name) {
        return {
          name,
          region: data.principalSubdivision || '',
          country: data.countryName || '',
          countryCode: (data.countryCode || '').toUpperCase(),
          latitude,
          longitude,
          timezone: 'auto',
          isCurrentLocation: false,
        };
      }
    }
  } catch (_err) {
    // BigDataCloud fallback
  }

  // 2. Try Nominatim Reverse Geocoding
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=14&addressdetails=1`;
    const nomRes = await fetch(nomUrl, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'WeatherFlow-Worldwide/1.0 (https://weatherflow.app)',
      },
    });
    if (nomRes.ok) {
      const nomData = await nomRes.json();
      const addr = nomData.address || {};
      const name =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.hamlet ||
        addr.suburb ||
        addr.county ||
        addr.state ||
        nomData.name ||
        'Selected Point';

      return {
        name,
        region: addr.state || addr.province || addr.county || '',
        country: addr.country || '',
        countryCode: (addr.country_code || '').toUpperCase(),
        latitude,
        longitude,
        timezone: 'auto',
        isCurrentLocation: false,
      };
    }
  } catch (_err) {
    // Nominatim reverse geocode fallback
  }

  // 3. Fallback for open oceans or remote unpopulated zones
  const latStr = `${Math.abs(latitude).toFixed(2)}° ${latitude >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(longitude).toFixed(2)}° ${longitude >= 0 ? 'E' : 'W'}`;

  // Broad ocean / sea heuristics
  let zoneName = 'Marine Coordinates';
  if (latitude > 0 && longitude > -80 && longitude < 0) zoneName = 'North Atlantic Ocean';
  else if (latitude < 0 && longitude > -70 && longitude < 20) zoneName = 'South Atlantic Ocean';
  else if (longitude > 100 || longitude < -100) zoneName = 'Pacific Ocean';
  else if (longitude > 40 && longitude < 100 && latitude < 30) zoneName = 'Indian Ocean';
  else if (latitude > 66) zoneName = 'Arctic Ocean';
  else if (latitude < -60) zoneName = 'Southern Ocean';

  return {
    name: `${zoneName} (${latStr}, ${lonStr})`,
    region: `${latStr}, ${lonStr}`,
    country: 'International Waters',
    latitude,
    longitude,
    timezone: 'auto',
    isCurrentLocation: false,
  };
}

// Manage Recent Searches in localStorage
export function getRecentSearches(): LocationData[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, 10);
    }
  } catch {
    // Ignore localStorage errors
  }
  return [];
}

export function saveRecentSearch(loc: LocationData): void {
  try {
    const recents = getRecentSearches();
    // Deduplicate by name and approximate coordinates
    const filtered = recents.filter(
      (r) =>
        r.name.toLowerCase() !== loc.name.toLowerCase() &&
        (Math.abs(r.latitude - loc.latitude) > 0.05 ||
          Math.abs(r.longitude - loc.longitude) > 0.05),
    );
    const updated = [loc, ...filtered].slice(0, 8);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore
  }
}
