/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from "react";
import { Search, MapPin, Loader2, X, Compass } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GeocodingResult } from "../types";
import { searchLocations, parseCoordinates, parseGoogleMapsUrl } from "../utils/weatherUtils";

interface SearchBoxProps {
  onSelectLocation: (location: { latitude: number; longitude: number; name: string }) => void;
  onDetectLocation: () => void;
  isDetectingLocation: boolean;
}

export default function SearchBox({
  onSelectLocation,
  onDetectLocation,
  isDetectingLocation,
}: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect simple numeric Zip Codes (US or standard Int'l formats)
  const isZipDetected = /^\d{3,8}$/.test(query.trim()) || /^[A-Za-z0-9]{3,4}\s?[A-Za-z0-9]{3,4}$/.test(query.trim());

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    // Check if query is coordinates or Google Maps URL
    const coords = parseCoordinates(query);
    const mapsCoords = parseGoogleMapsUrl(query);
    if (coords || mapsCoords) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const handler = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const locations = await searchLocations(query);
        setResults(locations);
      } catch (err) {
        setError("Location search service offline.");
      } finally {
        setIsLoading(false);
      }
    }, 400); // Wait 400ms

    return () => clearTimeout(handler);
  }, [query]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // 1. Try parsing coordinates
    const parsedCoords = parseCoordinates(query);
    if (parsedCoords) {
      onSelectLocation({
        latitude: parsedCoords.latitude,
        longitude: parsedCoords.longitude,
        name: `GPS Point (${parsedCoords.latitude.toFixed(4)}, ${parsedCoords.longitude.toFixed(4)})`,
      });
      setShowDropdown(false);
      return;
    }

    // 2. Try parsing Google Maps link
    const mapsCoords = parseGoogleMapsUrl(query);
    if (mapsCoords) {
      onSelectLocation({
        latitude: mapsCoords.latitude,
        longitude: mapsCoords.longitude,
        name: mapsCoords.name,
      });
      setShowDropdown(false);
      return;
    }
    
    // 3. Fall back to search results selection
    if (results.length > 0) {
      const first = results[0];
      const displayName = `${first.name}${first.admin1 ? `, ${first.admin1}` : ""}${first.country ? ` (${first.country})` : ""}`;
      onSelectLocation({
        latitude: first.latitude,
        longitude: first.longitude,
        name: displayName,
      });
      setShowDropdown(false);
    } else if (query.trim().length > 0) {
      setError("Please paste a valid Google Maps link, exact GPS [lat, lon], or zip code.");
    }
  };

  const parsedCoords = parseCoordinates(query);
  const mapsCoords = parseGoogleMapsUrl(query);

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50 px-4 mb-4" ref={dropdownRef}>
      <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-stretch">
        <div className="relative flex-1">
          <input
            type="text"
            className="w-full bg-white text-[#141414] placeholder-[#141414]/50 pl-11 pr-10 py-3 rounded-none border-2 border-[#141414] focus:outline-none focus:bg-[#E4E3E0] transition-colors font-mono text-sm uppercase"
            placeholder="Search address, zip, Google Maps link, or coords..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            id="location-search-input"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#141414]">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setError(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#141414] hover:opacity-75 transition-colors p-1"
              title="Clear Search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onDetectLocation}
          disabled={isDetectingLocation}
          className="border-2 border-[#141414] bg-white text-[#141414] px-5 py-3 rounded-none text-sm font-bold tracking-tight uppercase hover:bg-[#141414] hover:text-[#E4E3E0] active:translate-y-[1px] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          title="Detect position"
          id="detect-location-btn"
        >
          {isDetectingLocation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
          LOCATE ME
        </button>
      </form>

      {/* Tip text under the search input with elegant minimalist alignment */}
      <div className="mt-1.5 px-1 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[9px] font-mono text-[#141414]/60 uppercase tracking-wider select-none">
        <span>TIP: Supports PIN codes (such as 680006), ZIP codes, or coordinates</span>
        <span>Google Maps URL inputs automatically parsed</span>
      </div>

      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {showDropdown && (query.trim().length >= 2 || parsedCoords || mapsCoords) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute left-4 right-4 mt-1.5 bg-white border-2 border-[#141414] rounded-none shadow-xl overflow-hidden max-h-80 overflow-y-auto z-50 divide-y-2 divide-[#141414] font-mono text-sm"
          >
            {/* Google Maps link matches */}
            {mapsCoords && (
              <div
                onClick={() => {
                  onSelectLocation({
                    latitude: mapsCoords.latitude,
                    longitude: mapsCoords.longitude,
                    name: mapsCoords.name,
                  });
                  setShowDropdown(false);
                }}
                className="flex items-center gap-3 px-4 py-3 bg-[#141414] text-[#E4E3E0] hover:bg-neutral-800 cursor-pointer transition-colors animate-pulse"
                id="maps-coords-option"
              >
                <Compass className="w-5 h-5 shrink-0 text-[#dc2626]" />
                <div className="text-left w-full">
                  <p className="font-bold tracking-wide">CONNECT GOOGLE MAPS PIN</p>
                  <p className="text-xs opacity-95 uppercase font-semibold">{mapsCoords.name}</p>
                  <p className="text-[10px] opacity-70">LAT: {mapsCoords.latitude.toFixed(5)} | LON: {mapsCoords.longitude.toFixed(5)}</p>
                </div>
              </div>
            )}

            {/* Exact Custom Coordinates Block */}
            {parsedCoords && (
              <div
                onClick={() => {
                  onSelectLocation({
                    latitude: parsedCoords.latitude,
                    longitude: parsedCoords.longitude,
                    name: `GPS Point (${parsedCoords.latitude.toFixed(4)}, ${parsedCoords.longitude.toFixed(4)})`,
                  });
                  setShowDropdown(false);
                }}
                className="flex items-center gap-3 px-4 py-3 bg-[#141414] text-[#E4E3E0] hover:bg-neutral-800 cursor-pointer transition-colors"
                id="gps-coords-option"
              >
                <MapPin className="w-5 h-5 shrink-0" />
                <div className="text-left w-full">
                  <p className="font-bold">PIN GPS COORDINATES</p>
                  <p className="text-xs opacity-80">LAT: {parsedCoords.latitude.toFixed(5)} | LON: {parsedCoords.longitude.toFixed(5)}</p>
                </div>
              </div>
            )}

            {/* Postal code detection line banner */}
            {isZipDetected && results.length > 0 && (
              <div className="bg-[#141414]/5 text-[#141414] px-4 py-1.5 text-[9px] font-bold tracking-wider uppercase border-b-2 border-[#141414]">
                ⚡ ZIP/POSTAL CODE STATION SEARCH DETECTED
              </div>
            )}

            {results.length > 0 &&
              results.map((loc) => {
                const region = [loc.admin1, loc.country].filter(Boolean).join(", ");
                return (
                  <div
                    key={loc.id}
                    onClick={() => {
                      const displayName = `${loc.name}${loc.admin1 ? `, ${loc.admin1}` : ""}${loc.country ? ` (${loc.country})` : ""}`;
                      onSelectLocation({
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        name: displayName,
                      });
                      setShowDropdown(false);
                    }}
                    className="flex flex-col px-4 py-3 hover:bg-[#141414] hover:text-[#E4E3E0] cursor-pointer transition-colors text-left font-mono"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold text-xs uppercase">{loc.name}</span>
                      {loc.postcodes && loc.postcodes.length > 0 && (
                        <span className="bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 text-[8px] font-bold font-mono">
                          PC: {loc.postcodes[0]}
                        </span>
                      )}
                    </div>
                    {region && <span className="text-[10px] opacity-75 uppercase mt-0.5">{region}</span>}
                  </div>
                );
              })}

            {results.length === 0 && !parsedCoords && !mapsCoords && !isLoading && (
              <div className="px-4 py-6 text-center text-[#141414]/70 font-mono text-xs space-y-1">
                <p className="font-bold">NO MATCHING METEOROLOGICAL STATIONS FOUND.</p>
                <p className="text-[10px] opacity-65">Try inputting exact decimal coordinates [lat, lon] or check zip code.</p>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 bg-[#dc2626] text-white text-xs text-center font-mono uppercase">
                {error}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
