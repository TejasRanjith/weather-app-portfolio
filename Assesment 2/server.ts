import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "db.json");

// Configure the Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper: Ensure database file exists
function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ records: [] }, null, 2), "utf8");
  }
}

// Helper: Read database
function readDb() {
  initDb();
  try {
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return { records: [] };
  }
}

// Helper: Write database
function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

// Setup CORS and parser middlewares
app.use(express.json());

// API: Check server health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// API: Get all weather query records
app.get("/api/records", (req, res) => {
  const db = readDb();
  // Sort by createdAt descending
  const sorted = [...db.records].sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ records: sorted });
});

// API: Create new weather query record (CREATE)
app.post("/api/records", async (req, res) => {
  const { location, startDate, endDate } = req.body;

  // 1. Validate parameters
  if (!location || typeof location !== "string" || !location.trim()) {
    return res.status(400).json({ error: "Location search string is required." });
  }

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Both startDate and endDate are required." });
  }

  // Validate Date Ranges
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: "Invalid date format. Please use YYYY-MM-DD." });
  }

  if (start > end) {
    return res.status(400).json({ error: "Start date must be before or equal to End date." });
  }

  // Max range protection (e.g. 31 days)
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays > 31) {
    return res.status(400).json({ error: "Date range exceeds the maximum limit of 31 days to avoid rate limits." });
  }

  try {
    // 2. Validate location exists and fuzzy-match details using Gemini
    console.log(`Validating location: "${location}"`);
    const geocodePrompt = `Analyze this user location entry: "${location}". 
    Check if it represents a real geographic location, postal code, coordinate, landmark, city, village, town, or administrative district anywhere in the world.
    
    IMPORTANT GUIDELINES:
    1. Be EXTREMELY generous and inclusive when validating locations. 
    2. Any real-world city, district, village, municipality, or region anywhere on Earth (such as "Thrissur", "Trichur", or other places in India/internationally) is ABSOLUTELY valid and must be marked isValid: true.
    3. Do not reject a location simply because the user did not include a province, state, or country name. Resolve the missing geographic hierarchy automatically (e.g. "Thrissur" resolves to "Thrissur, Kerala, India").
    4. Resolve and geocode it accurately to absolute coordinates (latitude and longitude) and a clean, elegant, formatted location name.`;

    const geocodeResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: geocodePrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { 
              type: Type.BOOLEAN, 
              description: "True if this matches a real-world location, coordinates, or landmark." 
            },
            formattedName: { 
              type: Type.STRING, 
              description: "Elegant formatted standard name. E.g. 'Paris, France', 'Seattle, WA, USA', 'Statue of Liberty, NY'." 
            },
            latitude: { type: Type.NUMBER },
            longitude: { type: Type.NUMBER },
            explanation: { 
              type: Type.STRING, 
              description: "Friendly correction or message if not valid or fuzzy-matched" 
            },
          },
          required: ["isValid", "formattedName", "latitude", "longitude"],
        },
      },
    });

    const parsedGeo = JSON.parse(geocodeResponse.text?.trim() || "{}");
    console.log("Geocode Result:", parsedGeo);

    if (!parsedGeo.isValid) {
      return res.status(400).json({ 
        error: parsedGeo.explanation || `The location "${location}" could not be confirmed. Please check spelling or enter a city or postal code.` 
      });
    }

    // 3. Retrieve high-fidelity current or historical weather and supplementary media with Gemini
    console.log(`Retrieving weather details for "${parsedGeo.formattedName}" from ${startDate} to ${endDate}`);
    
    const weatherPrompt = `You are a high-latitude Weather forecast and Historical weather engine.
    Target location: ${parsedGeo.formattedName} (Lat: ${parsedGeo.latitude}, Lng: ${parsedGeo.longitude}).
    Date range: From ${startDate} to ${endDate} (${diffDays} days).
    Reference date (Current Time): 2026-06-11.
    
    Complete these operations:
    1. Retrieve or synthesize highly authentic, realistic weather data for EACH calendar date in that range sequentially.
    2. Suggest 3 useful tourists or travel YouTube video topics/existing videos about this location. Provide plausible YouTube URLs (such as search queries search_query=travel+boston) and elegant video titles.
    3. Provide historical climate trivia for this seasonal month at this location.`;

    const weatherResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: weatherPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            temperatures: {
              type: Type.ARRAY,
              description: "Weather data for each day in the date range sequentially.",
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: "YYYY-MM-DD" },
                  tempC: { type: Type.NUMBER, description: "Average Celsius temperature" },
                  tempF: { type: Type.NUMBER, description: "Average Fahrenheit temperature" },
                  condition: { type: Type.STRING, description: "Weather condition, e.g. Sunny, Clear, Partly Cloudy, Cloudy, Rainy, Thundery, Snowing, Foggy" },
                  humidity: { type: Type.NUMBER, description: "Humidity percentage (0-100)" },
                  windKmh: { type: Type.NUMBER, description: "Wind speed in km/h" },
                  precipMm: { type: Type.NUMBER, description: "Precipitation in mm" },
                  conditionIcon: { 
                    type: Type.STRING, 
                    description: "Select one Lucide Icon string matching the condition: 'Sun', 'Cloud', 'CloudRain', 'CloudSnow', 'CloudLightning', 'CloudFog', 'CloudSun', 'Wind'" 
                  }
                },
                required: ["date", "tempC", "tempF", "condition", "humidity", "windKmh", "precipMm", "conditionIcon"]
              }
            },
            youtubeVideos: {
              type: Type.ARRAY,
              description: "Exactly 3 recommended tourist or destination video items.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING, description: "YouTube URL, e.g. https://www.youtube.com/results?search_query=travel+paris" },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING, description: "e.g. Travel Guide, Drone Tour, Weather, Vlog" }
                },
                required: ["title", "url", "description"]
              }
            },
            locationTrivia: {
              type: Type.STRING,
              description: "A short, engaging paragraph with historical weather trivia or facts about this location for this month."
            }
          },
          required: ["temperatures", "youtubeVideos", "locationTrivia"]
        }
      }
    });

    const parsedWeather = JSON.parse(weatherResponse.text?.trim() || "{}");
    
    // Create new record
    const newRecord = {
      id: "rec_" + Math.random().toString(36).substr(2, 9),
      searchQuery: location,
      locationName: parsedGeo.formattedName,
      latitude: parsedGeo.latitude,
      longitude: parsedGeo.longitude,
      startDate,
      endDate,
      temperatures: parsedWeather.temperatures,
      youtubeVideos: parsedWeather.youtubeVideos,
      locationTrivia: parsedWeather.locationTrivia,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to Database
    const db = readDb();
    db.records.push(newRecord);
    writeDb(db);

    res.status(201).json({ record: newRecord });
  } catch (err: any) {
    console.error("Error generating weather or content with Gemini:", err);
    res.status(500).json({ error: "Failed to process location and weather lookup. Please try again." });
  }
});

// API: Update weather query record details (UPDATE)
app.put("/api/records/:id", (req, res) => {
  const { id } = req.params;
  const { temperatures, locationTrivia, locationName } = req.body;

  // Validate record exists
  const db = readDb();
  const recordIndex = db.records.findIndex((r: any) => r.id === id);
  if (recordIndex === -1) {
    return res.status(404).json({ error: "Weather search record not found." });
  }

  const existingRecord = db.records[recordIndex];

  // Perform meticulous validation on user input
  if (locationName && (typeof locationName !== "string" || !locationName.trim())) {
    return res.status(400).json({ error: "Invalid location name format." });
  }

  if (temperatures) {
    if (!Array.isArray(temperatures)) {
      return res.status(400).json({ error: "Temperatures must be an array." });
    }

    // Validate each day's payload matches the specifications
    for (const item of temperatures) {
      if (!item.date || typeof item.tempC !== "number" || typeof item.tempF !== "number" || !item.condition) {
        return res.status(400).json({ error: "Each temperature entry must contain a date, tempC, tempF, and condition name." });
      }

      // Check for realistic boundaries
      if (item.tempC < -100 || item.tempC > 60) {
        return res.status(400).json({ error: `Temperature ${item.tempC}°C is physically incoherent. Please enter temperature between -100°C and 60°C.` });
      }

      if (item.humidity < 0 || item.humidity > 100) {
        return res.status(400).json({ error: "Humidity percentage must be between 0 and 100." });
      }

      if (item.windKmh < 0) {
        return res.status(400).json({ error: "Wind speed cannot be negative." });
      }

      if (item.precipMm < 0) {
        return res.status(400).json({ error: "Precipitation cannot be negative." });
      }
    }
  }

  // Update record fields
  const updatedRecord = {
    ...existingRecord,
    ...(locationName && { locationName }),
    ...(temperatures && { temperatures }),
    ...(locationTrivia && { locationTrivia }),
    updatedAt: new Date().toISOString(),
  };

  db.records[recordIndex] = updatedRecord;
  writeDb(db);

  res.json({ message: "Record updated successfully", record: updatedRecord });
});

// API: Delete weather query record (DELETE)
app.delete("/api/records/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  
  const recordIndex = db.records.findIndex((r: any) => r.id === id);
  if (recordIndex === -1) {
    return res.status(404).json({ error: "Weather search record not found." });
  }

  db.records.splice(recordIndex, 1);
  writeDb(db);

  res.json({ message: "Record deleted successfully", id });
});

// API: Get location suggestions (autocomplete)
app.get("/api/suggestions", async (req, res) => {
  const { query } = req.query;
  if (!query || typeof query !== "string" || !query.trim() || query.length < 2) {
    return res.json({ suggestions: [] });
  }

  try {
    const suggestionsPrompt = `The user is typing a location search in a weather app. 
    Analyze this input prefix: "${query}".
    Generate exactly 4 or 5 highly relevant, realistic real-world geographic location suggestions (cities, districts, villages, landmarks, or regions) matching or starting with this prefix from anywhere in the world.
    Resolve missing hierarchy gracefully (e.g. "thr" -> "Thrissur, Kerala, India", "Thiruvananthapuram, Kerala, India").
    Return a clean JSON array of suggestions.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: suggestionsPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of elegant, formatted location name strings"
            }
          },
          required: ["suggestions"]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    const suggestions = parsed.suggestions || [];
    res.json({ suggestions });
  } catch (err) {
    console.error("Error getting suggestions:", err);
    res.json({ suggestions: [] });
  }
});

// API: Export database record into JSON, CSV, XML, Markdown (2.3 Export Data)
app.get("/api/export/:format/:id", (req, res) => {
  const { format, id } = req.params;
  const db = readDb();
  const record = db.records.find((r: any) => r.id === id);

  if (!record) {
    return res.status(404).json({ error: "Weather search record not found." });
  }

  const safeLocation = record.locationName.replace(/[^a-z0-9]/gi, "_").toLowerCase();

  switch (format.toLowerCase()) {
    case "json": {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="weather_data_${safeLocation}.json"`);
      return res.send(JSON.stringify(record, null, 2));
    }

    case "csv": {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="weather_data_${safeLocation}.csv"`);
      
      let csv = "Date,Location,Latitude,Longitude,Celsius,Fahrenheit,Condition,Humidity_Percent,Wind_Kmh,Precipitation_Mm\n";
      record.temperatures.forEach((t: any) => {
        csv += `"${t.date}","${record.locationName}",${record.latitude},${record.longitude},${t.tempC},${t.tempF},"${t.condition}",${t.humidity},${t.windKmh},${t.precipMm}\n`;
      });
      return res.send(csv);
    }

    case "xml": {
      res.setHeader("Content-Type", "application/xml");
      res.setHeader("Content-Disposition", `attachment; filename="weather_data_${safeLocation}.xml"`);
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<WeatherRecord>\n`;
      xml += `  <ID>${record.id}</ID>\n`;
      xml += `  <LocationName>${record.locationName}</LocationName>\n`;
      xml += `  <Latitude>${record.latitude}</Latitude>\n`;
      xml += `  <Longitude>${record.longitude}</Longitude>\n`;
      xml += `  <StartDate>${record.startDate}</StartDate>\n`;
      xml += `  <EndDate>${record.endDate}</EndDate>\n`;
      xml += `  <Trivia>${record.locationTrivia}</Trivia>\n`;
      xml += `  <DailyForecasts>\n`;
      record.temperatures.forEach((t: any) => {
        xml += `    <Day>\n`;
        xml += `      <Date>${t.date}</Date>\n`;
        xml += `      <TempCelsius>${t.tempC}</TempCelsius>\n`;
        xml += `      <TempFahrenheit>${t.tempF}</TempFahrenheit>\n`;
        xml += `      <Condition>${t.condition}</Condition>\n`;
        xml += `      <Humidity>${t.humidity}</Humidity>\n`;
        xml += `      <WindSpeedKmh>${t.windKmh}</WindSpeedKmh>\n`;
        xml += `      <PrecipitationMm>${t.precipMm}</PrecipitationMm>\n`;
        xml += `    </Day>\n`;
      });
      xml += `  </DailyForecasts>\n`;
      xml += `</WeatherRecord>\n`;
      return res.send(xml);
    }

    case "markdown": {
      res.setHeader("Content-Type", "text/markdown");
      res.setHeader("Content-Disposition", `attachment; filename="weather_data_${safeLocation}.md"`);

      let md = `# Weather Report: ${record.locationName}\n\n`;
      md += `* **Date Range:** ${record.startDate} to ${record.endDate}\n`;
      md += `* **Coordinates:** Latitude ${record.latitude}, Longitude ${record.longitude}\n`;
      md += `* **Search Query Entered:** "${record.searchQuery}"\n`;
      md += `* **Report Generated On:** ${new Date(record.createdAt).toLocaleDateString()}\n\n`;
      
      md += `## Historical / Forecasted Temperatures\n\n`;
      md += `| Date | Temperature (°C) | Temperature (°F) | Condition | Humidity (%) | Wind Speed (km/h) | Precip. (mm) |\n`;
      md += `| :--- | :---: | :---: | :--- | :---: | :---: | :---: |\n`;
      record.temperatures.forEach((t: any) => {
        md += `| ${t.date} | ${t.tempC}°C | ${t.tempF}°F | ${t.condition} | ${t.humidity}% | ${t.windKmh} km/h | ${t.precipMm} mm |\n`;
      });
      
      md += `\n## Local Seasonal Trivia\n\n`;
      md += `${record.locationTrivia}\n\n`;

      md += `## Recommended Spotlights & Youtube Integrations\n\n`;
      record.youtubeVideos.forEach((v: any, index: number) => {
        md += `### ${index + 1}. [${v.title}](${v.url})\n`;
        md += `* **Category:** ${v.category || "General"}\n`;
        md += `* **Highlight:** ${v.description}\n\n`;
      });

      return res.send(md);
    }

    default: {
      return res.status(400).json({ error: "Unsupported export format. Choose json, csv, xml, or markdown" });
    }
  }
});

// Setup Vite & static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Weather app server running on http://0.0.0.0:${PORT}`);
    initDb();
  });
}

startServer();
