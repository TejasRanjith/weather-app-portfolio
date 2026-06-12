# Atmos / Weather Engine V1.0

A high-performance brutalist weather dashboard featuring real-time meteorological tracking, WMO interpretation code mapping, dynamic 5-day forecasts, 24-hour meteorological trends, and precise multi-format geolocational search (supporting address queries, Indian PIN codes, US ZIP codes, exact GPS decimal coordinates, and Google/Apple Maps sharing links).

---

## 🛠️ Project Features & Technical Highlights

- **Brutalist Retro Aesthetics**: Bold, high-contrast typography, solid borders, HSL colors, and micro-animations styled purely with Tailwind CSS and Framer Motion.
- **Geocoding & Location Parser**: Supports standard city/landmark query inputs, alphanumeric postal codes, exact decimal coordinates (e.g., `40.7128, -74.0060`), and parses coordinates directly out of copy-pasted Google Maps or Apple Maps share links.
- **24-Hour MET-Grid Trend**: Precise hourly temperature forecasts and precipitation probabilities.
- **5-Day Meteorological Forecast**: Extended forecasting utilizing high-fidelity Open-Meteo weather models.
- **GPS Triangulation**: Direct device geolocation detection using HTML5 Geolocation API.
- **Brutalist Developer Module**: Embedded system profile showcasing the developer's credentials and organization details.

---

## 📋 Developer & Organization Profile

- **Developer / Operator**: Tejas Ranjith
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
Start the local development server:
```bash
npm run dev
```
The application will be accessible at: [http://localhost:3000](http://localhost:3000)

### 5. Build for Production
To bundle the application for production delivery:
```bash
npm run build
```
Production assets will compile to the `dist/` directory.

---

## 📚 Libraries & Packages Used
- **React 19**: Component tree management and reactive hooks.
- **Tailwind CSS v4**: Utility-first styling.
- **Framer Motion**: Brutalist micro-animations and page transitions.
- **Lucide React**: Clean vector icon toolkit.
- **Vite 6**: Rapid hot-reloading development server and compiler.
