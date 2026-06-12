/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherData, GeocodingResult, CurrentWeather, DailyForecast, HourlyTrend } from "../types";

/**
 * WMO Weather interpretation codes (WW) details
 */
export interface WeatherCodeInfo {
  description: string;
  iconName: string; // Mapped to Lucide icons
  bgGradient: string; // Sleek modern Tailwind gradient classes
  colorClass: string; // Main icon/accent color
  cloudAnimation: string; // Custom visual flair
}

export function getWeatherInfo(code: number, isDay: boolean = true): WeatherCodeInfo {
  // Map weather codes to custom user-friendly styling and descriptive text
  switch (code) {
    case 0:
      return {
        description: isDay ? "Clear Sky" : "Clear Night",
        iconName: isDay ? "Sun" : "Moon",
        bgGradient: isDay ? "from-amber-400 to-orange-500" : "from-indigo-900 to-slate-950",
        colorClass: isDay ? "text-amber-400" : "text-sky-200",
        cloudAnimation: "animate-pulse"
      };
    case 1:
      return {
        description: isDay ? "Mainly Clear" : "Clear Sky",
        iconName: isDay ? "Sun" : "Moon",
        bgGradient: isDay ? "from-yellow-400 to-amber-500" : "from-indigo-800 to-slate-900",
        colorClass: isDay ? "text-yellow-400" : "text-indigo-200",
        cloudAnimation: ""
      };
    case 2:
      return {
        description: "Partly Cloudy",
        iconName: "CloudSun",
        bgGradient: "from-sky-500 to-slate-600",
        colorClass: "text-sky-300",
        cloudAnimation: "animate-bounce"
      };
    case 3:
      return {
        description: "Overcast",
        iconName: "Cloud",
        bgGradient: "from-slate-500 to-slate-700",
        colorClass: "text-slate-300",
        cloudAnimation: ""
      };
    case 45:
    case 48:
      return {
        description: code === 45 ? "Foggy" : "Depositing Rime Fog",
        iconName: "CloudFog",
        bgGradient: "from-zinc-500 to-slate-600",
        colorClass: "text-zinc-300",
        cloudAnimation: ""
      };
    case 51:
    case 53:
    case 55:
      return {
        description: `${code === 51 ? "Light" : code === 53 ? "Moderate" : "Dense"} Drizzle`,
        iconName: "CloudDrizzle",
        bgGradient: "from-blue-400 to-slate-600",
        colorClass: "text-teal-300",
        cloudAnimation: ""
      };
    case 56:
    case 57:
      return {
        description: "Freezing Drizzle",
        iconName: "CloudSnow",
        bgGradient: "from-cyan-500 to-blue-700",
        colorClass: "text-cyan-200",
        cloudAnimation: ""
      };
    case 61:
    case 63:
    case 65:
      return {
        description: `${code === 61 ? "Slight" : code === 63 ? "Moderate" : "Heavy"} Rain`,
        iconName: "CloudRain",
        bgGradient: "from-blue-500 to-slate-750",
        colorClass: "text-blue-400",
        cloudAnimation: ""
      };
    case 66:
    case 67:
      return {
        description: "Freezing Rain",
        iconName: "CloudSnow",
        bgGradient: "from-indigo-600 to-cyan-700",
        colorClass: "text-cyan-300",
        cloudAnimation: ""
      };
    case 71:
    case 73:
    case 75:
      return {
        description: `${code === 71 ? "Slight" : code === 73 ? "Moderate" : "Heavy"} Snowfall`,
        iconName: "Snowflake",
        bgGradient: "from-violet-400 to-cyan-500",
        colorClass: "text-cyan-100",
        cloudAnimation: ""
      };
    case 77:
      return {
        description: "Snow Grains",
        iconName: "Snowflake",
        bgGradient: "from-slate-400 to-cyan-600",
        colorClass: "text-cyan-200",
        cloudAnimation: ""
      };
    case 80:
    case 81:
    case 82:
      return {
        description: `${code === 80 ? "Slight" : code === 81 ? "Moderate" : "Violent"} Rain Showers`,
        iconName: "CloudRainWind",
        bgGradient: "from-blue-600 to-indigo-850",
        colorClass: "text-blue-300",
        cloudAnimation: ""
      };
    case 85:
    case 86:
      return {
        description: `${code === 85 ? "Slight" : "Heavy"} Snow Showers`,
        iconName: "CloudSnow",
        bgGradient: "from-cyan-400 to-blue-650",
        colorClass: "text-cyan-100",
        cloudAnimation: ""
      };
    case 95:
      return {
        description: "Thunderstorm",
        iconName: "CloudLightning",
        bgGradient: "from-purple-800 to-indigo-950",
        colorClass: "text-yellow-400",
        cloudAnimation: ""
      };
    case 96:
    case 99:
      return {
        description: `Thunderstorm with ${code === 96 ? "Slight" : "Heavy"} Hail`,
        iconName: "CloudLightning",
        bgGradient: "from-fuchsia-800 to-slate-950",
        colorClass: "text-amber-300",
        cloudAnimation: ""
      };
    default:
      return {
        description: "Unknown Conditions",
        iconName: "Cloudy",
        bgGradient: "from-slate-400 to-slate-600",
        colorClass: "text-slate-300",
        cloudAnimation: ""
      };
  }
}

/**
 * Regex parser for coordinates input. Matches formats:
 * - "40.7128, -74.0060"
 * - "40.7128 -74.0060"
 */
export function parseCoordinates(query: string): { latitude: number; longitude: number } | null {
  const normalized = query.trim();
  const regex = /^\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*$/;
  const match = normalized.match(regex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { latitude: lat, longitude: lon };
    }
  }
  return null;
}

/**
 * Advanced parser that extracts location coordinates from common Google Maps & Apple Maps link parameters,
 * as well as direct decimal combinations.
 * Examples matching:
 * - https://www.google.com/maps/@37.7749,-122.4194,15z
 * - https://www.google.com/maps/place/San+Francisco,+CA/@37.7749,-122.4194,10z/data=...
 * - https://maps.apple.com/?ll=37.7749,-122.4194
 * - maps.google.com?q=37.7749,-122.4194
 */
export function parseGoogleMapsUrl(query: string): { latitude: number; longitude: number; name: string } | null {
  const trimmed = query.trim();

  // 1. Detect Standard Google Maps @latitude,longitude formats
  const atMatch = trimmed.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lon = parseFloat(atMatch[2]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      // Extract place name segment if available
      let name = "Google Maps Pin";
      const placeSegment = trimmed.match(/\/place\/([^/]+)/);
      if (placeSegment && placeSegment[1]) {
        try {
          name = decodeURIComponent(placeSegment[1].replace(/\+/g, " "));
        } catch {
          name = placeSegment[1].replace(/\+/g, " ");
        }
      }
      return { latitude: lat, longitude: lon, name };
    }
  }

  // 2. Query/Parameter match fallback (q=, ll=, query= format)
  const paramMatch = trimmed.match(/(?:[?&]q=|[?&]query=|[?&]ll=)(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (paramMatch) {
    const lat = parseFloat(paramMatch[1]);
    const lon = parseFloat(paramMatch[2]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { latitude: lat, longitude: lon, name: "Google Maps Reference Pin" };
    }
  }

  return null;
}

/**
 * Fetches matching geolocation details from postal code databases (Zippopotam, Nominatim)
 */
export async function searchByPostalCode(query: string): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  const results: GeocodingResult[] = [];

  // Check 1: Is it a 6-digit Indian PIN or 5-digit US ZIP?
  const isIndianPin = /^\d{6}$/.test(trimmed);
  const isUsZip = /^\d{5}$/.test(trimmed);

  if (isIndianPin || isUsZip) {
    const countryCode = isIndianPin ? "IN" : "US";
    try {
      const resp = await fetch(`https://api.zippopotam.us/${countryCode}/${trimmed}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.places && data.places.length > 0) {
          data.places.forEach((place: any, idx: number) => {
            const lat = parseFloat(place.latitude);
            const lon = parseFloat(place.longitude);
            if (!isNaN(lat) && !isNaN(lon)) {
              results.push({
                id: 9900000 + idx + Math.floor(Math.random() * 10000),
                name: place["place name"] || `PIN ${trimmed}`,
                latitude: lat,
                longitude: lon,
                country: data.country || (isIndianPin ? "India" : "United States"),
                country_code: data["country abbreviation"] || countryCode,
                admin1: place.state || "",
                postcodes: [trimmed],
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn("Zippopotam lookup failed:", e);
    }
  }

  // Check 2: Try Nominatim if Zippopotam returns nothing, or for alphanumeric postal codes
  if (results.length === 0) {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(trimmed)}&format=json&limit=3`
      );
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          data.forEach((item: any, idx: number) => {
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            if (!isNaN(lat) && !isNaN(lon)) {
              const parts = item.display_name.split(",");
              const name = parts[0]?.trim() || `Postal Code ${trimmed}`;
              const admin1 = parts[2]?.trim() || parts[1]?.trim() || "";
              const country = parts[parts.length - 1]?.trim() || "";
              
              results.push({
                id: 8800000 + idx + Math.floor(Math.random() * 10000),
                name: name,
                latitude: lat,
                longitude: lon,
                country: country,
                admin1: admin1,
                postcodes: [trimmed],
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn("Nominatim lookup failed:", e);
    }
  }

  return results;
}

/**
 * Fetches matching geolocation details from Open-Meteo's geocoding API, unified with postal code search.
 */
export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // If it's coordinate query, don't ping the full server, handle locally in search
  if (parseCoordinates(trimmed)) return [];

  // Launch postal code search and main search in parallel
  const postalResultsPromise = searchByPostalCode(trimmed).catch(() => [] as GeocodingResult[]);
  
  let meteoResults: GeocodingResult[] = [];
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=6&language=en&format=json`
    );
    if (response.ok) {
      const data = await response.json();
      meteoResults = data.results || [];
    }
  } catch (error) {
    console.error("Geocoding search failed:", error);
  }

  const postalResults = await postalResultsPromise;

  // Combine and deduplicate based on approximate latitude & longitude (rounded to 2 decimals)
  const combined = [...postalResults, ...meteoResults];
  const uniqueResults: GeocodingResult[] = [];
  const seenGeo = new Set<string>();

  for (const item of combined) {
    const geoKey = `${item.latitude.toFixed(2)}_${item.longitude.toFixed(2)}`;
    if (!seenGeo.has(geoKey)) {
      seenGeo.add(geoKey);
      uniqueResults.push(item);
    }
  }

  return uniqueResults;
}

/**
 * Fetches both current forecast and daily trend for coordinates.
 */
export async function fetchWeatherData(
  latitude: number,
  longitude: number,
  locationName: string
): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m,cloud_cover&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max,precipitation_sum,wind_speed_10m_max,sunrise,sunset&hourly=temperature_2m,weather_code,relative_humidity_2m,precipitation_probability&timezone=auto`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather system error: ${response.statusText}`);
    }
    const data = await response.json();

    // Parse Response to strictly match defined types
    const current: CurrentWeather = {
      time: data.current.time,
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      apparentTemperature: data.current.apparent_temperature,
      isDay: data.current.is_day === 1,
      precipitation: data.current.precipitation,
      rain: data.current.rain,
      showers: data.current.showers,
      snowfall: data.current.snowfall,
      weatherCode: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m,
      cloudCover: data.current.cloud_cover,
    };

    const daily: DailyForecast[] = data.daily.time.map((timeStr: string, idx: number) => ({
      date: timeStr,
      weatherCode: data.daily.weather_code[idx],
      tempMax: data.daily.temperature_2m_max[idx],
      tempMin: data.daily.temperature_2m_min[idx],
      apparentTempMax: data.daily.apparent_temperature_max[idx],
      apparentTempMin: data.daily.apparent_temperature_min[idx],
      uvIndexMax: data.daily.uv_index_max[idx],
      precipitationSum: data.daily.precipitation_sum[idx],
      windSpeedMax: data.daily.wind_speed_10m_max[idx],
      sunrise: data.daily.sunrise[idx],
      sunset: data.daily.sunset[idx],
    }));

    // Generate HourlyTrend (Map next 24 elements from response)
    const rawHourly = data.hourly;
    const hourly: HourlyTrend[] = [];
    const currentTimeIndex = rawHourly.time.findIndex((t: string) => {
      // Find the slot closest to current current weather time or starting current
      const sliceTime = new Date(t).getTime();
      const currentRefTime = new Date(data.current.time).getTime();
      return sliceTime >= currentRefTime;
    });

    const startIndex = currentTimeIndex !== -1 ? currentTimeIndex : 0;
    
    // Pick the next 24 hours trend
    for (let i = 0; i < 24; i++) {
      const idx = startIndex + i;
      if (idx < rawHourly.time.length) {
        hourly.push({
          time: rawHourly.time[idx],
          temperature: rawHourly.temperature_2m[idx],
          weatherCode: rawHourly.weather_code[idx],
          humidity: rawHourly.relative_humidity_2m[idx],
          precipitationProbability: rawHourly.precipitation_probability[idx],
        });
      }
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      elevation: data.elevation,
      current,
      daily,
      hourly,
      locationName: locationName,
    };
  } catch (error) {
    console.error("fetchWeatherData API failed:", error);
    throw error;
  }
}

/**
 * Metric/Imperial Unit Conversions
 */
export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

export function kmToMph(km: number): number {
  return Math.round(km * 0.621371);
}

export function formatTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return isoStr;
  }
}

export function formatDate(isoDateStr: string): string {
  try {
    const d = new Date(isoDateStr + "T00:00:00");
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return isoDateStr;
  }
}
