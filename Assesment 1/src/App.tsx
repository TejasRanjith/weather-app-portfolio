/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { CloudSun, Loader2, RefreshCw, AlertTriangle, Cloud, Settings, Map, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WeatherData } from "./types";
import { fetchWeatherData } from "./utils/weatherUtils";
import SearchBox from "./components/SearchBox";
import WeatherDashboard from "./components/WeatherDashboard";

// Safe baseline fallbacks
const DEFAULT_LAT = 40.7128;
const DEFAULT_LON = -74.0060;
const DEFAULT_NAME = "New York, NY (United States)";

export default function App() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState("Initializing meteorological services...");
  const [error, setError] = useState<string | null>(null);
  const [isCelsius, setIsCelsius] = useState<boolean>(true);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);

  // Load Celsius preset and search coordinates history
  useEffect(() => {
    const savedCelsius = localStorage.getItem("weather_celsius");
    if (savedCelsius !== null) {
      setIsCelsius(savedCelsius === "true");
    }

    const loadInitialWeather = async () => {
      setIsLoading(true);
      setError(null);
      
      const savedLat = localStorage.getItem("weather_lat");
      const savedLon = localStorage.getItem("weather_lon");
      const savedName = localStorage.getItem("weather_name");

      let lat = DEFAULT_LAT;
      let lon = DEFAULT_LON;
      let name = DEFAULT_NAME;

      if (savedLat && savedLon && savedName) {
        lat = parseFloat(savedLat);
        lon = parseFloat(savedLon);
        name = savedName;
        setLoadingProgress(`Restoring weather conditions for ${name.split("(")[0]}...`);
      } else {
        setLoadingProgress("Retrieving atmospheric parameters for default station (New York)...");
      }

      try {
        const data = await fetchWeatherData(lat, lon, name);
        setWeatherData(data);
      } catch (err: any) {
        setError(err?.message || "Failed to synchronize current weather indices. Please check internet connection.");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialWeather();
  }, []);

  // Save Celsius state on change
  const handleSetCelsius = (val: boolean) => {
    setIsCelsius(val);
    localStorage.setItem("weather_celsius", val.toString());
  };

  // Select location callback (SearchBox or coordinates parser)
  const handleSelectLocation = async (location: { latitude: number; longitude: number; name: string }) => {
    setIsLoading(true);
    setError(null);
    setLoadingProgress(`Contacting weather servers for ${location.name.split(",")[0]}...`);

    // Persist coordinates for session restores
    localStorage.setItem("weather_lat", location.latitude.toString());
    localStorage.setItem("weather_lon", location.longitude.toString());
    localStorage.setItem("weather_name", location.name);

    try {
      const data = await fetchWeatherData(location.latitude, location.longitude, location.name);
      setWeatherData(data);
    } catch (err: any) {
      setError(err?.message || `Failed to gather metrics for ${location.name}. Please verify location and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Browser GPS Geolocation tracking
  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported or was blocked by frame sandboxing.");
      setIsDetectingLocation(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    };

    setLoadingProgress("Synchronizing GPS satellites...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          setIsLoading(true);
          setLoadingProgress(`Triangulating weather metrics for GPS position...`);
          
          const name = `Local Position (${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E)`;
          
          localStorage.setItem("weather_lat", latitude.toString());
          localStorage.setItem("weather_lon", longitude.toString());
          localStorage.setItem("weather_name", name);

          const data = await fetchWeatherData(latitude, longitude, name);
          setWeatherData(data);
        } catch (err: any) {
          setError(err?.message || "Failed to extract weather parameters for your current coordinates.");
        } finally {
          setIsLoading(false);
          setIsDetectingLocation(false);
        }
      },
      (geoErr) => {
        console.warn("Geolocation error code:", geoErr.code, geoErr.message);
        setIsDetectingLocation(false);
        
        // Friendly detailed error messages based on W3C standard code
        switch (geoErr.code) {
          case geoErr.PERMISSION_DENIED:
            setError("Location permissions denied. Please search your city, zipcode, or coordinates manually in the prompt above.");
            break;
          case geoErr.POSITION_UNAVAILABLE:
            setError("Your physical positioning details are currently unavailable from satellite grids. Please input manually.");
            break;
          case geoErr.TIMEOUT:
            setError("Active GPS timeout. Satellites could not lock on coordinates. Please search manually.");
            break;
          default:
            setError("Unable to trace browser coordinates. Please use search manually instead.");
            break;
        }
      },
      options
    );
  };

  // Restore back to beautiful New York preset
  const handleResetToDefault = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingProgress("Restating default parameters...");
    try {
      const data = await fetchWeatherData(DEFAULT_LAT, DEFAULT_LON, DEFAULT_NAME);
      setWeatherData(data);
      // clear local storage coords
      localStorage.removeItem("weather_lat");
      localStorage.removeItem("weather_lon");
      localStorage.removeItem("weather_name");
    } catch (err: any) {
      setError("Fallback system offline. Try checking your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col font-sans antialiased selection:bg-[#141414] selection:text-[#E4E3E0]">
      
      {/* Top Banner Header */}
      <header className="w-full max-w-5xl mx-auto pt-8 pb-6 px-4 flex flex-col md:flex-row justify-between items-center border-b-2 border-[#141414] mb-8 gap-4">
        <div 
          onClick={handleResetToDefault}
          className="flex items-center gap-4 cursor-pointer select-none group"
        >
          <div className="p-2.5 bg-[#141414] text-[#E4E3E0] hover:bg-[#dc2626] transition-colors">
            <CloudSun className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl uppercase tracking-tighter text-[#141414] transition-colors group-hover:text-[#dc2626]">
              Atmos / Weather Engine V1.0
            </h1>
            <p className="text-[10px] text-[#141414] opacity-50 font-mono tracking-wider uppercase">Met-Grid Station Network</p>
          </div>
        </div>

        {/* Informative alert badge */}
        <div className="flex items-center gap-2 px-4 py-2 border-2 border-[#141414] bg-white text-[10px] font-mono text-[#141414] font-bold uppercase select-none">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>SYS_UPLINK // 100% OPERATIONAL</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 py-2">
        
        {/* Error Handling Example */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 bg-[#dc2626] text-white p-4 flex flex-col sm:flex-row items-center justify-between text-xs font-mono uppercase tracking-widest gap-2 border-2 border-[#141414]"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>[ ERROR_042 ]: {error}</span>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleResetToDefault} 
                  className="underline underline-offset-4 hover:opacity-80 font-bold cursor-pointer"
                >
                  DEFAULT_PRESET
                </button>
                <button 
                  onClick={() => setError(null)} 
                  className="underline underline-offset-4 hover:opacity-80 font-bold cursor-pointer"
                >
                  DISMISS
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Selector Station */}
        <SearchBox
          onSelectLocation={handleSelectLocation}
          onDetectLocation={handleDetectLocation}
          isDetectingLocation={isDetectingLocation}
        />

        {/* Loading and Screen Controller block */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-lg mx-auto mt-24 px-4 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="relative p-6 bg-white border-2 border-[#141414]">
                <Loader2 className="w-10 h-10 animate-spin text-[#141414]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-mono font-bold text-sm text-[#141414] uppercase tracking-wider">RETRIEVING ATMO METRICS</h3>
                <p className="text-xs font-mono text-[#141414]/60 uppercase">{loadingProgress}</p>
              </div>
            </motion.div>
          ) : (
            weatherData && (
              <WeatherDashboard
                data={weatherData}
                isCelsius={isCelsius}
                setIsCelsius={handleSetCelsius}
              />
            )
          )}
        </AnimatePresence>

        {/* Operator Profile & Program Intelligence */}
        <div className="w-full max-w-5xl mx-auto mt-12 border-2 border-[#141414] bg-white text-[#141414] font-mono">
          <div className="bg-[#141414] text-[#E4E3E0] px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>[ SYSTEM_OPERATOR // INFO_MODULE ]</span>
            <span className="animate-pulse text-green-400">● ONLINE</span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs uppercase">
            <div className="border-b-2 md:border-b-0 md:border-r-2 border-[#141414] pb-4 md:pb-0 md:pr-6">
              <h4 className="font-bold text-sm mb-2 text-[#dc2626]">DEVELOPER PROFILE</h4>
              <p className="font-bold text-base tracking-tight mb-1 text-[#141414]">TEJAS RANJITH</p>
              <p className="opacity-60 text-[10px]">Lead Systems Engineer &amp; Met-Grid Operator</p>
            </div>
            <div className="md:col-span-2 space-y-3">
              <h4 className="font-bold text-sm text-[#dc2626]">AFFILIATED PROGRAM: PRODUCT MANAGER ACCELERATOR</h4>
              <p className="leading-relaxed font-sans text-xs normal-case text-[#141414]/90 font-medium">
                The <strong>Product Manager Accelerator (PMA)</strong> is a premier career development program and community founded by Dr. Nancy Li. It empowers professionals—ranging from career switchers to experienced product managers—to transition into and advance within the PM and AI Product Management space. Through hands-on portfolio-building experience (including building and launching real-world AI products alongside engineering and design teams), customized coaching, resume branding, and interview preparation, PMA helps candidates land high-impact PM roles.
              </p>
              <div className="pt-2 border-t border-[#141414]/20 flex justify-between items-center">
                <span className="text-[9px] opacity-60">LINKEDIN CORRELATION MATRIX:</span>
                <a
                  href="https://www.linkedin.com/company/product-manager-accelerator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#141414] text-[#E4E3E0] hover:bg-[#dc2626] transition-colors font-bold text-[10px] select-none cursor-pointer border border-[#141414] hover:border-[#dc2626]"
                >
                  PM ACCELERATOR LINKEDIN ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Brutalist Footer */}
      <footer className="w-full max-w-5xl mx-auto mt-12 py-6 px-4 border-t-2 border-[#141414] flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-[#141414] font-mono tracking-wider uppercase font-bold">
        <p>Hale Atmospherics © 2026 // Sensor Uplink Active</p>
        <div className="flex gap-6">
          <span>REF_CODE: 00982-ALPHA</span>
          <span>•</span>
          <span>DATA: NOAA / MET-GRID</span>
        </div>
      </footer>
    </div>
  );
}
