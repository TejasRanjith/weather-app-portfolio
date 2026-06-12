# Atmosphere DB Engine v2.1

A comprehensive climate database management engine and dashboard featuring fuzzy geocoding, sequential forecast logging, real-time database CRUD operations, local persistency, data exports in multiple formats (JSON, CSV, XML, Markdown), Google Maps OpenStreetMap tracking, YouTube highlight integrations, and a smart travel packing checklist.

---

## 🛠️ Project Features & Technical Highlights

- **Full DB CRUD Engine (Create, Read, Update, Delete)**:
  - **Create**: Query any location (city, zipcode, GPS point, landmark) and date range (up to 31 days) to geocode and fetch detailed weather logs via server-side Gemini 3.5 Flash.
  - **Read**: Browse and review logged historical/forecasted ranges in the left sidebar vault.
  - **Update**: Select any forecasted day to edit temperatures (Celsius/Fahrenheit synchronized automatically), condition labels, humidity ratio, wind velocity, and precipitation volumes with active server-side validations.
  - **Delete**: Purge search logs instantly from the database.
- **Gemini 3.5 Flash Geocoder**: Autocomplete suggestions and fuzzy geocoding resolve input addresses, landmarks, and coordinates dynamically.
- **YouTube API Integration**: Autonomously recommends 3 relevant destination tour, travel vlog, or weather forecast clips based on the active location.
- **OpenStreetMap Embed**: Centered coordinates markers track exact query parameters dynamically.
- **Delimited Data Export**: Instantly compiles and downloads local climate tables in four distinct standard formats:
  - `.json` (Structured JSON)
  - `.csv` (Comma-Separated Values table)
  - `.xml` (Extensible Markup Language markup tree)
  - `.md` (Polished Markdown Report with tables)
- **Smart Luggage Compiler**: Analyzes humidity, temperature boundaries, and weather parameters to recommend tailored wardrobe strategies and packing lists.
- **Developer Profile Panel**: A clean sidebar module displaying the developer's credentials and organization details.

---

## 📋 Developer & Organization Profile

- **Developer / Analyst**: Tejas Ranjith
- **Affiliation**: Product Manager Accelerator (PMA)
- **LinkedIn Page**: [Product Manager Accelerator](https://www.linkedin.com/company/product-manager-accelerator)

### About PM Accelerator:
> The Product Manager Accelerator (PMA) is a premier career development program and community founded by Dr. Nancy Li. It empowers professionals—ranging from career switchers to experienced product managers—to transition into and advance within the PM and AI Product Management space. Through hands-on portfolio-building experience (including building and launching real-world AI products alongside engineering and design teams), customized coaching, resume branding, and interview preparation, PMA helps candidates land high-impact PM roles.

---

## 🚀 How to Run Locally

### 1. Prerequisites
Ensure you have **Node.js** (v18.0.0 or higher) and **npm** installed.

### 2. Install Dependencies
Run the following command in your terminal to install all required packages:
```bash
npm install
```

### 3. Setup Environment Variables
1. Copy the example environment template:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and configure your **Gemini API Key**:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

### 4. Run Development Server
Start the Express server and Vite development middleware:
```bash
npm run dev
```
The application will be accessible at: [http://localhost:3000](http://localhost:3000)

### 5. Build for Production
1. Compile frontend client assets and bundle Express backend:
   ```bash
   npm run build
   ```
2. Start the production build:
   ```bash
   npm run start
   ```

---

## 📚 Libraries & Packages Used
- **Vite 6 / React 19 / Tailwind CSS v4**: Frontend build environment, styling system, and interface framework.
- **Framer Motion**: Animations and state transitions.
- **Express 4**: Server-side router and geocoding backend.
- **@google/genai**: Google Gemini API client SDK.
- **tsx**: Direct execution engine for TypeScript files.
- **esbuild**: Server bundler.
- **db.json**: Simple local filesystem persistency layer.
