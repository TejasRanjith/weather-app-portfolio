# Weather Applications Portfolio - Assessments Workspace

Welcome to the Weather Applications Portfolio. This workspace contains two distinct high-performance weather dashboards:

1. **[Atmos / Weather Engine V1.0](./Assesment%201)**: A brutalist, front-end heavy dashboard integrating 5-day and 24-hour meteorological trends, satellite geolocation positioning, and address-based queries directly.
2. **[Atmosphere DB Engine v2.1](./Assesment%202)**: A modern, database-driven CRM and dashboard offering fuzzy geocoding via Gemini, OpenStreetMap coordinates centering, YouTube travel recommendations, local CRUD capabilities with local JSON persistency, and multi-format data exports (.json, .csv, .xml, .md).

---

## 📋 Developer & Organization Profile
- **Developer Name**: Tejas Ranjith
- **Affiliation**: Product Manager Accelerator (PMA)
- **LinkedIn Page**: [Product Manager Accelerator](https://www.linkedin.com/company/product-manager-accelerator)

### About PM Accelerator:
> The Product Manager Accelerator (PMA) is a premier career development program and community founded by Dr. Nancy Li. It empowers professionals—ranging from career switchers to experienced product managers—to transition into and advance within the PM and AI Product Management space. Through hands-on portfolio-building experience (including building and launching real-world AI products alongside engineering and design teams), customized coaching, resume branding, and interview preparation, PMA helps candidates land high-impact PM roles.

---

## 🛠️ System Requirements
A comprehensive list of package requirements and dependencies can be found in the root [requirements.txt](./requirements.txt) file.

### Prerequisites:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

## 🚀 Execution Instructions

### Project 1: Atmos / Weather Engine V1.0 (Assessment 1)
1. Navigate to the project directory:
   ```bash
   cd "Assesment 1"
   ```
2. Install all required npm dependencies:
   ```bash
   npm install
   ```
3. Set your environment variables:
   - Copy `.env.example` to `.env.local`.
   - Add your `GEMINI_API_KEY` to `.env.local`.
4. Launch the local dev server:
   ```bash
   npm run dev
   ```

### Project 2: Atmosphere DB Engine v2.1 (Assessment 2)
1. Navigate to the project directory:
   ```bash
   cd "Assesment 2"
   ```
2. Install all required npm dependencies:
   ```bash
   npm install
   ```
3. Set your environment variables:
   - Copy `.env.example` to `.env.local`.
   - Add your `GEMINI_API_KEY` to `.env.local`.
4. Launch the local dev server:
   ```bash
   npm run dev
   ```

---

## 🎥 Demo Video Details
A recorded screen-sharing explanation of the project has been prepared, detailing:
- Walkthrough of code organization and dependencies.
- Live demonstration of both applications in action.
- Demonstrating CRUD capabilities in Assessment 2, geocoding via Gemini, and brutalist design features in Assessment 1.
- Explanation of compliance with the PM Accelerator requirements.

**Demo Video URL**: [Insert your viewable video link here (Google Drive, YouTube, or Vimeo)]

---

## 📦 GitHub Submission
1. Create a new **Public** and **Open-Source** repository on GitHub.
2. Initialize Git, add files, commit, and push:
   ```bash
   git init
   git add .
   git commit -m "feat: integrate developer profile, requirements, and update readme details"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
3. Ensure the repository visibility is set to **Public** so the evaluation tech team has access.
