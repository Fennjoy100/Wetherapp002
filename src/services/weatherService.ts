import {
  AirQualityData,
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  LocationData,
  PollutantDetail,
} from '../types/weather.ts';

export const DEFAULT_LOCATIONS: LocationData[] = [
  {
    name: 'San Francisco',
    region: 'California',
    country: 'United States',
    countryCode: 'US',
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: 'America/Los_Angeles',
  },
  {
    name: 'London',
    region: 'England',
    country: 'United Kingdom',
    countryCode: 'GB',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London',
  },
  {
    name: 'Tokyo',
    region: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
  },
  {
    name: 'New York',
    region: 'New York',
    country: 'United States',
    countryCode: 'US',
    latitude: 40.7128,
    longitude: -74.006,
    timezone: 'America/New_York',
  },
  {
    name: 'Paris',
    region: 'Île-de-France',
    country: 'France',
    countryCode: 'FR',
    latitude: 48.8566,
    longitude: 2.3522,
    timezone: 'Europe/Paris',
  },
  {
    name: 'Sydney',
    region: 'New South Wales',
    country: 'Australia',
    countryCode: 'AU',
    latitude: -33.8688,
    longitude: 151.2093,
    timezone: 'Australia/Sydney',
  },
];

// WMO Weather interpretation codes (WW)
export function getWeatherInterpretation(code: number, isDay: boolean = true): {
  condition: string;
  description: string;
  iconName: string;
  bgGradient: string;
  accentColor: string;
} {
  switch (code) {
    case 0:
      return {
        condition: isDay ? 'Sunny' : 'Clear Sky',
        description: isDay ? 'Bright and clear sunshine' : 'Clear starry skies',
        iconName: isDay ? 'Sun' : 'Moon',
        bgGradient: isDay
          ? 'from-amber-500/20 via-sky-600/20 to-slate-950'
          : 'from-indigo-950 via-slate-900 to-slate-950',
        accentColor: '#f59e0b',
      };
    case 1:
      return {
        condition: isDay ? 'Mainly Sunny' : 'Mostly Clear',
        description: 'Light cloud patches',
        iconName: isDay ? 'SunMedium' : 'MoonStar',
        bgGradient: isDay
          ? 'from-amber-500/15 via-blue-600/15 to-slate-950'
          : 'from-indigo-950 via-slate-900 to-slate-950',
        accentColor: '#38bdf8',
      };
    case 2:
      return {
        condition: 'Partly Cloudy',
        description: 'Scattered clouds with breaks of sky',
        iconName: isDay ? 'CloudSun' : 'CloudMoon',
        bgGradient: 'from-blue-600/20 via-slate-800/30 to-slate-950',
        accentColor: '#60a5fa',
      };
    case 3:
      return {
        condition: 'Overcast',
        description: 'Dense cloud cover across the sky',
        iconName: 'Cloud',
        bgGradient: 'from-slate-700/30 via-slate-800/40 to-slate-950',
        accentColor: '#94a3b8',
      };
    case 45:
    case 48:
      return {
        condition: 'Foggy',
        description: 'Reduced visibility due to mist or fog',
        iconName: 'CloudFog',
        bgGradient: 'from-slate-600/25 via-zinc-800/30 to-slate-950',
        accentColor: '#cbd5e1',
      };
    case 51:
    case 53:
    case 55:
      return {
        condition: 'Drizzle',
        description: 'Light continuous water droplets',
        iconName: 'CloudDrizzle',
        bgGradient: 'from-teal-800/25 via-slate-900/50 to-slate-950',
        accentColor: '#2dd4bf',
      };
    case 61:
    case 63:
    case 65:
      return {
        condition: 'Rain',
        description: code === 65 ? 'Heavy precipitation' : 'Consistent steady rainfall',
        iconName: 'CloudRain',
        bgGradient: 'from-blue-900/35 via-slate-900/60 to-slate-950',
        accentColor: '#38bdf8',
      };
    case 71:
    case 73:
    case 75:
      return {
        condition: 'Snow',
        description: code === 75 ? 'Heavy snowfall' : 'Flurries and snowfall',
        iconName: 'CloudSnow',
        bgGradient: 'from-sky-900/30 via-indigo-950/40 to-slate-950',
        accentColor: '#bae6fd',
      };
    case 77:
      return {
        condition: 'Snow Grains',
        description: 'Fine icy crystalline precipitation',
        iconName: 'CloudSnow',
        bgGradient: 'from-slate-800/30 via-slate-900/50 to-slate-950',
        accentColor: '#e0e7ff',
      };
    case 80:
    case 81:
    case 82:
      return {
        condition: 'Rain Showers',
        description: code === 82 ? 'Violent passing rain showers' : 'Scattered rain showers',
        iconName: 'CloudRain',
        bgGradient: 'from-cyan-900/30 via-slate-900/50 to-slate-950',
        accentColor: '#06b6d4',
      };
    case 85:
    case 86:
      return {
        condition: 'Snow Showers',
        description: 'Intermittent snow bursts',
        iconName: 'CloudSnow',
        bgGradient: 'from-indigo-900/30 via-slate-900/50 to-slate-950',
        accentColor: '#c7d2fe',
      };
    case 95:
      return {
        condition: 'Thunderstorm',
        description: 'Lightning and electrical storm activity',
        iconName: 'CloudLightning',
        bgGradient: 'from-purple-900/35 via-amber-950/20 to-slate-950',
        accentColor: '#f59e0b',
      };
    case 96:
    case 99:
      return {
        condition: 'Severe Storm & Hail',
        description: 'Severe thunderstorm with hail risk',
        iconName: 'CloudLightning',
        bgGradient: 'from-rose-950/40 via-purple-950/30 to-slate-950',
        accentColor: '#f43f5e',
      };
    default:
      return {
        condition: 'Partly Cloudy',
        description: 'Fair weather conditions',
        iconName: 'Cloud',
        bgGradient: 'from-slate-800/30 via-slate-900/50 to-slate-950',
        accentColor: '#38bdf8',
      };
  }
}

// Moon phase calculator
export function calculateMoonPhase(date: Date = new Date()): {
  phaseName: string;
  illumination: number;
  icon: string;
} {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let c = 0;
  let e = 0;
  let jd = 0;
  let b = 0;

  if (month < 3) {
    year - 1;
    month + 12;
  }

  c = 365.25 * year;
  e = 30.6 * month;
  jd = c + e + day - 694039.09; // Julian days since Jan 1 1900
  jd /= 29.5305882; // divide by synodic cycle
  b = parseInt(jd.toString());
  jd -= b; // fractional part
  b = Math.round(jd * 8);
  if (b >= 8) b = 0;

  const illumination = Math.round(Math.abs(Math.sin(jd * Math.PI)) * 100);

  const phaseNames = [
    'New Moon',
    'Waxing Crescent',
    'First Quarter',
    'Waxing Gibbous',
    'Full Moon',
    'Waning Gibbous',
    'Last Quarter',
    'Waning Crescent',
  ];

  const phaseIcons = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

  return {
    phaseName: phaseNames[b] || 'Waxing Gibbous',
    illumination,
    icon: phaseIcons[b] || '🌔',
  };
}

// Fetch complete weather forecast from Open-Meteo
export async function fetchWeatherData(
  latitude: number,
  longitude: number,
  timezone: string = 'auto',
): Promise<{
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
}> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', latitude.toString());
  url.searchParams.set('longitude', longitude.toString());
  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
  );
  url.searchParams.set(
    'hourly',
    [
      'temperature_2m',
      'relative_humidity_2m',
      'dew_point_2m',
      'apparent_temperature',
      'precipitation_probability',
      'weather_code',
      'visibility',
      'wind_speed_10m',
      'uv_index',
      'is_day',
    ].join(','),
  );
  url.searchParams.set(
    'daily',
    [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'sunrise',
      'sunset',
      'daylight_duration',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'uv_index_max',
    ].join(','),
  );
  url.searchParams.set('timezone', timezone || 'auto');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to load weather data (${response.status})`);
  }

  const data = await response.json();
  const currentRaw = data.current;
  const hourlyRaw = data.hourly;
  const dailyRaw = data.daily;

  // Find current hour index in hourly data
  const currentTime = currentRaw.time;
  let currentHourIdx = 0;
  if (hourlyRaw?.time) {
    const foundIdx = hourlyRaw.time.findIndex((t: string) => t >= currentTime);
    if (foundIdx !== -1) currentHourIdx = foundIdx;
  }

  const currentInterpretation = getWeatherInterpretation(
    currentRaw.weather_code,
    Boolean(currentRaw.is_day),
  );

  const uvNow = hourlyRaw?.uv_index?.[currentHourIdx] ?? 4.2;
  const visibilityKm = (hourlyRaw?.visibility?.[currentHourIdx] ?? 10000) / 1000;
  const dewPointNow = hourlyRaw?.dew_point_2m?.[currentHourIdx] ?? (currentRaw.temperature_2m - 4);

  const sunriseToday = dailyRaw?.sunrise?.[0] || '06:30';
  const sunsetToday = dailyRaw?.sunset?.[0] || '19:45';
  const daylightDuration = dailyRaw?.daylight_duration?.[0] || 43200;

  const moonPhase = calculateMoonPhase(new Date());

  const current: CurrentWeather = {
    temperature: Math.round(currentRaw.temperature_2m * 10) / 10,
    feelsLike: Math.round(currentRaw.apparent_temperature * 10) / 10,
    tempMin: Math.round((dailyRaw?.temperature_2m_min?.[0] ?? currentRaw.temperature_2m - 3) * 10) / 10,
    tempMax: Math.round((dailyRaw?.temperature_2m_max?.[0] ?? currentRaw.temperature_2m + 4) * 10) / 10,
    weatherCode: currentRaw.weather_code,
    condition: currentInterpretation.condition,
    description: currentInterpretation.description,
    iconName: currentInterpretation.iconName,
    isDay: Boolean(currentRaw.is_day),
    humidity: currentRaw.relative_humidity_2m,
    dewPoint: Math.round(dewPointNow * 10) / 10,
    pressure: Math.round(currentRaw.surface_pressure),
    windSpeed: Math.round(currentRaw.wind_speed_10m * 10) / 10,
    windDirection: currentRaw.wind_direction_10m,
    windGust: Math.round(currentRaw.wind_gusts_10m * 10) / 10,
    uvIndex: Math.round(uvNow * 10) / 10,
    visibility: Math.round(visibilityKm * 10) / 10,
    cloudCover: currentRaw.cloud_cover,
    precipitationProbability: hourlyRaw?.precipitation_probability?.[currentHourIdx] ?? 0,
    precipitationAmount: currentRaw.precipitation ?? 0,
    sunrise: sunriseToday,
    sunset: sunsetToday,
    daylightDuration,
    solarNoon: '12:45',
    moonPhase,
  };

  // Next 24 hours of forecast
  const hourly: HourlyForecastItem[] = [];
  const totalHours = Math.min(24, hourlyRaw?.time?.length || 0);
  for (let i = 0; i < totalHours; i++) {
    const idx = currentHourIdx + i;
    if (idx >= (hourlyRaw.time?.length || 0)) break;

    const timeStr = hourlyRaw.time[idx];
    const dateObj = new Date(timeStr);
    const hourFormatted = dateObj.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    const isDayItem = Boolean(hourlyRaw.is_day?.[idx] ?? 1);
    const weatherCode = hourlyRaw.weather_code[idx];
    const interpretation = getWeatherInterpretation(weatherCode, isDayItem);

    hourly.push({
      time: timeStr,
      hour: i === 0 ? 'Now' : hourFormatted,
      temperature: Math.round(hourlyRaw.temperature_2m[idx] * 10) / 10,
      feelsLike: Math.round(hourlyRaw.apparent_temperature[idx] * 10) / 10,
      weatherCode,
      condition: interpretation.condition,
      iconName: interpretation.iconName,
      precipitationProbability: hourlyRaw.precipitation_probability?.[idx] ?? 0,
      windSpeed: Math.round(hourlyRaw.wind_speed_10m[idx] * 10) / 10,
      isDay: isDayItem,
      humidity: hourlyRaw.relative_humidity_2m[idx],
    });
  }

  // 7-day daily forecast
  const daily: DailyForecastItem[] = [];
  const daysCount = dailyRaw?.time?.length || 0;
  for (let i = 0; i < Math.min(7, daysCount); i++) {
    const dateStr = dailyRaw.time[i];
    const dateObj = new Date(dateStr + 'T12:00:00');
    let dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    if (i === 0) dayName = 'Today';
    else if (i === 1) dayName = 'Tomorrow';

    const fullDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weatherCode = dailyRaw.weather_code[i];
    const interpretation = getWeatherInterpretation(weatherCode, true);

    daily.push({
      date: dateStr,
      dayName,
      fullDate,
      weatherCode,
      condition: interpretation.condition,
      description: interpretation.description,
      iconName: interpretation.iconName,
      tempMax: Math.round(dailyRaw.temperature_2m_max[i]),
      tempMin: Math.round(dailyRaw.temperature_2m_min[i]),
      precipitationProbability: dailyRaw.precipitation_probability_max[i] ?? 0,
      precipitationSum: Math.round((dailyRaw.precipitation_sum[i] ?? 0) * 10) / 10,
      windSpeedMax: Math.round(dailyRaw.wind_speed_10m_max[i] * 10) / 10,
      uvIndexMax: Math.round((dailyRaw.uv_index_max?.[i] ?? 5) * 10) / 10,
      sunrise: dailyRaw.sunrise[i],
      sunset: dailyRaw.sunset[i],
    });
  }

  return { current, hourly, daily };
}

// Fetch Air Quality from Open-Meteo Air Quality API
export async function fetchAirQualityData(
  latitude: number,
  longitude: number,
): Promise<AirQualityData> {
  try {
    const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
    url.searchParams.set('latitude', latitude.toString());
    url.searchParams.set('longitude', longitude.toString());
    url.searchParams.set(
      'current',
      [
        'us_aqi',
        'european_aqi',
        'pm2_5',
        'pm10',
        'nitrogen_dioxide',
        'ozone',
        'sulphur_dioxide',
      ].join(','),
    );

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Air quality request failed');
    const data = await res.json();
    const curr = data.current;

    const usAqi = curr.us_aqi ?? 32;
    const euAqi = curr.european_aqi ?? 25;
    const pm25Val = Math.round((curr.pm2_5 ?? 8.5) * 10) / 10;
    const pm10Val = Math.round((curr.pm10 ?? 14.2) * 10) / 10;
    const no2Val = Math.round((curr.nitrogen_dioxide ?? 12.0) * 10) / 10;
    const o3Val = Math.round((curr.ozone ?? 45.0) * 10) / 10;
    const so2Val = Math.round((curr.sulphur_dioxide ?? 3.5) * 10) / 10;

    let label: AirQualityData['label'] = 'Good';
    let color = '#22c55e';
    let description = 'Air quality is satisfactory, and air pollution poses little or no risk.';

    if (usAqi > 300) {
      label = 'Hazardous';
      color = '#7f1d1d';
      description = 'Health warning of emergency conditions. Everyone is more likely to be affected.';
    } else if (usAqi > 200) {
      label = 'Very Unhealthy';
      color = '#9333ea';
      description = 'Health alert: risk of health effects increased for everyone.';
    } else if (usAqi > 150) {
      label = 'Unhealthy';
      color = '#ef4444';
      description = 'Everyone may begin to experience health effects; sensitive groups may experience more serious effects.';
    } else if (usAqi > 100) {
      label = 'Unhealthy for Sensitive';
      color = '#f97316';
      description = 'Members of sensitive groups may experience health effects. General public less affected.';
    } else if (usAqi > 50) {
      label = 'Moderate';
      color = '#eab308';
      description = 'Air quality is acceptable; however, some pollutants may pose moderate health concern.';
    }

    const formatPollutant = (
      val: number,
      goodMax: number,
      fairMax: number,
      unit: string = 'μg/m³',
    ): PollutantDetail => {
      let status: PollutantDetail['status'] = 'Good';
      let pColor = '#22c55e';
      if (val > fairMax * 1.5) {
        status = 'Poor';
        pColor = '#ef4444';
      } else if (val > fairMax) {
        status = 'Moderate';
        pColor = '#f97316';
      } else if (val > goodMax) {
        status = 'Fair';
        pColor = '#eab308';
      }
      return { value: val, unit, status, color: pColor };
    };

    return {
      aqi: usAqi,
      europeanAqi: euAqi,
      label,
      color,
      description,
      pollutants: {
        pm2_5: formatPollutant(pm25Val, 12, 35.4),
        pm10: formatPollutant(pm10Val, 54, 154),
        no2: formatPollutant(no2Val, 53, 100),
        o3: formatPollutant(o3Val, 54, 70),
        so2: formatPollutant(so2Val, 35, 75),
      },
    };
  } catch (err) {
    console.warn('Falling back to default air quality:', err);
    return {
      aqi: 38,
      europeanAqi: 24,
      label: 'Good',
      color: '#22c55e',
      description: 'Air quality is satisfactory, and air pollution poses little or no risk.',
      pollutants: {
        pm2_5: { value: 7.8, unit: 'μg/m³', status: 'Good', color: '#22c55e' },
        pm10: { value: 14.2, unit: 'μg/m³', status: 'Good', color: '#22c55e' },
        no2: { value: 11.5, unit: 'μg/m³', status: 'Good', color: '#22c55e' },
        o3: { value: 42.1, unit: 'μg/m³', status: 'Good', color: '#22c55e' },
        so2: { value: 2.8, unit: 'μg/m³', status: 'Good', color: '#22c55e' },
      },
    };
  }
}

// Search locations worldwide via Open-Meteo Geocoding
export async function searchLocations(query: string): Promise<LocationData[]> {
  if (!query || query.trim().length < 2) return [];

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query.trim());
  url.searchParams.set('count', '8');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString());
  if (!res.ok) return [];

  const data = await res.json();
  if (!data.results || !Array.isArray(data.results)) return [];

  return data.results.map((item: any) => ({
    id: item.id,
    name: item.name,
    region: item.admin1 || item.admin2 || '',
    country: item.country || '',
    countryCode: item.country_code || '',
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone || 'auto',
  }));
}

// Reverse Geocode coordinates to place name using free reverse geocoding
export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationData> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
    );
    if (res.ok) {
      const data = await res.json();
      const cityName =
        data.city || data.locality || data.principalSubdivision || 'Current Location';
      return {
        name: cityName,
        region: data.principalSubdivision || '',
        country: data.countryName || '',
        countryCode: data.countryCode || '',
        latitude,
        longitude,
        isCurrentLocation: true,
      };
    }
  } catch (err) {
    console.warn('Reverse geocode error, fallback to coordinates:', err);
  }

  return {
    name: 'Current Location',
    region: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
    country: '',
    latitude,
    longitude,
    isCurrentLocation: true,
  };
}

// Unit formatters
export function formatTemp(celsius: number, unit: 'celsius' | 'fahrenheit'): string {
  if (unit === 'fahrenheit') {
    return `${Math.round((celsius * 9) / 5 + 32)}°`;
  }
  return `${Math.round(celsius)}°`;
}

export function formatWindSpeed(
  kmh: number,
  unit: 'kmh' | 'mph' | 'ms',
): { value: number; label: string } {
  if (unit === 'mph') {
    return { value: Math.round(kmh * 0.621371 * 10) / 10, label: 'mph' };
  }
  if (unit === 'ms') {
    return { value: Math.round((kmh / 3.6) * 10) / 10, label: 'm/s' };
  }
  return { value: Math.round(kmh * 10) / 10, label: 'km/h' };
}
