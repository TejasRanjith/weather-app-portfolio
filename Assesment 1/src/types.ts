/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  country_code?: string;
  country?: string;
  admin1?: string; // State or province
  admin2?: string; // Region or county
  postcodes?: string[];
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  humidity: number;
  apparentTemperature: number;
  isDay: boolean; // converted from 0/1
  precipitation: number;
  rain: number;
  showers: number;
  snowfall: number;
  weatherCode: number;
  windSpeed: number;
  cloudCover: number;
}

export interface DailyForecast {
  date: string; // ISO String (e.g., 2026-06-11)
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  apparentTempMax: number;
  apparentTempMin: number;
  uvIndexMax: number;
  precipitationSum: number;
  windSpeedMax: number;
  sunrise: string;
  sunset: string;
}

export interface HourlyTrend {
  time: string; // e.g., 2026-06-11T12:00
  temperature: number;
  weatherCode: number;
  humidity: number;
  precipitationProbability: number;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  elevation: number;
  current: CurrentWeather;
  daily: DailyForecast[];
  hourly: HourlyTrend[];
  locationName: string; // Resolves coordinates back to a readable source
}
