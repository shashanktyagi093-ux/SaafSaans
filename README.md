# SaafSaans

> **Live Demo:** [Add Vercel URL after deploy]

**SaafSaans** is a location- and lifestyle-aware Urban Air Quality & Sustainability Assistant that turns live air-quality telemetry into actionable **Low-Emission Daily Routines** and **Indoor Air Quality Hacks** timed to your cleanest 2-hour windows. It pairs realistic **Sustainable Alternatives** for your commute and home with **Clear Impact Explanations** and an interactive weekly CO2 pledge tracker.

---

## Architecture: "Code Computes, Gemini Explains"

SaafSaans separates deterministic telemetry math from generative reasoning so AQI figures and CO2 arithmetic are never hallucinated:

1. **Keyless Telemetry (`lib/openMeteo.ts`)**: Fetches city coordinates and current + 48-hour hourly pollutants (`PM2.5`, `PM10`, `NO2`, `SO2`, `O3`, `CO`) from the free Open-Meteo Geocoding and Air Quality APIs.
2. **Deterministic Math (`lib/aqi.ts`, `lib/sustainability.ts`)**: Computes official Indian CPCB AQI (0–500), dominant pollutant, cleanest/worst 2-hour windows, safe ventilation windows (`AQI ≤ 100`), and weekly `kg CO2` / `car-km` savings purely in TypeScript with Vitest unit tests.
3. **Server-Side AI & Fallback (`lib/geminiAdvisor.ts`, `api/analyze.ts`)**: Calls `@google/genai` exclusively inside the Vercel serverless function using structured JSON output (`zod`-validated), re-locking all CO2 figures to deterministic IDs and falling back cleanly to a rule-based plan if `GEMINI_API_KEY` is unset or the upstream call fails.

---

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and add your Gemini API key (optional—the app runs cleanly in deterministic fallback mode without a key):
```bash
cp .env.example .env
```
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

### 3. Run Unit Tests & Dev Server
```bash
npx vitest run
npm run dev
```
Open `http://localhost:5173` in your browser. The Vite dev middleware automatically serves `/api/health` and `POST /api/analyze` locally.

---

## Verification & Production Build

```bash
npx vitest run
npm run build
```

---

## Deploying to Vercel

1. Push this repository to GitHub and import it into Vercel.
2. Set `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-2.5-flash` in **Project Settings → Environment Variables**.
3. Deploy—[vercel.json](vercel.json) routes `/api/*` directly to Vercel Serverless Functions while serving the Vite SPA for all other paths.

---

*Air quality metrics are labelled in-app as: "Modelled Open-Meteo Estimate & CPCB AQI Formula — Informational Only, Not Medical Advice."*
