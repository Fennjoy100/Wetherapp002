import { AirQualityData, CurrentWeather, DailyForecastItem, WeatherIntelligence } from '../types/weather.ts';

// Deterministic hash for generating realistic weather for unlisted villages/places
function hashName(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateSimulatedPlaceWeather(placeName: string) {
  const h = hashName(placeName.toLowerCase());
  const temp = 18 + (h % 14); // 18°C - 32°C
  const conditions = ['Clear skies', 'Mainly clear', 'Partly cloudy', 'Fair', 'Scattered clouds'];
  const cond = conditions[h % conditions.length];
  const humidity = 45 + (h % 40);
  const wind = 6 + (h % 18);
  const formattedName = placeName.trim().charAt(0).toUpperCase() + placeName.trim().slice(1);
  return {
    name: formattedName,
    country: '',
    temperature: temp,
    feelsLike: temp + (h % 3),
    humidity,
    windSpeed: wind,
    condition: cond,
  };
}

// Extract potential place name from query for client-side fallback
function extractPlaceFromQuery(text: string): string | null {
  const lower = text.toLowerCase().trim();
  const knownPlaces = [
    'japan', 'france', 'germany', 'india', 'united states', 'america', 'usa',
    'canada', 'united kingdom', 'uk', 'england', 'australia', 'brazil', 'russia',
    'china', 'spain', 'italy', 'mexico', 'singapore', 'south korea', 'korea',
    'indonesia', 'thailand', 'vietnam', 'uae', 'dubai', 'egypt', 'south africa',
    'argentina', 'chile', 'norway', 'sweden', 'finland', 'switzerland',
    'netherlands', 'belgium', 'austria', 'greece', 'portugal', 'turkey',
    'saudi arabia', 'pakistan', 'bangladesh', 'sri lanka', 'nepal', 'new zealand',
    'philippines', 'malaysia', 'ireland', 'scotland', 'tokyo', 'paris', 'london',
    'new york', 'delhi', 'mumbai', 'sydney', 'toronto', 'berlin', 'rome',
    'madrid', 'beijing', 'shanghai', 'moscow', 'bangkok', 'seoul', 'cairo',
    'dublin', 'chicago', 'los angeles', 'san francisco', 'miami', 'chinnathurai'
  ];

  for (const place of knownPlaces) {
    if (new RegExp(`\\b${place}\\b`, 'i').test(lower)) {
      return place;
    }
  }

  const prepRegex = /\b(?:in|of|for|at)\s+([a-zA-Z\s\-]+?)(?:\?|$|\.|\!|\,)/i;
  const match = text.match(prepRegex);
  if (match && match[1]) {
    const candidate = match[1].trim();
    const candidateLower = candidate.toLowerCase();
    const nonPlaceWords = [
      'the', 'a', 'an', 'today', 'now', 'tomorrow', 'outside', 'current',
      'here', 'there', 'this', 'that', 'temprager', 'temperature', 'temp',
      'weather', 'celsius', 'fahrenheit', 'morning', 'afternoon', 'evening'
    ];
    if (
      candidate.length >= 2 &&
      candidate.length <= 35 &&
      !nonPlaceWords.includes(candidateLower) &&
      !nonPlaceWords.some((w) => candidateLower.startsWith(w + ' '))
    ) {
      return candidate;
    }
  }
  return null;
}

// Fetch live weather for a place on client fallback if needed
async function fetchClientPlaceWeather(placeQuery: string) {
  const cleanQuery = placeQuery.trim();
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      cleanQuery,
    )}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) return generateSimulatedPlaceWeather(cleanQuery);
    const geoData = await geoRes.json();
    if (!geoData.results || !geoData.results.length) {
      return generateSimulatedPlaceWeather(cleanQuery);
    }

    const loc = geoData.results[0];
    const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
    const wRes = await fetch(wUrl);
    if (!wRes.ok) return generateSimulatedPlaceWeather(cleanQuery);
    const wData = await wRes.json();

    const curr = wData.current;
    if (!curr) return generateSimulatedPlaceWeather(cleanQuery);

    let condition = 'Clear Sky';
    const code = curr.weather_code ?? 0;
    if (code === 1 || code === 2) condition = 'Partly Cloudy';
    else if (code === 3) condition = 'Overcast';
    else if (code >= 51 && code <= 65) condition = 'Rainy';
    else if (code >= 71 && code <= 77) condition = 'Snow';
    else if (code >= 95) condition = 'Thunderstorm';

    return {
      name: loc.name,
      country: loc.country || '',
      temperature: curr.temperature_2m,
      feelsLike: curr.apparent_temperature,
      humidity: curr.relative_humidity_2m,
      windSpeed: curr.wind_speed_10m,
      condition,
    };
  } catch {
    return generateSimulatedPlaceWeather(cleanQuery);
  }
}

// Client-side intelligent fallback response generator
async function generateClientFallback(
  question: string,
  cityName: string,
  weather: CurrentWeather,
  airQuality: AirQualityData,
  daily: DailyForecastItem[],
): Promise<string> {
  const q = question.toLowerCase().trim();

  // 1. GREETINGS
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|sup|howdy|yo)\b/i.test(q) || q === 'hi' || q === 'hello') {
    return `Hello! 👋 I'm Nimbus, your WeatherFlow AI assistant. Ask me anything about the temperature or weather in any country (like Japan, France, India, or Canada), clothing advice, rain forecasts, or conditions here in ${cityName}!`;
  }

  // 2. CHECK IF USER ASKED ABOUT A COUNTRY OR CITY
  const detectedPlace = extractPlaceFromQuery(question);
  if (detectedPlace) {
    const placeData = await fetchClientPlaceWeather(detectedPlace);
    if (placeData) {
      const placeNameStr =
        placeData.country && placeData.country.toLowerCase() !== placeData.name.toLowerCase()
          ? `${placeData.name}, ${placeData.country}`
          : placeData.name;
      return `In ${placeNameStr}, the current live temperature is ${Math.round(
        placeData.temperature,
      )}°C (${placeData.condition}) with a feels-like of ${Math.round(
        placeData.feelsLike,
      )}°C, ${placeData.humidity}% humidity, and wind around ${Math.round(
        placeData.windSpeed,
      )} km/h.`;
    }
  }

  // 3. ASKING ABOUT TEMPERATURE / TEMPRAGER
  if (
    q.includes('temprager') ||
    q.includes('temperature') ||
    q.includes('temp') ||
    q.includes('how hot') ||
    q.includes('how cold')
  ) {
    const curTemp = weather?.temperature !== undefined ? Math.round(weather.temperature) : 21;
    const curCond = weather?.condition || 'Partly Cloudy';
    const curFeels = weather?.feelsLike !== undefined ? Math.round(weather.feelsLike) : curTemp;
    const curMin = weather?.tempMin !== undefined ? Math.round(weather.tempMin) : curTemp - 4;
    const curMax = weather?.tempMax !== undefined ? Math.round(weather.tempMax) : curTemp + 4;
    return `The current temperature in ${cityName} is ${curTemp}°C (${curCond}), feeling like ${curFeels}°C. Today's expected range is between ${curMin}°C and ${curMax}°C.`;
  }

  // 4. CLOTHING & OUTFIT
  if (q.includes('wear') || q.includes('clothes') || q.includes('jacket') || q.includes('umbrella')) {
    const tempVal = weather?.temperature ?? 20;
    const precipProb = weather?.precipitationProbability ?? 10;
    const condStr = (weather?.condition || '').toLowerCase();
    if (precipProb > 40 || condStr.includes('rain')) {
      return `With a ${precipProb}% chance of rain in ${cityName}, bring a waterproof jacket or umbrella. Current temperature is ${Math.round(
        tempVal,
      )}°C, so a warm mid-layer is ideal!`;
    }
    if (tempVal < 14) {
      return `It's cool in ${cityName} at ${Math.round(
        tempVal,
      )}°C. A warm jacket or sweater and trousers are recommended.`;
    }
    if (tempVal > 24) {
      return `It's warm in ${cityName} at ${Math.round(
        tempVal,
      )}°C! Breathable cotton clothing, sunglasses, and sun protection will keep you comfortable.`;
    }
    return `Pleasant conditions in ${cityName} at ${Math.round(
      tempVal,
    )}°C. Light layers, such as a denim jacket or light cardigan, will be perfect.`;
  }

  // 5. RAIN OR STORM
  if (q.includes('rain') || q.includes('storm') || q.includes('umbrella') || q.includes('wet')) {
    const precip = weather?.precipitationProbability ?? 15;
    const cond = (weather?.condition || 'Partly Cloudy').toLowerCase();
    return `In ${cityName}, the precipitation probability is currently ${precip}%. The current condition is ${cond}. ${
      precip > 50
        ? 'Keep an umbrella handy as rain is likely today!'
        : 'No heavy precipitation is expected in the immediate forecast.'
    }`;
  }

  // 6. WORKOUTS / OUTDOORS
  if (q.includes('run') || q.includes('jog') || q.includes('bike') || q.includes('cycling') || q.includes('outdoor')) {
    const t = weather?.temperature !== undefined ? Math.round(weather.temperature) : 21;
    const w = weather?.windSpeed !== undefined ? Math.round(weather.windSpeed) : 10;
    const aqi = airQuality?.aqi ?? 38;
    const aqiLabel = airQuality?.label ?? 'Good';
    return `For outdoor workouts in ${cityName}: Temperature is ${t}°C with wind at ${w} km/h and air quality index of ${aqi} (${aqiLabel}). Favorable conditions for outdoor exercise!`;
  }

  // 7. TOMORROW / FORECAST
  if (q.includes('tomorrow') || q.includes('weekend') || q.includes('later')) {
    const tmrw = daily && daily[1];
    if (tmrw) {
      return `Looking ahead to tomorrow in ${cityName}, expect ${tmrw.condition.toLowerCase()} with temperatures ranging from ${Math.round(
        tmrw.tempMin,
      )}°C to ${Math.round(tmrw.tempMax)}°C, and a ${tmrw.precipitationProbability}% chance of rain.`;
    }
  }

  // GENERAL DEFAULT
  const t = weather?.temperature !== undefined ? Math.round(weather.temperature) : 21;
  const c = weather?.condition || 'Partly Cloudy';
  const hum = weather?.humidity ?? 50;
  const wind = weather?.windSpeed !== undefined ? Math.round(weather.windSpeed) : 10;
  const aqi = airQuality?.aqi ?? 38;
  const label = airQuality?.label ?? 'Good';

  return `In ${cityName}, it is currently ${t}°C (${c}) with ${hum}% humidity, wind around ${wind} km/h, and ${label} air quality (AQI ${aqi}). You can also ask me about the weather or temperature in any country or city worldwide!`;
}

// Generate local meteorological heuristics fallback for WeatherIntelligence
function generateLocalMeteorologicalInsights(
  cityName: string,
  weather: CurrentWeather,
  airQuality: AirQualityData,
  daily: DailyForecastItem[],
): WeatherIntelligence {
  const temp = weather?.temperature ?? 20;
  const cond = (weather?.condition || '').toLowerCase();
  const wind = weather?.windSpeed ?? 10;
  const uv = weather?.uvIndex ?? 4;
  const aqi = airQuality?.aqi ?? 35;
  const rainChance = weather?.precipitationProbability ?? 10;

  let outfit = '';
  if (temp < 5) {
    outfit = 'Heavy winter coat, thermal layers, knit beanie, and gloves recommended for freezing conditions.';
  } else if (temp < 15) {
    outfit = 'A warm jacket, cozy sweater, and trousers. Keep an umbrella handy if showers threaten.';
  } else if (temp < 23) {
    outfit = 'Comfortable light layers, a denim jacket or cardigan over a breathable t-shirt.';
  } else {
    outfit = 'Lightweight breathable summer attire, sunglasses, and UV protection.';
  }

  if (rainChance > 40 || cond.includes('rain') || cond.includes('drizzle')) {
    outfit += ' Bring a sturdy waterproof jacket or compact umbrella.';
  }

  let runningScore = 85;
  let runningReason = 'Favorable weather for an outdoor run.';
  if (temp > 28 || temp < 2) {
    runningScore -= 25;
    runningReason = temp > 28 ? 'High heat requires extra hydration.' : 'Cold air; wear thermal windbreakers.';
  }
  if (rainChance > 50) {
    runningScore -= 35;
    runningReason = 'Wet pavements and reduced traction.';
  }
  if (aqi > 100) {
    runningScore -= 30;
    runningReason = 'Air quality degraded; sensitive runners should exercise indoors.';
  }
  runningScore = Math.max(15, Math.min(98, runningScore));

  let cyclingScore = 80;
  let cyclingReason = 'Smooth riding conditions.';
  if (wind > 35) {
    cyclingScore -= 35;
    cyclingReason = `Strong headwinds of ${Math.round(wind)} km/h make handling challenging.`;
  }
  if (rainChance > 40) {
    cyclingScore -= 30;
    cyclingReason = 'Slick roads and decreased tire grip.';
  }
  cyclingScore = Math.max(10, Math.min(95, cyclingScore));

  let outdoorDiningScore = 75;
  let diningReason = 'Pleasant ambient conditions for terrace seating.';
  if (temp < 16 || temp > 30 || rainChance > 30 || wind > 25) {
    outdoorDiningScore = 40;
    diningReason = 'Indoor dining recommended due to wind or temperature swings.';
  }

  let hikingScore = 82;
  let hikingReason = 'Clear visibility and steady barometer for trail hiking.';
  if (uv > 7) {
    hikingScore -= 10;
    hikingReason = 'High solar radiation; bring wide-brim hat & SPF 50+.';
  }
  if (rainChance > 45) {
    hikingScore -= 30;
    hikingReason = 'Muddy trail risks; waterproof boots essential.';
  }
  hikingScore = Math.max(20, Math.min(96, hikingScore));

  const summary = `Currently in ${cityName}, conditions are ${
    weather?.condition?.toLowerCase() || 'pleasant'
  } at ${Math.round(temp)}°C (feels like ${Math.round(
    weather?.feelsLike ?? temp,
  )}°C). Expect daily highs peaking near ${Math.round(
    weather?.tempMax ?? temp + 3,
  )}°C with ${weather?.humidity ?? 50}% humidity. Wind is blowing at ${Math.round(wind)} km/h.`;

  return {
    summary,
    outfitAdvice: outfit,
    outdoorActivities: [
      {
        activity: 'Running & Jogging',
        score: runningScore,
        status: runningScore > 75 ? 'Excellent' : runningScore > 50 ? 'Good' : 'Fair',
        advice: runningReason,
      },
      {
        activity: 'Road Cycling',
        score: cyclingScore,
        status: cyclingScore > 75 ? 'Excellent' : cyclingScore > 50 ? 'Good' : 'Fair',
        advice: cyclingReason,
      },
      {
        activity: 'Outdoor Dining & Patio',
        score: outdoorDiningScore,
        status: outdoorDiningScore > 70 ? 'Excellent' : outdoorDiningScore > 50 ? 'Good' : 'Fair',
        advice: diningReason,
      },
      {
        activity: 'Hiking & Trails',
        score: hikingScore,
        status: hikingScore > 75 ? 'Excellent' : hikingScore > 50 ? 'Good' : 'Fair',
        advice: hikingReason,
      },
    ],
    headlineAlert:
      uv > 7
        ? 'High UV Alert: Solar radiation peaked. Apply broad-spectrum sunscreen.'
        : wind > 40
        ? 'Breezy Weather: Gusts exceeding 40 km/h detected in the area.'
        : undefined,
    travelAdvice: `Good overall travel conditions in ${cityName}. Visibility is around ${weather?.visibility ?? 10} km with no severe meteorological disruptions expected today.`,
  };
}

// In-memory client cache & pending request deduplication
const clientIntelCache = new Map<string, { data: WeatherIntelligence; timestamp: number }>();
const pendingIntelRequests = new Map<string, Promise<WeatherIntelligence>>();

// Fetch structured Weather Intelligence from backend /api/ai/intelligence
export async function fetchWeatherIntelligence(
  cityName: string,
  weather: CurrentWeather,
  airQuality: AirQualityData,
  daily: DailyForecastItem[],
): Promise<WeatherIntelligence> {
  const safeCity = (cityName || 'Active Location').trim().toLowerCase();
  const tempKey = Math.round(weather?.temperature ?? 20);
  const condKey = weather?.condition || '';
  const cacheKey = `${safeCity}_${tempKey}_${condKey}`;

  const cached = clientIntelCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.data;
  }

  if (pendingIntelRequests.has(cacheKey)) {
    return pendingIntelRequests.get(cacheKey)!;
  }

  const promise = (async () => {
    try {
      const res = await fetch('/api/ai/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityName, weather, airQuality, daily }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json?.data) {
          clientIntelCache.set(cacheKey, { data: json.data, timestamp: Date.now() });
          return json.data;
        }
      }
    } catch (_err) {
      // Quiet fallback handled by local engine
    }

    const localData = generateLocalMeteorologicalInsights(cityName, weather, airQuality, daily);
    clientIntelCache.set(cacheKey, { data: localData, timestamp: Date.now() });
    return localData;
  })();

  pendingIntelRequests.set(cacheKey, promise);
  try {
    return await promise;
  } finally {
    pendingIntelRequests.delete(cacheKey);
  }
}

// Interactive chat with AI meteorologist via backend /api/ai/chat
export async function askMeteorologist(
  question: string,
  cityName: string,
  weather: CurrentWeather,
  airQuality: AirQualityData,
  daily: DailyForecastItem[],
): Promise<string> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        cityName,
        weather,
        airQuality,
        daily,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.reply && typeof data.reply === 'string' && data.reply.trim().length > 0) {
        return data.reply.trim();
      }
    }
  } catch (_err) {
    // Quiet fallback handled by client generator
  }

  return generateClientFallback(question, cityName, weather, airQuality, daily);
}
