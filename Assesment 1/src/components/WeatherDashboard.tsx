/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import {
  Sun,
  Moon,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  Snowflake,
  CloudRainWind,
  CloudLightning,
  CloudSnow,
  Cloudy,
  Wind,
  Droplets,
  Thermometer,
  Sunset,
  Sunrise,
  Compass
} from "lucide-react";
import { WeatherData } from "../types";
import {
  getWeatherInfo,
  celsiusToFahrenheit,
  kmToMph,
  formatTime,
  formatDate,
} from "../utils/weatherUtils";

interface WeatherDashboardProps {
  data: WeatherData;
  isCelsius: boolean;
  setIsCelsius: (val: boolean) => void;
}

export function getWeatherIconComponent(iconName: string, className = "w-5 h-5") {
  switch (iconName) {
    case "Sun":
      return <Sun className={`${className} text-[#141414]`} />;
    case "Moon":
      return <Moon className={`${className} text-[#141414]`} />;
    case "CloudSun":
      return <CloudSun className={`${className} text-[#141414]`} />;
    case "Cloud":
      return <Cloud className={`${className} text-[#141414]`} />;
    case "CloudFog":
      return <CloudFog className={`${className} text-[#141414]`} />;
    case "CloudDrizzle":
      return <CloudDrizzle className={`${className} text-[#141414]`} />;
    case "CloudRain":
      return <CloudRain className={`${className} text-[#141414]`} />;
    case "Snowflake":
      return <Snowflake className={`${className} text-[#141414]`} />;
    case "CloudRainWind":
      return <CloudRainWind className={`${className} text-[#141414]`} />;
    case "CloudLightning":
      return <CloudLightning className={`${className} text-[#141414]`} />;
    case "CloudSnow":
      return <CloudSnow className={`${className} text-[#141414]`} />;
    default:
      return <Cloudy className={`${className} text-[#141414]`} />;
  }
}

export default function WeatherDashboard({ data, isCelsius, setIsCelsius }: WeatherDashboardProps) {
  const currentInfo = getWeatherInfo(data.current.weatherCode, data.current.isDay);
  
  // High and low for today (which is daily[0])
  const todayForecast = data.daily[0];

  const formatTemp = (celsius: number) => {
    return isCelsius ? `${Math.round(celsius)}°C` : `${celsiusToFahrenheit(celsius)}°F`;
  };

  const formatWind = (kmh: number) => {
    return isCelsius ? `${kmh} KM/H` : `${kmToMph(kmh)} MPH`;
  };

  const fiveDayForecast = data.daily.slice(0, 5);

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 space-y-12 px-4 pb-16">
      
      {/* Main Two-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* LEFT COMPONENT: Hero Current Spotlight */}
        <div className="lg:col-span-7 flex flex-col justify-between lg:border-r-2 border-[#141414] pb-8 lg:pb-0 lg:pr-8">
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-4xl md:text-6xl font-black font-display tracking-tighter uppercase text-[#141414] break-words max-w-[70%] leading-none">
                {data.locationName.split(",")[0]}
              </h2>
              <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
                <p className="font-mono text-xs opacity-60">
                  LAT: {data.latitude.toFixed(2)} | LON: {data.longitude.toFixed(2)}
                </p>
                <a 
                  href={`https://www.google.com/maps/@${data.latitude},${data.longitude},12z?entry=yt`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#141414] text-[#E4E3E0] hover:bg-[#dc2626] transition-colors uppercase font-mono text-[9px] font-bold select-none cursor-pointer border border-[#141414] hover:border-[#dc2626]"
                  title="View coordinates on Google Maps"
                >
                  <Compass className="w-3 h-3 text-[#dc2626]" />
                  <span>VIEW MAP ↗</span>
                </a>
              </div>
            </div>
            
            {/* Extended full location description for validation */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold uppercase text-[#141414]/90 tracking-wider">
              <span className="px-1.5 py-0.5 bg-[#141414] text-[#E4E3E0]">STATION LOC</span>
              <span className="border-b border-[#141414] pb-0.5">{data.locationName}</span>
            </div>

            <p className="font-serif italic text-2xl mt-5 text-[#141414] font-medium">
              {currentInfo.description} {data.current.cloudCover > 0 ? `with ${data.current.cloudCover}% cloud layers` : ""}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 my-8">
            <div className="text-8xl md:text-[140px] font-black leading-none tracking-tighter text-[#141414] flex items-baseline select-none">
              {Math.round(data.current.temperature)}
              <span className="text-4xl md:text-5xl align-top font-light ml-2">{isCelsius ? "°C" : "°F"}</span>
            </div>
            
            {/* Fahrenheit/Celsius Switch (Sharp Brutalist Bordered Toggle Box) */}
            <div className="flex bg-white border-2 border-[#141414] p-1 select-none font-mono text-xs font-bold shrink-0 self-start sm:self-end">
              <button
                type="button"
                onClick={() => setIsCelsius(true)}
                className={`px-4 py-1.5 transition-all duration-100 cursor-pointer ${
                  isCelsius ? "bg-[#141414] text-[#E4E3E0]" : "text-[#141414] hover:bg-[#141414]/10"
                }`}
              >
                CELSIUS
              </button>
              <button
                type="button"
                onClick={() => setIsCelsius(false)}
                className={`px-4 py-1.5 transition-all duration-100 cursor-pointer ${
                  !isCelsius ? "bg-[#141414] text-[#E4E3E0]" : "text-[#141414] hover:bg-[#141414]/10"
                }`}
              >
                FAHRENHEIT
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t-2 border-[#141414] pt-6 uppercase font-mono text-sm">
            <div className="flex items-center gap-3 font-bold">
              <span className="w-2.5 h-2.5 bg-[#141414]" />
              <span>PRECIPITATIONSUM: {data.current.precipitation > 0 ? `${data.current.precipitation} MM` : "0.0 MM"}</span>
            </div>
            <div className="flex items-center gap-3 font-bold">
              <span className="w-2.5 h-2.5 bg-[#141414]" />
              <span>WIND FORCE: {formatWind(data.current.windSpeed)}</span>
            </div>
            <div className="flex items-center gap-3 font-bold">
              <span className="w-2.5 h-2.5 bg-[#141414]" />
              <span>THERMAL PROFILE APPARENT: {formatTemp(data.current.apparentTemperature)}</span>
            </div>
          </div>

          {/* Quick Metrics Multi-Grid bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-t border-[#141414] pt-6 mt-8">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] opacity-60 uppercase">Humidity</span>
              <span className="text-xl font-black font-display text-[#141414]">{data.current.humidity}%</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] opacity-60 uppercase">UV Factor</span>
              <span className="text-xl font-black font-display text-[#141414]">{todayForecast ? todayForecast.uvIndexMax : "0"} [MOD]</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] opacity-60 uppercase">Altitude</span>
              <span className="text-xl font-black font-display text-[#141414]">{data.elevation} M</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] opacity-60 uppercase">Daystate</span>
              <span className="text-xl font-black font-display text-[#141414]">{data.current.isDay ? "LIGHT" : "NIGHTSTATE"}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT: 5-Day Extended Forecast */}
        <div className="lg:col-span-5 flex flex-col h-full justify-between">
          <div>
            <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2 tracking-tight">
              <span className="w-3 h-3 bg-[#141414]"></span>
              Extended 5-Day Forecast
            </h3>
            
            <div className="flex flex-col gap-2.5">
              {fiveDayForecast.map((day, offset) => {
                const dayName = offset === 0 ? "TODAY" : formatDate(day.date).toUpperCase();
                const dayInfo = getWeatherInfo(day.weatherCode, true);

                return (
                  <div 
                    key={day.date} 
                    className="flex items-center justify-between p-4 border border-[#141414] bg-white hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors cursor-pointer group font-mono text-xs uppercase"
                  >
                    <div className="w-24 font-bold">{dayName}</div>
                    <div className="opacity-60 flex items-center gap-2 truncate max-w-[120px]">
                      {getWeatherIconComponent(dayInfo.iconName, "w-4 h-4 text-[#141414] group-hover:invert")}
                      <span className="truncate">{dayInfo.description}</span>
                    </div>
                    <div className="font-mono flex gap-4 text-sm">
                      <span className="font-bold text-[#dc2626]">{Math.round(day.tempMax)}°</span>
                      <span className="opacity-40 group-hover:opacity-100">{Math.round(day.tempMin)}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Sun Matrix Panel */}
          {todayForecast && (
            <div className="mt-8 border border-[#141414] bg-white p-4 flex justify-between items-center text-xs font-mono uppercase select-none">
              <div className="flex items-center gap-2.5">
                <Sunrise className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold">SUNRISE: {formatTime(todayForecast.sunrise).toUpperCase()}</span>
              </div>
              <div className="h-4 w-px bg-[#141414]" />
              <div className="flex items-center gap-2.5">
                <Sunset className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-bold">SUNSET: {formatTime(todayForecast.sunset).toUpperCase()}</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 24-Hour Trends horizontal slider row */}
      <div className="border-t-2 border-[#141414] pt-8 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#141414]"></span>
          24-Hour MET-Grid Forecast Trend
        </h3>
        
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
          {data.hourly.map((hour, idx) => {
            const hInfo = getWeatherInfo(hour.weatherCode, true);
            const displayTime = idx === 0 ? "NOW" : formatTime(hour.time).toUpperCase();
            return (
              <div
                key={hour.time}
                className="flex flex-col items-center justify-between p-4 border border-[#141414] bg-white hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors min-w-[100px] max-w-[120px] shrink-0 font-mono text-center cursor-default group select-none"
              >
                <span className="text-[10px] opacity-60 uppercase">{displayTime}</span>
                <div className="my-3 py-1 scale-110 group-hover:invert transition-all">
                  {getWeatherIconComponent(hInfo.iconName, "w-6 h-6")}
                </div>
                <span className="font-sans font-bold text-base tracking-tight">
                  {formatTemp(hour.temperature)}
                </span>
                {hour.precipitationProbability > 0 ? (
                  <span className="text-[9px] font-bold text-sky-600 group-hover:text-cyan-200 mt-1 uppercase">
                    🌧 {hour.precipitationProbability}%
                  </span>
                ) : (
                  <span className="text-[9px] opacity-40 group-hover:opacity-100 mt-1 uppercase">
                    DRY
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
