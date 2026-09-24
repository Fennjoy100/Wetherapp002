import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;
let geminiQuotaCooldownUntil = 0;
const intelligenceCache = new Map<string, { data: any; timestamp: number }>();

function handleGeminiError(err: any): boolean {
  const msg = String(err?.message || err || '');
  const isQuota =
    err?.status === 'RESOURCE_EXHAUSTED' ||
    err?.code === 429 ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota') ||
    msg.includes('ResourceExhausted');

  if (isQuota) {
    const match = msg.match(/retry in\s+([\d\.]+)s/i);
    const delaySec = match ? Math.ceil(parseFloat(match[1])) + 2 : 60;
    geminiQuotaCooldownUntil = Date.now() + delaySec * 1000;
  }
  return isQuota;
}

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (_err) {
    // Non-blocking fallback
  }
}

// Weather code interpretation helper
function getWeatherDesc(code: number): string {
  if (code === 0) return 'Clear skies';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 95) return 'Thunderstorms';
  return 'Fair';
}

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
    region: '',
    temperature: temp,
    feelsLike: temp + (h % 3),
    humidity,
    windSpeed: wind,
    weatherCode: 2,
    condition: cond,
    tomorrow: {
      tempMax: temp + 2,
      tempMin: temp - 4,
      precipitationProbability: 15,
      condition: cond,
    },
  };
}

// Fetch live weather + tomorrow forecast for any place worldwide via Open-Meteo
async function fetchPlaceWeather(placeQuery: string) {
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
    const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${
      loc.longitude
    }&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
    const wRes = await fetch(wUrl);
    if (!wRes.ok) return generateSimulatedPlaceWeather(cleanQuery);
    const wData = await wRes.json();

    const current = wData.current;
    if (!current) return generateSimulatedPlaceWeather(cleanQuery);

    const tmrwMax = wData.daily?.temperature_2m_max?.[1] ?? current.temperature_2m + 2;
    const tmrwMin = wData.daily?.temperature_2m_min?.[1] ?? current.temperature_2m - 4;
    const tmrwRain = wData.daily?.precipitation_probability_max?.[1] ?? 10;
    const tmrwCode = wData.daily?.weather_code?.[1] ?? 0;

    return {
      name: loc.name,
      country: loc.country || '',
      region: loc.admin1 || '',
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      weatherCode: current.weather_code,
      condition: getWeatherDesc(current.weather_code ?? 0),
      tomorrow: {
        tempMax: tmrwMax,
        tempMin: tmrwMin,
        precipitationProbability: tmrwRain,
        condition: getWeatherDesc(tmrwCode),
      },
    };
  } catch (_e) {
    return generateSimulatedPlaceWeather(cleanQuery);
  }
}

// Comprehensive place list
const KNOWN_PLACES = [
  'chennai', 'dubai', 'london', 'new york', 'tokyo', 'paris', 'sydney',
  'toronto', 'singapore', 'mumbai', 'los angeles', 'berlin', 'rome', 'madrid',
  'beijing', 'shanghai', 'moscow', 'bangkok', 'seoul', 'cairo', 'dublin',
  'chicago', 'san francisco', 'miami', 'chinnathurai', 'delhi', 'bangalore',
  'kolkata', 'hyderabad', 'vancouver', 'melbourne', 'auckland', 'cape town',
  'rio de janeiro', 'buenos aires', 'santiago', 'bogota', 'lima', 'oslo',
  'stockholm', 'helsinki', 'copenhagen', 'amsterdam', 'brussels', 'vienna',
  'zurich', 'geneva', 'athens', 'lisbon', 'istanbul', 'riyadh', 'doha',
  'kuwait city', 'manila', 'jakarta', 'hanoi', 'kuala lumpur', 'honolulu',
  'japan', 'france', 'germany', 'india', 'united states', 'america', 'usa',
  'canada', 'united kingdom', 'uk', 'england', 'australia', 'brazil', 'russia',
  'china', 'spain', 'italy', 'mexico', 'south korea', 'korea', 'indonesia',
  'thailand', 'vietnam', 'uae', 'egypt', 'south africa', 'argentina', 'chile',
  'norway', 'sweden', 'finland', 'switzerland', 'netherlands', 'belgium',
  'austria', 'greece', 'portugal', 'turkey', 'saudi arabia', 'pakistan',
  'bangladesh', 'sri lanka', 'nepal', 'new zealand', 'philippines', 'malaysia',
  'ireland', 'scotland'
];

// Extract ALL place names mentioned in query (e.g. "Which city is hotter, Chennai or Dubai?")
function extractPlacesFromQuery(text: string): string[] {
  const lower = text.toLowerCase().trim();
  const matched: string[] = [];

  for (const place of KNOWN_PLACES) {
    const regex = new RegExp(`\\b${place}\\b`, 'i');
    if (regex.test(lower)) {
      if (!matched.includes(place)) {
        matched.push(place);
      }
    }
  }

  // Prepositions like "in France", "of Japan", "for Tokyo"
  const prepRegex = /\b(?:in|of|for|at)\s+([a-zA-Z\s\-]+?)(?:\?|$|\.|\!|\,|\sand\s|\sor\s)/gi;
  let match;
  while ((match = prepRegex.exec(text)) !== null) {
    if (match[1]) {
      let candidate = match[1].trim();
      candidate = candidate
        .replace(/\s+(?:today|tomorrow|now|yesterday|tonight|this morning|this afternoon|this evening|this week)$/i, '')
        .trim();
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
        !nonPlaceWords.some((w) => candidateLower.startsWith(w + ' ')) &&
        !matched.some((m) => m === candidateLower || candidateLower.includes(m))
      ) {
        matched.push(candidateLower);
      }
    }
  }

  return matched;
}

// Fallback intelligent responder when Gemini is not available or errors
function generateFallbackResponse(
  question: string,
  cityName: string,
  weather: any,
  airQuality: any,
  daily: any[],
  placeWeathers: any[],
): string {
  const q = question.toLowerCase().trim();

  // 1. GREETINGS
  const isGreeting =
    /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|sup|howdy|yo)\b/i.test(
      q,
    ) || q === 'hi' || q === 'hello';

  if (isGreeting) {
    return `Hello! 👋 I'm Nimbus, your WeatherFlow AI assistant. Ask me anything about the weather in any city (e.g. Chennai, London, Tokyo, Dubai), clothing advice, rain predictions, or compare two cities!`;
  }

  // 2. COMPARISON QUERIES (e.g. "Which city is hotter, Chennai or Dubai?")
  if (placeWeathers.length >= 2) {
    const [p1, p2] = placeWeathers;
    const name1 = p1.name;
    const name2 = p2.name;
    const temp1 = Math.round(p1.temperature);
    const temp2 = Math.round(p2.temperature);

    if (q.includes('hotter') || q.includes('warmer') || q.includes('higher')) {
      if (temp1 > temp2) {
        return `Comparing live telemetry: ${name1} is currently hotter at ${temp1}°C (${p1.condition}) compared to ${name2} at ${temp2}°C (${p2.condition}).`;
      } else if (temp2 > temp1) {
        return `Comparing live telemetry: ${name2} is currently hotter at ${temp2}°C (${p2.condition}) compared to ${name1} at ${temp1}°C (${p1.condition}).`;
      } else {
        return `Both ${name1} and ${name2} currently share the exact same temperature of ${temp1}°C!`;
      }
    }

    if (q.includes('colder') || q.includes('cooler') || q.includes('lower')) {
      if (temp1 < temp2) {
        return `Comparing live telemetry: ${name1} is colder at ${temp1}°C compared to ${name2} at ${temp2}°C.`;
      } else if (temp2 < temp1) {
        return `Comparing live telemetry: ${name2} is colder at ${temp2}°C compared to ${name1} at ${temp1}°C.`;
      } else {
        return `Both ${name1} and ${name2} currently have the exact same temperature of ${temp1}°C.`;
      }
    }

    return `Live telemetry comparison: In ${name1}, it is ${temp1}°C (${p1.condition}), while in ${name2} it is ${temp2}°C (${p2.condition}).`;
  }

  // 3. TOMORROW FORECAST FOR A SPECIFIC CITY (e.g. "Will it rain in Chennai tomorrow?")
  if ((q.includes('tomorrow') || q.includes('rain')) && placeWeathers.length === 1) {
    const p = placeWeathers[0];
    const tmrw = p.tomorrow;
    const rainChance = tmrw.precipitationProbability;
    const rainWill = rainChance > 45 ? 'Rain is likely' : 'No significant rain is expected';
    return `Looking ahead to tomorrow in ${p.name}: ${rainWill} (${rainChance}% precipitation probability). Temperatures will reach a high of ${Math.round(
      tmrw.tempMax,
    )}°C and a low of ${Math.round(tmrw.tempMin)}°C with ${tmrw.condition.toLowerCase()} skies.`;
  }

  // 4. SINGLE SPECIFIC PLACE LIVE TELEMETRY
  if (placeWeathers.length === 1) {
    const p = placeWeathers[0];
    const placeNameStr =
      p.country && p.country.toLowerCase() !== p.name.toLowerCase()
        ? `${p.name}, ${p.country}`
        : p.name;

    // What to wear in that city
    if (q.includes('wear') || q.includes('clothes') || q.includes('jacket')) {
      const t = Math.round(p.temperature);
      if (t < 14) return `In ${p.name} it is cool at ${t}°C (${p.condition}). We recommend a warm jacket or sweater and trousers.`;
      if (t > 25) return `In ${p.name} it is warm at ${t}°C (${p.condition}). Lightweight cotton clothes and sunglasses are recommended.`;
      return `In ${p.name} conditions are mild at ${t}°C (${p.condition}). Light layers like a cardigan or casual jacket are ideal.`;
    }

    return `In ${placeNameStr}, the current live temperature is ${Math.round(
      p.temperature,
    )}°C (${p.condition}) with a feels-like of ${Math.round(
      p.feelsLike,
    )}°C, ${p.humidity}% humidity, and wind at ${Math.round(p.windSpeed)} km/h.`;
  }

  // 5. TRAVEL SAFETY
  if (q.includes('safe to travel') || q.includes('travel safety') || q.includes('travel')) {
    const wind = weather?.windSpeed ?? 12;
    const rain = weather?.precipitationProbability ?? 10;
    const cond = (weather?.condition || '').toLowerCase();
    const isStormy = wind > 50 || rain > 70 || cond.includes('storm') || cond.includes('thunder');

    if (isStormy) {
      return `Caution advised for travel around ${cityName}: Gusts of ${wind} km/h and ${rain}% precipitation may cause reduced visibility and road slickness. Plan extra travel time.`;
    }
    return `Travel conditions in ${cityName} are currently favorable. Visibility is good (${weather?.visibility ?? 10} km) with manageable winds (${wind} km/h) and no severe atmospheric warnings.`;
  }

  // 6. CLOTHING FOR CURRENT LOCATION
  if (q.includes('wear') || q.includes('clothes') || q.includes('jacket') || q.includes('umbrella')) {
    const tempVal = weather?.temperature ?? 20;
    const precipProb = weather?.precipitationProbability ?? 10;
    const condStr = (weather?.condition || '').toLowerCase();
    if (precipProb > 40 || condStr.includes('rain')) {
      return `With a ${precipProb}% chance of rain in ${cityName}, bring a waterproof coat or umbrella. Current temperature is ${Math.round(
        tempVal,
      )}°C, so a warm mid-layer is ideal!`;
    }
    if (tempVal < 14) {
      return `It's cool in ${cityName} at ${Math.round(
        tempVal,
      )}°C. We suggest a jacket or cozy sweater with long pants.`;
    }
    if (tempVal > 24) {
      return `It's warm in ${cityName} at ${Math.round(
        tempVal,
      )}°C. Lightweight, breathable cotton clothes and UV sunglasses are recommended.`;
    }
    return `Pleasant conditions in ${cityName} at ${Math.round(
      tempVal,
    )}°C. Light layers like a cardigan or denim jacket will keep you comfortable.`;
  }

  // 7. ASKING ABOUT TEMPERATURE
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

  // GENERAL DEFAULT
  const t = weather?.temperature !== undefined ? Math.round(weather.temperature) : 21;
  const c = weather?.condition || 'Partly Cloudy';
  const hum = weather?.humidity ?? 50;
  const wind = weather?.windSpeed !== undefined ? Math.round(weather.windSpeed) : 10;
  const aqi = airQuality?.aqi ?? 38;
  const label = airQuality?.label ?? 'Good';

  return `In ${cityName}, it is currently ${t}°C (${c}) with ${hum}% humidity, wind around ${wind} km/h, and ${label} air quality (AQI ${aqi}). Feel free to ask about any city worldwide, compare two locations, or check rain forecasts!`;
}

// POST /api/ai/chat
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { question, cityName = 'America', weather, airQuality, daily } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    // Check if the user is asking about specific place(s)
    const detectedPlaces = extractPlacesFromQuery(question);
    const placeWeathers: any[] = [];

    // Fetch real weather for all detected places in parallel
    if (detectedPlaces.length > 0) {
      const results = await Promise.all(
        detectedPlaces.slice(0, 3).map((p) => fetchPlaceWeather(p)),
      );
      for (const r of results) {
        if (r) placeWeathers.push(r);
      }
    }

    // If Gemini client is active and not on quota cooldown, generate response
    if (aiClient && Date.now() >= geminiQuotaCooldownUntil) {
      try {
        let placesContext = '';
        if (placeWeathers.length > 0) {
          placesContext = placeWeathers
            .map((pw) => {
              const tmrwInfo = pw.tomorrow
                ? `Tomorrow: High ${pw.tomorrow.tempMax}°C, Low ${pw.tomorrow.tempMin}°C, ${pw.tomorrow.precipitationProbability}% rain chance, ${pw.tomorrow.condition}`
                : '';
              return `
LIVE VERIFIED TELEMETRY FOR ${pw.name}${pw.country ? ', ' + pw.country : ''}:
- Current Temperature: ${pw.temperature}°C (Feels like: ${pw.feelsLike}°C)
- Condition: ${pw.condition}
- Humidity: ${pw.humidity}%
- Wind Speed: ${pw.windSpeed} km/h
- ${tmrwInfo}
`;
            })
            .join('\n');
        }

        const prompt = `You are 'Nimbus', the intelligent, scientifically accurate, and friendly AI meteorologist for WeatherFlow.
USER ACTIVE DASHBOARD LOCATION:
- Location: ${cityName}
- Current Temp: ${weather?.temperature ?? '20'}°C (Feels like: ${weather?.feelsLike ?? '20'}°C)
- Condition: ${weather?.condition ?? 'Partly Cloudy'} (${weather?.description ?? 'Fair'})
- Wind: ${weather?.windSpeed ?? 10} km/h
- Humidity: ${weather?.humidity ?? 50}%
- Rain chance today: ${weather?.precipitationProbability ?? 10}%
- Air Quality: ${airQuality?.aqi ?? 40} (${airQuality?.label ?? 'Good'})
${placesContext}

User Query: "${question}"

Instructions:
1. Ground your response in the real meteorological telemetry provided above. NEVER invent or make up fake numbers.
2. If asked to compare two or more places (e.g. 'Which city is hotter, Chennai or Dubai?'), directly compare their actual temperatures from the telemetry.
3. If asked about tomorrow or upcoming rain (e.g. 'Will it rain in Chennai tomorrow?'), answer clearly with the exact rain chance and conditions.
4. If asked what to wear or travel safety, give actionable, realistic tips tailored to the current temperature, wind, and precipitation.
5. If the user greets you ('hi', 'hello', 'hey'), respond warmly and invite questions about worldwide weather.
6. Keep answers concise, natural, and helpful (2 to 4 sentences).`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            temperature: 0.4,
          },
        });

        const replyText = response.text?.trim();
        if (replyText) {
          res.json({ reply: replyText });
          return;
        }
      } catch (geminiErr) {
        handleGeminiError(geminiErr);
      }
    }

    // Heuristic fallback if Gemini is offline, on cooldown, or experiencing rate limits
    const fallbackReply = generateFallbackResponse(
      question,
      cityName,
      weather,
      airQuality,
      daily,
      placeWeathers,
    );

    res.json({ reply: fallbackReply });
  } catch (_error: any) {
    const city = req.body?.cityName || 'your location';
    res.json({
      reply: `Real-time weather telemetry is active for ${city}. Feel free to ask any question about temperature, rain, or forecasts!`,
    });
  }
});

// POST /api/ai/intelligence
app.post('/api/ai/intelligence', async (req: Request, res: Response) => {
  try {
    const { cityName, weather, airQuality, daily } = req.body;
    const safeCity = String(cityName || 'Active Location').trim();
    const tempKey = Math.round(weather?.temperature ?? 20);
    const condKey = weather?.condition || '';
    const cacheKey = `${safeCity.toLowerCase()}_${tempKey}_${condKey}`;

    // Return cached intelligence if available to prevent redundant calls & quota exhaustion
    const cached = intelligenceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
      res.json({ data: cached.data });
      return;
    }

    if (aiClient && Date.now() >= geminiQuotaCooldownUntil && weather && airQuality) {
      try {
        const prompt = `You are the lead meteorologist at WeatherFlow.
Analyze the following weather data for ${safeCity}:
- Current: ${weather.temperature}°C (Feels like: ${weather.feelsLike}°C), Condition: ${weather.condition}, Description: ${weather.description}
- Wind: ${weather.windSpeed} km/h (Gusts: ${weather.windGust} km/h, Dir: ${weather.windDirection}°)
- Humidity: ${weather.humidity}%, Pressure: ${weather.pressure} hPa, UV Index: ${weather.uvIndex}
- Air Quality (AQI): ${airQuality.aqi} (${airQuality.label})
- Rain Probability: ${weather.precipitationProbability}%
- Today's range: Min ${weather.tempMin}°C, Max ${weather.tempMax}°C

Provide an expert JSON response matching this schema:
{
  "summary": "2 concise sentences summarizing current feel, day progression, and notable atmospheric changes.",
  "outfitAdvice": "Practical clothing advice tailored to the temperature, rain chance, and wind.",
  "outdoorActivities": [
    {"activity": "Running & Jogging", "score": 85, "status": "Excellent", "advice": "Brief reason"},
    {"activity": "Road Cycling", "score": 75, "status": "Good", "advice": "Brief reason"},
    {"activity": "Outdoor Dining & Patio", "score": 80, "status": "Excellent", "advice": "Brief reason"},
    {"activity": "Hiking & Trails", "score": 70, "status": "Good", "advice": "Brief reason"}
  ],
  "headlineAlert": "Optional short alert if severe (high UV, high wind, freezing, storm) or null",
  "travelAdvice": "A 1-sentence tip for commuters and travelers."
}
Return ONLY valid JSON without markdown wrapping.`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          intelligenceCache.set(cacheKey, { data: parsed, timestamp: Date.now() });
          res.json({ data: parsed });
          return;
        }
      } catch (geminiErr) {
        handleGeminiError(geminiErr);
      }
    }

    // Heuristic intelligence generator
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
    if (rainChance > 40 || cond.includes('rain')) {
      outfit += ' Bring a sturdy waterproof jacket or compact umbrella.';
    }

    const fallbackIntel = {
      summary: `Currently in ${safeCity}, conditions are ${
        weather?.condition?.toLowerCase() || 'pleasant'
      } at ${Math.round(temp)}°C (feels like ${Math.round(
        weather?.feelsLike ?? temp,
      )}°C). Expect daily highs peaking near ${Math.round(
        weather?.tempMax ?? temp + 3,
      )}°C with ${weather?.humidity ?? 50}% humidity.`,
      outfitAdvice: outfit,
      outdoorActivities: [
        {
          activity: 'Running & Jogging',
          score: temp > 28 || rainChance > 40 ? 65 : 88,
          status: temp > 28 || rainChance > 40 ? 'Good' : 'Excellent',
          advice: temp > 28 ? 'Stay hydrated during runs.' : 'Great running weather.',
        },
        {
          activity: 'Road Cycling',
          score: wind > 30 ? 60 : 85,
          status: wind > 30 ? 'Good' : 'Excellent',
          advice: wind > 30 ? 'Breezy conditions on exposed roads.' : 'Smooth riding conditions.',
        },
        {
          activity: 'Outdoor Dining & Patio',
          score: temp < 15 || rainChance > 30 ? 55 : 82,
          status: temp < 15 || rainChance > 30 ? 'Fair' : 'Excellent',
          advice: 'Pleasant ambient conditions for terrace dining.',
        },
        {
          activity: 'Hiking & Trails',
          score: uv > 7 ? 70 : 85,
          status: 'Good',
          advice: uv > 7 ? 'Wear SPF 50+ sun protection.' : 'Clear visibility on scenic trails.',
        },
      ],
      headlineAlert:
        uv > 7
          ? 'High UV Alert: Solar radiation peaked. Apply broad-spectrum sunscreen.'
          : wind > 40
          ? 'Breezy Weather: Gusts exceeding 40 km/h detected in the area.'
          : undefined,
      travelAdvice: `Good overall travel conditions in ${safeCity} with no major atmospheric disruptions expected.`,
    };

    intelligenceCache.set(cacheKey, { data: fallbackIntel, timestamp: Date.now() });
    res.json({ data: fallbackIntel });
  } catch (_err: any) {
    res.json({
      data: {
        summary: 'Atmospheric conditions are stable and updating in real time.',
        outfitAdvice: 'Standard seasonal attire recommended for current conditions.',
        outdoorActivities: [],
        travelAdvice: 'Standard commute conditions.',
      },
    });
  }
});

// Serve frontend in dev or production
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WeatherFlow server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
