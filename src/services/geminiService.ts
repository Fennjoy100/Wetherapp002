import { GoogleGenAI } from '@google/genai';
import { AirQualityData, CurrentWeather, DailyForecastItem, WeatherIntelligence } from '../types/weather.ts';

const apiKey = process.env.GEMINI_API_KEY || '';

let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (e) {
    console.warn('Gemini client init skipped:', e);
  }
}

// Generate realistic meteorological heuristics fallback
function generateLocalMeteorologicalInsights(
  cityName: string,
  weather: CurrentWeather,
  airQuality: AirQualityData,
  daily: DailyForecastItem[],
): WeatherIntelligence {
  const temp = weather.temperature;
  const cond = weather.condition.toLowerCase();
  const wind = weather.windSpeed;
  const uv = weather.uvIndex;
  const aqi = airQuality.aqi;
  const rainChance = weather.precipitationProbability;

  // Outfit recommendation logic
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

  // Outdoor activity scores
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
    cyclingReason = `Strong headwinds of ${wind} km/h make handling challenging.`;
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

  const summary = `Currently in ${cityName}, conditions are ${weather.condition.toLowerCase()} at ${Math.round(
    temp,
  )}°C (feels like ${Math.round(weather.feelsLike)}°C). Expect daily highs peaking near ${Math.round(
    weather.tempMax,
  )}°C with ${weather.humidity}% humidity. Wind is currently blowing at ${weather.windSpeed} km/h.`;

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
      weather.uvIndex > 7
        ? 'High UV Alert: Solar radiation peaked. Apply broad-spectrum sunscreen.'
        : weather.windSpeed > 40
        ? 'Breezy Weather: Gusts exceeding 40 km/h detected in the area.'
        : undefined,
    travelAdvice: `Good overall travel conditions in ${cityName}. Visibility is around ${weather.visibility} km with no severe meteorological disruptions expected today.`,
  };
}

export async function fetchWeatherIntelligence(
  cityName: string,
  weather: CurrentWeather,
  airQuality: AirQualityData,
  daily: DailyForecastItem[],
): Promise<WeatherIntelligence> {
  if (aiClient) {
    try {
      const prompt = `You are the lead meteorologist at WeatherFlow.
Analyze the following weather data for ${cityName}:
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
          temperature: 0.4,
        },
      });

      if (response?.text) {
        const parsed = JSON.parse(response.text);
        return parsed;
      }
    } catch (err) {
      console.warn('Gemini request encountered issue, using smart meteorology engine:', err);
    }
  }

  // Graceful local smart fallback
  return generateLocalMeteorologicalInsights(cityName, weather, airQuality, daily);
}

// Interactive chat with AI meteorologist
export async function askMeteorologist(
  question: string,
  cityName: string,
  weather: CurrentWeather,
  airQuality: AirQualityData,
  daily: DailyForecastItem[],
): Promise<string> {
  if (aiClient) {
    try {
      const prompt = `You are 'Nimbus', the smart AI meteorologist for WeatherFlow.
You provide clear, friendly, and scientifically grounded weather answers.
Current Location: ${cityName}
Current Temperature: ${weather.temperature}°C (Feels like: ${weather.feelsLike}°C)
Condition: ${weather.condition} (${weather.description})
Wind: ${weather.windSpeed} km/h
Humidity: ${weather.humidity}%
Precipitation chance: ${weather.precipitationProbability}%
UV Index: ${weather.uvIndex}
Air Quality Index: ${airQuality.aqi} (${airQuality.label})
Next 3 days highs/lows: ${daily.slice(0, 3).map(d => `${d.dayName}: ${d.tempMin}°C - ${d.tempMax}°C, ${d.condition}`).join('; ')}

User question: "${question}"

Provide a concise, helpful answer (2-4 sentences max). Be conversational, accurate, and give practical tips when relevant.`;

      const res = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.5,
        },
      });

      if (res?.text) {
        return res.text.trim();
      }
    } catch (e) {
      console.warn('AI chat error, using local reply:', e);
    }
  }

  // Local meteorological intelligent reply
  const q = question.toLowerCase();
  if (q.includes('wear') || q.includes('clothes') || q.includes('jacket') || q.includes('umbrella')) {
    if (weather.precipitationProbability > 40 || weather.condition.toLowerCase().includes('rain')) {
      return `With a ${weather.precipitationProbability}% chance of rain in ${cityName}, make sure to grab a waterproof jacket or umbrella. Current temperature is ${weather.temperature}°C, so a comfortable mid-layer underneath will keep you cozy!`;
    }
    if (weather.temperature < 14) {
      return `It's on the cooler side in ${cityName} at ${weather.temperature}°C. A warm jacket or sweater and long pants are recommended for staying comfortable outside.`;
    }
    if (weather.temperature > 24) {
      return `It's warm in ${cityName} at ${weather.temperature}°C! Breathable cotton clothing, sunglasses, and sun protection will keep you feeling refreshed.`;
    }
    return `Mild conditions at ${weather.temperature}°C in ${cityName}. Light layers, such as a denim jacket or light cardigan, will be perfect throughout the day.`;
  }

  if (q.includes('rain') || q.includes('storm') || q.includes('umbrella') || q.includes('wet')) {
    return `In ${cityName}, the precipitation probability is currently ${weather.precipitationProbability}%. The current condition is ${weather.condition.toLowerCase()}. ${
      weather.precipitationProbability > 50
        ? 'Keep an umbrella at hand as rain is quite likely today!'
        : 'Scattered or no significant showers are expected right now, but check the hourly forecast for shifting fronts.'
    }`;
  }

  if (q.includes('run') || q.includes('jog') || q.includes('bike') || q.includes('cycling') || q.includes('outdoor')) {
    return `For outdoor workouts in ${cityName}: Temperature is ${weather.temperature}°C with wind at ${weather.windSpeed} km/h and air quality index of ${airQuality.aqi} (${airQuality.label}). Overall conditions are favorable, especially during morning or late afternoon hours!`;
  }

  if (q.includes('tomorrow') || q.includes('weekend') || q.includes('later')) {
    const tmrw = daily[1];
    if (tmrw) {
      return `Looking ahead to tomorrow in ${cityName}, expect ${tmrw.condition.toLowerCase()} with temperatures ranging from a low of ${tmrw.tempMin}°C to a high of ${tmrw.tempMax}°C, and a ${tmrw.precipitationProbability}% chance of rain.`;
    }
  }

  return `In ${cityName}, it is currently ${weather.temperature}°C (${weather.condition}) with ${weather.humidity}% humidity, wind around ${weather.windSpeed} km/h, and ${airQuality.label} air quality (AQI ${airQuality.aqi}). Feel free to ask about clothing, rain timing, or outdoor activities!`;
}
