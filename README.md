# THERMA — Area-Specific Passive Shelter Thermal Design Platform

A working prototype for SIH 2026 Problem Statement 26051 ("Software Based
Model Development for Design of Area Specific Shelter for Thermal Comfort
Maintenance"). This build is a **frontend engineering application**: every
thermal number is computed live in the browser by a real, documented physics
engine — nothing is hardcoded or AI-generated.

## What's real here

- **Physics engine** (`src/lib/physics.ts`): U-values from actual material
  layers, altitude-corrected air density/pressure (barometric formula),
  hourly solar gain / conduction / ventilation / infiltration loss, and a
  lumped-capacitance (single-node, 5R1C-inspired) dynamic indoor temperature
  model. Fully documented inline, formula by formula.
- **Live climate data** (`src/lib/climate.ts`): Open-Meteo API, no key
  required. Falls back to a labeled offline Leh/Ladakh demo dataset
  (`src/data/ladakhDemo.ts`) if the network is unavailable.
- **Interactive map** (Leaflet/OpenStreetMap) to pick any site.
- **2D floor plan** (SVG) and **3D shelter** (Three.js / React Three Fiber)
  that update live from geometry, with Solid / Thermal / Solar / Wireframe
  views, ventilation and occupancy overlays.
- **Material database** (`src/data/materials.ts`) — reference-grade
  properties (ASHRAE/ISO-style), multilayer wall/roof assembly editor.
- **Simulation, Results, Comparison, Report** pages — Recharts visualizations,
  JSON/CSV export, printable report, optional AI analysis (rule-based
  fallback if no LLM endpoint is configured — see `.env.example`).
- **Projects** persist to `localStorage` (create/save/duplicate/delete).

## What's intentionally out of scope for this build

Full production infrastructure — Node/Express API, MongoDB, Redis, a
separate Python FastAPI engine, Socket.IO, and authentication — was not
built here. Wiring, testing, and deploying five coordinated services isn't
something that can be verified working in one pass; scaffolding it without
running it would just hand you broken code. The `ShelterProject` type
(`src/types/index.ts`) already matches the MongoDB schema shape from the
original spec, so a backend can be added behind `src/lib/storage.ts` without
changing any UI code — swap its functions for `fetch()` calls to
`/api/projects` and add auth/session handling around them.

If you want, I can build that backend next as a separate, testable piece.

## Run it

```bash
cd therma
npm install
npm run dev
```

Open the printed local URL. No API keys are required for the core app.

## Environment variables (optional)

Copy `.env.example` to `.env`:

- `VITE_AI_API_BASE` / `VITE_AI_API_KEY` / `VITE_AI_MODEL` — optional
  OpenAI-compatible endpoint for the AI Engineering Analysis section on the
  Report page. Leave blank to use the built-in rule-based analysis.
- `VITE_CLIMATE_API_BASE` — defaults to Open-Meteo; override to point at a
  different climate provider (keep the same response shape or adjust
  `src/lib/climate.ts`).

## Build for production

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  types/        shared TypeScript interfaces (project, geometry, results)
  lib/          physics engine, solar position, climate service, storage, AI analysis
  data/         material database, Ladakh demo dataset
  store/        React context for the active project + saved projects
  components/   Nav, 2D/3D shelter renderers, map, stat cards
  pages/        Landing, Dashboard, New Project wizard, Designer, Simulation,
                Results, Comparison, Report, Saved Projects, Settings
```
