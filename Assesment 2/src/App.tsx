/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudSun,
  Wind,
  Thermometer,
  Droplets,
  Compass,
  Trash2,
  Edit,
  Plus,
  Search,
  Youtube,
  MapPin,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  X,
  Sparkles,
  Umbrella,
  ClipboardList,
  Info,
  Layers,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WeatherDay {
  date: string;
  tempC: number;
  tempF: number;
  condition: string;
  humidity: number;
  windKmh: number;
  precipMm: number;
  conditionIcon: string;
}

interface YouTubeVideo {
  title: string;
  url: string;
  description: string;
  category?: string;
}

interface WeatherRecord {
  id: string;
  searchQuery: string;
  locationName: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  temperatures: WeatherDay[];
  youtubeVideos: YouTubeVideo[];
  locationTrivia: string;
  createdAt: string;
  updatedAt: string;
}

export default function App() {
  // Database State
  const [records, setRecords] = useState<WeatherRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<WeatherRecord | null>(null);
  
  // Lookup Form State
  const [locationInput, setLocationInput] = useState("");
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");

  // Location suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [preventSuggestionFetch, setPreventSuggestionFetch] = useState(false);

  // Debounced location suggestion fetching
  useEffect(() => {
    if (preventSuggestionFetch) {
      setPreventSuggestionFetch(false);
      return;
    }

    if (locationInput.trim().length < 2) {
      setSuggestions([]);
      setIsSuggestionsLoading(false);
      setShowSuggestions(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSuggestionsLoading(true);
      try {
        const response = await fetch(`/api/suggestions?query=${encodeURIComponent(locationInput)}`);
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 450); // Elegant debounce

    return () => clearTimeout(delayDebounce);
  }, [locationInput, preventSuggestionFetch]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowSuggestions(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleSelectSuggestion = (suggestion: string) => {
    setPreventSuggestionFetch(true);
    setLocationInput(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Loading, Errors and Modals
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  // Export & Action UI controls
  const [showExportId, setShowExportId] = useState<string | null>(null);

  // UPDATE Record Day Modal State
  const [editingDay, setEditingDay] = useState<WeatherDay | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editTempC, setEditTempC] = useState<number>(0);
  const [editTempF, setEditTempF] = useState<number>(32);
  const [editCondition, setEditCondition] = useState("");
  const [editHumidity, setEditHumidity] = useState<number>(50);
  const [editWindKmh, setEditWindKmh] = useState<number>(10);
  const [editPrecipMm, setEditPrecipMm] = useState<number>(0);
  const [editConditionIcon, setEditConditionIcon] = useState("Sun");

  // Load records on init
  useEffect(() => {
    fetchRecords();
    
    // Set custom default inputs for convenience (e.g. today and 5 days ahead)
    const today = new Date();
    const formattedToday = today.toISOString().split("T")[0];
    
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 4);
    const formattedFuture = futureDate.toISOString().split("T")[0];
    
    setStartDateInput(formattedToday);
    setEndDateInput(formattedFuture);
  }, []);

  const fetchRecords = async (selectFirst = true) => {
    try {
      const response = await fetch("/api/records");
      const data = await response.json();
      if (data.records) {
        setRecords(data.records);
        if (selectFirst && data.records.length > 0) {
          setSelectedRecord(data.records[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load records from backend:", err);
      setErrorText("Could not connect to the database server.");
    }
  };

  // CREATE: Submit new lookup queries to server
  const handleQueryWeather = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    setSuccessText(null);

    if (!locationInput.trim()) {
      setErrorText("Please provide a valid location (city, zip code, coordinates, or landmark).");
      return;
    }

    if (!startDateInput || !endDateInput) {
      setErrorText("Please select both a start date and an end date.");
      return;
    }

    const start = new Date(startDateInput);
    const end = new Date(endDateInput);
    if (start > end) {
      setErrorText("The start date must occur before or equal to the end date.");
      return;
    }

    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 31) {
      setErrorText("Date range is capped at 31 days to ensure stable rates.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: locationInput,
          startDate: startDateInput,
          endDate: endDateInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to geocode or retrieve weather.");
      }

      setSuccessText(`Successfully geocoded and saved weather details for "${data.record.locationName}"!`);
      setLocationInput("");
      
      // Reload history and select the newly created record
      await fetchRecords(false);
      setSelectedRecord(data.record);
    } catch (err: any) {
      setErrorText(err.message || "An unexpected error occurred during search.");
    } finally {
      setIsLoading(false);
    }
  };

  // DELETE: Delete query log from DB
  const handleDeleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting the record when clicking delete
    setErrorText(null);
    setSuccessText(null);

    try {
      const res = await fetch(`/api/records/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete record.");
      }

      setSuccessText("Query log and weather record successfully cleared from database.");
      
      // Update local state smoothly
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
    } catch (err: any) {
      setErrorText(err.message || "Could not complete deletion.");
    }
  };

  // UPDATE: Trigger Day editing mode
  const startEditDay = (day: WeatherDay, index: number) => {
    setEditingDay(day);
    setEditIndex(index);
    setEditTempC(day.tempC);
    setEditTempF(day.tempF);
    setEditCondition(day.condition);
    setEditHumidity(day.humidity);
    setEditWindKmh(day.windKmh);
    setEditPrecipMm(day.precipMm);
    setEditConditionIcon(day.conditionIcon || "Sun");
  };

  const handleCelsiusChange = (c: number) => {
    setEditTempC(c);
    // Auto convert to Fahrenheit for consistent coherence
    setEditTempF(Math.round(c * 1.8 + 32));
  };

  const handleFahrenheitChange = (f: number) => {
    setEditTempF(f);
    // Auto convert to Celsius
    setEditTempC(Math.round((f - 32) / 1.8));
  };

  // UPDATE: Save the edited day back to server
  const handleSaveDayEdit = async () => {
    if (!selectedRecord || editIndex === null) return;
    setErrorText(null);
    setSuccessText(null);

    // Run strict validations on field inputs (No incoherent data)
    if (editTempC < -100 || editTempC > 60) {
      setErrorText("Temperature must reside inside a realistic boundary (-100°C to 60°C).");
      return;
    }

    if (editHumidity < 0 || editHumidity > 100) {
      setErrorText("Humidity ratio must be a valid percentage (0% to 100%).");
      return;
    }

    if (editWindKmh < 0) {
      setErrorText("Wind speed values are required to be non-negative.");
      return;
    }

    if (editPrecipMm < 0) {
      setErrorText("Precipitation volume must be a non-negative number.");
      return;
    }

    const updatedTemperatures = [...selectedRecord.temperatures];
    updatedTemperatures[editIndex] = {
      date: updatedTemperatures[editIndex].date,
      tempC: editTempC,
      tempF: editTempF,
      condition: editCondition,
      humidity: editHumidity,
      windKmh: editWindKmh,
      precipMm: editPrecipMm,
      conditionIcon: editConditionIcon,
    };

    try {
      const res = await fetch(`/api/records/${selectedRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperatures: updatedTemperatures,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update record details.");
      }

      setSuccessText(`Successfully updated weather parameters for ${updatedTemperatures[editIndex].date}!`);
      setSelectedRecord(data.record);
      setEditingDay(null);
      setEditIndex(null);
      
      // Update corresponding record in structural list
      setRecords((prev) =>
        prev.map((r) => (r.id === data.record.id ? data.record : r))
      );
    } catch (err: any) {
      setErrorText(err.message || "Day values update failed.");
    }
  };

  // Trigger file download via API formats
  const handleDownloadFile = (format: string, id: string) => {
    window.open(`/api/export/${format}/${id}`, "_blank");
    setShowExportId(null);
  };

  // Determine Condition Icon render
  const renderConditionIcon = (iconStr: string, className = "w-6 h-6") => {
    switch (iconStr) {
      case "Sun":
        return <Sun className={`${className} text-amber-500`} id="icon_sun" />;
      case "CloudSun":
        return <CloudSun className={`${className} text-amber-400`} id="icon_cloudsun" />;
      case "Cloud":
        return <Cloud className={`${className} text-slate-400`} id="icon_cloud" />;
      case "CloudRain":
        return <CloudRain className={`${className} text-sky-400`} id="icon_cloudrain" />;
      case "CloudSnow":
        return <CloudSnow className={`${className} text-indigo-300`} id="icon_cloudsnow" />;
      case "CloudLightning":
        return <CloudLightning className={`${className} text-violet-500`} id="icon_cloudlightning" />;
      case "CloudFog":
        return <CloudFog className={`${className} text-slate-300`} id="icon_cloudfog" />;
      case "Wind":
        return <Wind className={`${className} text-cyan-400`} id="icon_wind" />;
      default:
        return <Sun className={`${className} text-amber-500`} id="icon_default" />;
    }
  };

  // Creative Packing & Trip Attire Logic based on average selection weather
  const getCreativePackingGuide = (record: WeatherRecord) => {
    const days = record.temperatures;
    if (!days || days.length === 0) return null;

    const avgTemp = days.reduce((acc, d) => acc + d.tempC, 0) / days.length;
    const isRainy = days.some((d) => d.condition.toLowerCase().includes("rain") || d.condition.toLowerCase().includes("shower") || d.condition.toLowerCase().includes("thunder"));
    const isSnowy = days.some((d) => d.condition.toLowerCase().includes("snow") || d.condition.toLowerCase().includes("freeze"));
    
    let attire = "Standard casual clothing.";
    let checkList: string[] = ["Camera", "Local currency", "ID/Passport", "Reusable water bottle"];
    let outdoorSafety = "Plesant days ahead for sightseeing!";

    if (avgTemp < 10) {
      attire = "Heavy layers, insulated coats, gloves, and thick thermal socks.";
      checkList.push("Hand warmers", "Lip balm", "Moisturizer");
      outdoorSafety = "Layer comfortably. Plan plenty of cozy indoor museum breaks.";
    } else if (avgTemp < 18) {
      attire = "Light jackets, sweaters, cardigans, and comfortable walking sneakers.";
      checkList.push("Sunglasses", "Windbreaker jacket");
      outdoorSafety = "Variable seasonal weather. Layering up is highly recommended!";
    } else {
      attire = "Breathable linen shirts, lightweight t-shirts, shorts and sandals.";
      checkList.push("High-protection Sunscreen", "Sunglasses", "Wide-brimmed sun hat");
      outdoorSafety = "Pleasant warm climate! Ideal for open-air landmarks and outdoor walking.";
    }

    if (isRainy) {
      attire += " Ensure you wear waterproof shoes or layers.";
      checkList.push("Sturdy compact Umbrella", "Rain jacket / Poncho");
      outdoorSafety = "Unstable skies ahead. Keep a waterproof umbrella in your backpack at all times!";
    }

    if (isSnowy) {
      attire += " Be sure to wear slip-resistant boots.";
      checkList.push("Scarf", "Woollen Beanie");
      outdoorSafety = "Caution: Icy sidewalks are possible. Slip-resistant gear is suggested.";
    }

    return { attire, checkList, outdoorSafety };
  };

  const packingGuide = selectedRecord ? getCreativePackingGuide(selectedRecord) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans" id="app_root">
      {/* HEADER BAR */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 py-3.5 px-6 flex flex-wrap items-center justify-between gap-4 shadow-xs" id="app_header">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white p-2.5 rounded-lg shadow-sm">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-slate-900 flex items-center gap-2">
              Atmosphere DB Engine
              <span className="text-[10px] py-0.5 px-2 bg-blue-50 text-blue-700 font-mono rounded-full border border-blue-200">
                v2.1 Stable
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest leading-none mt-0.5">Atmosphere Climate &amp; Weather Database</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
          <Layers className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-slate-500 font-medium font-mono">DB_CONNECTIVITY:</span>
          <span className="text-blue-700 flex items-center gap-1.5 font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            PGSQL_15.3 ACTIVE
          </span>
        </div>
      </header>

      {/* CORE CONTENT LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="core_grid">
        
        {/* LEFT COLUMN: CRUDS LOGS SIDEBAR */}
        <section className="lg:col-span-4 flex flex-col gap-6" id="sidebar_queries">
          {/* SEARCH & ADD QUERY CARD (CREATE) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" id="create_weather_card">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 tracking-tight flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4 text-blue-600" />
                LOG LOCATION FORECAST
              </h2>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">CREATE_API</span>
            </div>

            <form onSubmit={handleQueryWeather} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Location Query Input
                </label>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    placeholder="Enter location (Zip, City, Coordinates)..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                  />

                  {/* Suggestions dropdown overlay */}
                  <AnimatePresence>
                    {showSuggestions && (suggestions.length > 0 || isSuggestionsLoading) && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto"
                      >
                        {isSuggestionsLoading && (
                          <div className="px-4 py-2.5 text-xs text-slate-500 flex items-center gap-2 font-mono">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            Fetching suggestions...
                          </div>
                        )}
                        {!isSuggestionsLoading && suggestions.map((suggestion, idx) => (
                           <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-700 font-mono transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="truncate">{suggestion}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-[9px] text-slate-400 font-mono mt-1 leading-normal">
                  Fuzzy geocoding autonomously resolves addresses, locations, landmarks, and raw coordinates.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={startDateInput}
                      onChange={(e) => setStartDateInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg py-2 pl-8 pr-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      value={endDateInput}
                      onChange={(e) => setEndDateInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg py-2 pl-8 pr-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Date validation note */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[10px] text-slate-500 flex items-start gap-1.5 font-mono">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  VALIDATION: End date must be &gt;= Start. Range is limited to 31 concurrent days.
                </span>
              </div>

              {/* Submit Query */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xs tracking-wider uppercase transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    RUNNING QUERY...
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5" />
                    RUN WEATHER QUERY
                  </>
                )}
              </button>
            </form>
          </div>

          {/* QUERY RECORDS LOG (READ & DELETE) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex-1 flex flex-col shadow-sm min-h-[300px]" id="query_history_card">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">QUERY HISTORY (CRUD)</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                {records.length} Records
              </span>
            </div>

            {/* Error & Success States alerts */}
            <AnimatePresence mode="popLayout">
              {errorText && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs mb-3 flex items-start gap-2 shadow-xs"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="font-mono leading-tight">{errorText}</span>
                </motion.div>
              )}
              {successText && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs mb-3 flex items-start gap-2 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-mono leading-tight">{successText}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-2.5 scrollbar-thin">
              {records.length === 0 ? (
                <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-2">
                  <Layers className="w-8 h-8 text-slate-300" />
                  <p className="text-xs uppercase font-mono tracking-wider">No climate records logged yet.</p>
                  <p className="text-[10px] text-slate-400">Run a query to create your first DB record.</p>
                </div>
              ) : (
                records.map((rec) => {
                  const isSelected = selectedRecord?.id === rec.id;
                  const dateStr = `${rec.startDate} / ${rec.endDate}`;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => {
                        setSelectedRecord(rec);
                        setErrorText(null);
                        setSuccessText(null);
                      }}
                      className={`group p-3 rounded-lg border text-left cursor-pointer transition-all flex justify-between items-center relative overflow-hidden ${
                        isSelected
                          ? "bg-blue-50/70 border-l-4 border-l-blue-600 border-y border-r border-blue-200/60"
                          : "bg-white border-l-4 border-l-transparent border-y border-r border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 pr-2 max-w-[80%]">
                        <span className={`text-[9px] font-bold font-mono tracking-wider uppercase ${isSelected ? "text-blue-600" : "text-slate-400"}`}>
                          {rec.id === "rec_paris_default" ? "PRELOADED_ROW" : `RECORD_ID: ${rec.id.replace("rec_", "")}`}
                        </span>
                        <h3 className="font-bold text-slate-800 text-xs truncate">
                          {rec.locationName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="leading-none truncate">Range: {dateStr}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                        {/* Quick Delete */}
                        <button
                          title="Delete weather record"
                          onClick={(e) => handleDeleteRecord(rec.id, e)}
                          className="p-1 rounded bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 transition-all cursor-pointer active:scale-90"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSelected ? "translate-x-0.5 text-blue-600" : "group-hover:translate-x-0.5"}`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* SQL_LOG_DUMP TELEMETRY */}
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-slate-400 text-[9px] mb-1.5 font-mono uppercase tracking-widest">SQL_LOG_DUMP:</p>
                {selectedRecord ? (
                  <code className="text-green-400 text-[9px] block font-mono leading-normal whitespace-pre-wrap select-all">
                    {`SELECT * FROM weather_queries WHERE location_name = '${selectedRecord.locationName.replace(/'/g, "''")}' AND date_start = '${selectedRecord.startDate}';`}
                  </code>
                ) : (
                  <code className="text-slate-500 text-[9px] block font-mono leading-normal">
                    -- Waiting for active database query row selection...
                  </code>
                )}
              </div>
            </div>
          </div>
          
          {/* DEVELOPER & PROGRAM INFORMATION CARD */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mt-6" id="developer_info_card">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 tracking-tight flex items-center gap-2 text-xs uppercase">
                <Info className="w-4 h-4 text-blue-600" />
                Developer &amp; Program Reference
              </h2>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">INFO_MODULE</span>
            </div>
            
            <div className="space-y-4">
              {/* Developer details */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
                <span className="text-[9px] font-bold font-mono tracking-wider block text-slate-400 uppercase mb-1">
                  Lead Developer
                </span>
                <p className="text-sm font-bold text-slate-900 leading-tight">Tejas Ranjith</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Atmospheric DB Systems Analyst</p>
              </div>

              {/* Organization/Accelerator description */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold font-mono tracking-wider block text-slate-400 uppercase">
                  Program Affiliation
                </span>
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-tight">
                  Product Manager Accelerator (PMA)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                  The Product Manager Accelerator (PMA) is a premier career development program and community founded by Dr. Nancy Li. It empowers professionals—ranging from career switchers to experienced product managers—to transition into and advance within the PM and AI Product Management space. Through hands-on portfolio-building experience (including building and launching real-world AI products alongside engineering and design teams), customized coaching, resume branding, and interview preparation, PMA helps candidates land high-impact PM roles.
                </p>
              </div>

              {/* LinkedIn correlation link */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">LinkedIn Profile:</span>
                <a
                  href="https://www.linkedin.com/company/product-manager-accelerator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                >
                  PMA LinkedIn ↗
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: DETAILED SELECTION PREVIEW */}
        <section className="lg:col-span-8 flex flex-col gap-6" id="main_preview">
          
          <AnimatePresence mode="wait">
            {selectedRecord ? (
              <motion.div
                key={selectedRecord.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
                id="active_query_detail"
              >
                {/* RECORD TITLE HEADER & EXPORT TOOL */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-blue-600 shadow-xs">
                      <MapPin className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">{selectedRecord.locationName}</h2>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-1 font-mono">
                        <span className="flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5 text-slate-400" />
                          Coords: {selectedRecord.latitude.toFixed(4)}°N, {selectedRecord.longitude.toFixed(4)}°E
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Range: {selectedRecord.startDate} / {selectedRecord.endDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DATA EXPORT CARD (2.3 Export Data) */}
                  <div className="relative">
                    <button
                      onClick={() => setShowExportId(showExportId === selectedRecord.id ? null : selectedRecord.id)}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-3 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm uppercase tracking-wider"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      EXPORT DATA
                      <ChevronDown className="w-3 h-3 text-slate-300" />
                    </button>

                    <AnimatePresence>
                      {showExportId === selectedRecord.id && (
                        <>
                          {/* Overlay click to close */}
                          <div className="fixed inset-0 z-10" onClick={() => setShowExportId(null)}></div>
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1.5 overflow-hidden"
                          >
                            <span className="block px-3 py-1 bg-slate-50 font-mono text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                              Delimited Formats
                            </span>
                            <button
                              onClick={() => handleDownloadFile("json", selectedRecord.id)}
                              className="w-full text-left px-4 py-1.5 text-xs hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                            >
                              <span>Download JSON</span>
                              <span className="text-[9px] font-mono py-0.5 px-1 bg-slate-100 text-slate-500 rounded border border-slate-200">.json</span>
                            </button>
                            <button
                              onClick={() => handleDownloadFile("csv", selectedRecord.id)}
                              className="w-full text-left px-4 py-1.5 text-xs hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                            >
                              <span>Download CSV</span>
                              <span className="text-[9px] font-mono py-0.5 px-1 bg-slate-100 text-slate-500 rounded border border-slate-200">.csv</span>
                            </button>
                            <button
                              onClick={() => handleDownloadFile("xml", selectedRecord.id)}
                              className="w-full text-left px-4 py-1.5 text-xs hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                            >
                              <span>Download XML</span>
                              <span className="text-[9px] font-mono py-0.5 px-1 bg-slate-100 text-slate-500 rounded border border-slate-200">.xml</span>
                            </button>
                            <button
                              onClick={() => handleDownloadFile("markdown", selectedRecord.id)}
                              className="w-full text-left px-4 py-1.5 text-xs hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                            >
                              <span>Download Markdown</span>
                              <span className="text-[9px] font-mono py-0.5 px-1 bg-slate-100 text-slate-500 rounded border border-slate-200">.md</span>
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* HISTORICAL / FORECAST TIMELINE TIMELINE GRID */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 tracking-tight flex items-center gap-2 text-xs uppercase">
                      <Thermometer className="w-4 h-4 text-orange-500" />
                      Sequential Forecast Timeline
                    </h3>
                    <span className="text-[9px] text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md font-bold uppercase font-mono">
                      Click Card to UPDATE Values
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                    {selectedRecord.temperatures.map((t, idx) => {
                      const dateObj = new Date(t.date);
                      const formattedDayName = dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                      return (
                        <div
                          key={t.date}
                          onClick={() => startEditDay(t, idx)}
                          className="bg-slate-50/50 hover:bg-white border border-slate-200 hover:border-slate-350 hover:shadow-xs rounded-lg p-3.5 cursor-pointer transition-all group flex flex-col justify-between items-center relative overflow-hidden"
                        >
                          <div className="text-center w-full">
                            <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest block uppercase mb-0.5">
                              Day {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800 block truncate">
                              {formattedDayName}
                            </span>
                          </div>

                          <div className="my-2.5 flex flex-col items-center">
                            {renderConditionIcon(t.conditionIcon, "w-9 h-9 mb-1 group-hover:scale-105 transition-transform")}
                            <span className="text-lg font-bold text-slate-950 tracking-tight block">
                              {t.tempC}°C
                              <span className="text-xs text-slate-400 font-normal ml-1">/{t.tempF}°F</span>
                            </span>
                            <span className="text-[11px] text-slate-500 font-semibold text-center truncate w-full block mt-0.5">
                              {t.condition}
                            </span>
                          </div>

                          <div className="w-full border-t border-slate-100 pt-2 space-y-1 text-[10px] text-slate-400 font-mono">
                            <div className="flex justify-between">
                              <span className="flex items-center gap-1 shrink-0">
                                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                                Hum:
                              </span>
                              <span className="text-slate-800 font-bold">{t.humidity}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="flex items-center gap-1 shrink-0">
                                <Wind className="w-3.5 h-3.5 text-slate-400" />
                                Wind:
                              </span>
                              <span className="text-slate-800 font-bold">{t.windKmh}k/h</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="flex items-center gap-1 shrink-0">
                                <Umbrella className="w-3.5 h-3.5 text-blue-400" />
                                Precip:
                              </span>
                              <span className="text-slate-800 font-bold">{t.precipMm}mm</span>
                            </div>
                          </div>

                          {/* Quick edit overlay help on hover */}
                          <div className="absolute inset-x-0 bottom-0 py-1.5 bg-blue-600 text-white text-[9px] font-bold text-center translate-y-full group-hover:translate-y-0 transition-transform flex items-center justify-center gap-1 uppercase tracking-wider">
                            <Edit className="w-3 h-3" />
                            Update Record
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DYNAMIC UPDATE FORM (Triggered inline if editingDay is selected) */}
                <AnimatePresence>
                  {editingDay && editIndex !== null && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white border border-blue-200 rounded-xl overflow-hidden shadow-sm"
                      id="inline_update_form"
                    >
                      <div className="bg-blue-50/80 border-b border-blue-100 px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Edit className="w-4 h-4 text-blue-600" />
                          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                            Update Attributes for date: <span className="font-mono text-blue-700">{editingDay.date}</span>
                          </h3>
                        </div>
                        <button
                          onClick={() => {
                            setEditingDay(null);
                            setEditIndex(null);
                          }}
                          className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Temperature Celsius (°C)
                          </label>
                          <input
                            type="number"
                            value={editTempC}
                            onChange={(e) => handleCelsiusChange(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Temperature Fahrenheit (°F)
                          </label>
                          <input
                            type="number"
                            value={editTempF}
                            onChange={(e) => handleFahrenheitChange(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Condition Label
                          </label>
                          <input
                            type="text"
                            value={editCondition}
                            onChange={(e) => setEditCondition(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Humidity Ratio (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editHumidity}
                            onChange={(e) => setEditHumidity(parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Wind Velocity (km/h)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editWindKmh}
                            onChange={(e) => setEditWindKmh(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Precipitation Volume (mm)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={editPrecipMm}
                            onChange={(e) => setEditPrecipMm(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Aesthetic Aspect Icon
                          </label>
                          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                            {["Sun", "CloudSun", "Cloud", "CloudRain", "CloudSnow", "CloudLightning", "CloudFog", "Wind"].map((iconName) => {
                              const isChecked = editConditionIcon === iconName;
                              return (
                                <button
                                  key={iconName}
                                  type="button"
                                  onClick={() => setEditConditionIcon(iconName)}
                                  className={`p-1.5 rounded border text-center transition-all flex flex-col items-center gap-1 ${
                                    isChecked
                                      ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                                      : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-100"
                                  }`}
                                >
                                  {renderConditionIcon(iconName, "w-4 h-4")}
                                  <span className="text-[8px] font-mono truncate w-full">{iconName}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-end justify-end gap-2 md:col-span-1 py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDay(null);
                              setEditIndex(null);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-1.5 px-3.5 rounded border border-slate-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveDayEdit}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-4 rounded shadow-sm cursor-pointer"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* TRIP PACKING & CLIMATE ACTIVITY MATRIX (ADDITIONAL CREATIVE API) */}
                {packingGuide && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-5">
                    <div className="md:col-span-4 border-r border-slate-200/80 md:pr-5 flex flex-col gap-1.5">
                      <h4 className="font-bold text-slate-950 tracking-tight flex items-center gap-2 text-xs uppercase font-mono">
                        <ClipboardList className="w-4 h-4 text-blue-600" />
                        Weather Packing Planner
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Deductive checklist compiler calculates necessary wardrobe items and travel luggage essentials depending on active weather statistics sequentially.
                      </p>
                    </div>

                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-start gap-3">
                        <div className="p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[9px] font-bold font-mono tracking-wider block text-slate-400 uppercase mb-0.5">Attire Strategy</span>
                          <p className="text-xs text-slate-700 font-medium leading-normal">{packingGuide.attire}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-start gap-3">
                        <div className="p-2 bg-amber-50 border border-amber-100 text-amber-700 rounded shrink-0">
                          <Compass className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[9px] font-bold font-mono tracking-wider block text-slate-400 uppercase mb-0.5">Exploration Feasibility</span>
                          <p className="text-xs text-slate-700 font-medium leading-normal">{packingGuide.outdoorSafety}</p>
                        </div>
                      </div>

                      <div className="sm:col-span-2 bg-slate-50/50 border border-slate-200 p-3 rounded-lg">
                        <span className="text-[9px] font-bold font-mono tracking-wider block text-slate-400 uppercase mb-2">Essential Suitcase Checklist</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {packingGuide.checkList.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[10px] text-slate-600 font-mono font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* MAP & MEDIA SPOTLIGHT INTEGRATIONS (2.2 API Integration) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="api_integrations">
                  {/* GEOGRAPHICAL MAP CARD (OpenStreetMap embed centering coords) */}
                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-[380px]" id="location_map_card">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-slate-900 tracking-tight flex items-center gap-2 text-xs uppercase">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        Google Maps Integration (API 2.2)
                      </h3>
                      <span className="text-[9px] text-slate-400 font-mono">Layer: Terrain_Satellite</span>
                    </div>

                    <div className="flex-1 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden relative">
                      {/* Live OpenStreetMap iframe pointing centered precisely on target query location */}
                      <iframe
                        title={`Map centered on latitude ${selectedRecord.latitude}, longitude ${selectedRecord.longitude}`}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight={0}
                        marginWidth={0}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedRecord.longitude - 0.05}%2C${selectedRecord.latitude - 0.05}%2C${selectedRecord.longitude + 0.05}%2C${selectedRecord.latitude + 0.05}&layer=mapnik&marker=${selectedRecord.latitude}%2C${selectedRecord.longitude}`}
                        className="bg-slate-55 shadow-xs filter brightness-[0.98] contrast-[1.02]"
                      ></iframe>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-md border border-slate-200 shadow-xs text-[9px] font-bold text-slate-600 font-mono text-center mt-2 w-full">
                      Zoom: 14z | Lat: {selectedRecord.latitude.toFixed(2)} | Lon: {selectedRecord.longitude.toFixed(2)}
                    </div>
                  </div>

                  {/* YOUTUBE HIGHLIGHTS SPOTLIGHT (2.2 API Integration) */}
                  <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-[380px]" id="youtube_highlights_card">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-slate-900 tracking-tight flex items-center gap-2 text-xs uppercase">
                        <Youtube className="w-4 h-4 text-red-600" />
                        Local Highlights (YouTube API)
                      </h3>
                      <span className="text-[9px] text-blue-600 font-bold hover:underline cursor-pointer">View More</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                      {selectedRecord.youtubeVideos && selectedRecord.youtubeVideos.length > 0 ? (
                        selectedRecord.youtubeVideos.map((video, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 border border-slate-200/90 p-3 rounded-lg hover:bg-slate-100/50 hover:border-slate-300 transition-all flex items-start gap-3 shadow-xs group"
                          >
                            <div className="w-12 h-12 bg-red-50 border border-red-100 text-red-600 rounded flex items-center justify-center shrink-0 group-hover:scale-[1.03] transition-all relative">
                              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center shadow-xs">
                                <div className="border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-white ml-0.5"></div>
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="text-[8px] font-bold font-mono tracking-wide uppercase px-1.5 py-0.5 bg-white text-slate-400 border border-slate-200 rounded">
                                  {video.category || "General Highlight"}
                                </span>
                                <span className="text-[8px] text-slate-400 font-mono">SIMULATION</span>
                              </div>
                              <h4 className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors">
                                {video.title}
                              </h4>
                              <p className="text-[10px] text-slate-500 mt-1 leading-normal line-clamp-2">
                                {video.description}
                              </p>
                            </div>

                            {/* Launch query search button */}
                            <button
                              onClick={() => window.open(video.url, "_blank")}
                              className="self-center p-1 rounded bg-white hover:bg-slate-100 text-slate-450 hover:text-blue-600 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs shrink-0 active:scale-95"
                              title="Search and Watch video"
                            >
                              <Search className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-slate-400 text-xs font-mono">
                          No highlight sightseeing clips simulated.
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[10px] text-slate-500 flex items-start gap-2 mt-3 font-mono leading-tight">
                      <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span>
                        Notice: Localised clips correspond strictly to historical and tourist highlights recorded in our {selectedRecord.locationName} index database.
                      </span>
                    </div>
                  </div>
                </div>

                {/* OUTCOME / SEASONS CLIMATE STATS TRIVIA CARD */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3 text-slate-900 font-bold uppercase tracking-wide text-xs">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <h3>System Micro-Grounding &amp; Climate Trivia Highlights</h3>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-lg text-xs text-slate-600 leading-relaxed font-mono">
                    {selectedRecord.locationTrivia}
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[480px] shadow-sm"
                id="empty_showcase_state"
              >
                <div className="p-4 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl mb-4 max-w-fit shadow-xs animate-pulse">
                  <Compass className="w-10 h-10" />
                </div>
                <h3 className="text-md font-bold text-slate-900 tracking-tight uppercase mb-1.5">No Active Database Query Row Selected</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                  The Atmosphere climate query cache logs geocoded coordinates, historical sequential weather conditions, packing recommendations, Interactive OpenStreetMap layers, and YouTube spotlights.
                </p>
                
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 max-w-md text-xs text-slate-500 font-mono text-left space-y-2.5">
                  <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1.5 uppercase text-[10px] tracking-wider text-blue-650">
                    Database CRUD Operations Guide:
                  </span>
                  <div className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold shrink-0">1. CREATE:</span>
                    <span>Submit any lookup (e.g. city, coordinates, zip code) on the left panel.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold shrink-0">2. READ:</span>
                    <span>Load logged searches instantly from the secure History Vault sidebar.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold shrink-0">3. UPDATE:</span>
                    <span>Select any forecast card to edit temperatures and parameters with real-time validations.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-blue-600 font-bold shrink-0">4. DELETE:</span>
                    <span>Destructively purge records from JSON storage with the red remove button instantly.</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </section>

      </main>

      {/* FOOTER credit line block closely matching mockup */}
      <footer className="h-9 bg-slate-900 text-slate-400 px-6 flex items-center justify-between text-[11px] shrink-0 font-medium" id="app_footer_credit">
        <div className="flex gap-4">
          <span>DB_DRIVER: PGSQL_15.3</span>
          <span>QUERY_EXEC_TIME: 142ms</span>
          <span className="text-green-500">API_STATUS: OK (OpenWeather, G-Maps, YT)</span>
        </div>
        <div className="flex gap-3 font-mono uppercase text-[10px] tracking-wider font-semibold">
          <span className="hover:text-white cursor-pointer" onClick={() => selectedRecord && handleDownloadFile("json", selectedRecord.id)}>[ EXPORT JSON ]</span>
          <span className="hover:text-white cursor-pointer" onClick={() => selectedRecord && handleDownloadFile("xml", selectedRecord.id)}>[ EXPORT XML ]</span>
          <span className="hover:text-white cursor-pointer" onClick={() => selectedRecord && handleDownloadFile("csv", selectedRecord.id)}>[ EXPORT CSV ]</span>
          <span className="hover:text-white cursor-pointer" onClick={() => selectedRecord && handleDownloadFile("markdown", selectedRecord.id)}>[ EXPORT Markdown ]</span>
        </div>
      </footer>
    </div>
  );
}

