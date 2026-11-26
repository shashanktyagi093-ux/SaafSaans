# Project Architecture & Agent Guidelines

This document defines the strict architecture rules and verification commands for the Urban Air Quality & Sustainability Assistant web application.

## Strict Architecture Rules ("Code Computes, Gemini Explains")

1. **Deterministic Math Only in Code**: Use the free, keyless Open-Meteo Geocoding and Air Quality APIs (current + 48h hourly PM2.5, PM10, NO2, SO2, O3, CO). Calculate official Indian CPCB AQI (0–500), dominant pollutant, cleanest/worst 2-hour windows, and kg CO2/week savings purely in TypeScript under `lib/` with Vitest unit tests. Never let the LLM invent AQI numbers or arithmetic.
2. **Server-Side AI Only**: Call Gemini (`@google/genai`) exclusively inside `api/analyze.ts` with structured JSON output and a deterministic rule-based fallback if the API fails. Never expose `GEMINI_API_KEY` or import `@google/genai` inside `src/`.
3. **Honest, Functional UI**: Label air-quality figures as `"Modelled Open-Meteo Estimate — Informational Only, Not Medical Advice."` Every button, toggle, and checkbox must work with real state (no dead UI controls).
4. **Neutral Demo Content**: Keep search placeholders and sample defaults completely generic (e.g., `"Search any city..."`). Do not hardcode any specific regional or state names in the UI, prompts, or README.

## Verification Commands

- Run unit tests:
  ```bash
  npx vitest run
  ```
- Run typecheck and production build:
  ```bash
  npm run build
  ```
