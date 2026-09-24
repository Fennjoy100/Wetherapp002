export type TempUnit = 'celsius' | 'fahrenheit';
export type WindUnit = 'kmh' | 'mph' | 'ms';

export interface LocationData {
  id?: number;
  name: string;
  region?: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  isCurrentLocation?: boolean;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  weatherCode: number;
  condition: string;
  description: string;
  iconName: string;
  isDay: boolean;
  humidity: number;
  dewPoint: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  windGust: number;
  uvIndex: number;
  visibility: number; // in km
  cloudCover: number; // percentage
  precipitationProbability: number; // percentage
  precipitationAmount: number; // in mm
  sunrise: string; // ISO string or local time
  sunset: string; // ISO string or local time
  daylightDuration: number; // in seconds
  solarNoon: string;
  moonPhase: {
    phaseName: string;
    illumination: number;
    icon: string;
  };
}

export interface HourlyForecastItem {
  time: string;
  hour: string;
  temperature: number;
  feelsLike: number;
  weatherCode: number;
  condition: string;
  iconName: string;
  precipitationProbability: number;
  windSpeed: number;
  isDay: boolean;
  humidity: number;
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  fullDate: string;
  weatherCode: number;
  condition: string;
  description: string;
  iconName: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  precipitationSum: number;
  windSpeedMax: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
}

export interface PollutantDetail {
  value: number;
  unit: string;
  status: 'Good' | 'Fair' | 'Moderate' | 'Poor' | 'Very Poor';
  color: string;
}

export interface AirQualityData {
  aqi: number; // US AQI scale (0-500)
  europeanAqi: number;
  label: 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  color: string;
  description: string;
  pollutants: {
    pm2_5: PollutantDetail;
    pm10: PollutantDetail;
    no2: PollutantDetail;
    o3: PollutantDetail;
    so2: PollutantDetail;
  };
}

export interface WeatherIntelligence {
  summary: string;
  outfitAdvice: string;
  outdoorActivities: {
    activity: string;
    score: number; // 0 - 100
    status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    advice: string;
  }[];
  headlineAlert?: string;
  travelAdvice: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  preferredUnit: TempUnit;
  preferredWindUnit: WindUnit;
  savedLocations: LocationData[];
  isGuest?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
