# 📋 VajraNet — Feature Inventory & Post-Project Verification Guide

> **Document Purpose:** Complete reference manual of every screen, component, algorithm, dataset, and feature built for **VajraNet (Person C — App & Product)** under Contract Version **1.0**. Use this checklist when the full multi-person pipeline is complete to conduct end-to-end acceptance testing before final presentation and judging.

---

## 🏗️ 1. Technical Stack & Architecture

- **Framework:** Next.js 16.3 (App Router, Turbopack, React 19)
- **Language:** TypeScript 5.x (Strict typechecking with zero emitted errors)
- **Styling:** Vanilla Tailwind CSS with custom dark-mode aesthetic (curated HSL palettes, neon status accents, glassmorphic panels)
- **Geospatial Engine:** MapLibre GL JS v6 with local static Web Workers (`/maplibre/maplibre-gl-worker.mjs`), Carto Dark Matter vector basemap, custom HTML point markers, and Web-Mercator resampled PNG raster overlays
- **Realtime Synchronization:** `@supabase/supabase-js` v2 over WebSocket Broadcast channels (`vajranet-sim`) + native browser `BroadcastChannel` offline fallback
- **Data Contract:** Version 1.0 Frozen (`contracts/constants.json`, validated by `contracts/validate.py`)
- **Unit Testing:** Native Node.js test runner (`node:test`, `npm test`)

---

## 📱 2. Exhaustive Route & Feature Breakdown

### 2.1 Threat Home Screen (`/`)
* **Purpose:** Primary hyperlocal risk interface shown to a user opening the application.
* **Key Features:**
  - **Dynamic Target Area Selector:** Dropdown to switch between monitored points (e.g., Kolkata City Center, Burdwan Junction, Kharagpur Station).
  - **LRI Radial Risk Ring:** SVG circular progress gauge rendering the Lightning Risk Index (0–100) with color transition (Emerald $\to$ Amber $\to$ Orange $\to$ Rose).
  - **ETA Countdown Centerpiece:** Formatted arrival window (e.g. `15–30 min` or `Imminent / Underway`).
  - **Motion Vector Display:** Compass heading, approach bearing, and storm cell speed (e.g. *Approaching from WSW (245°) toward ENE at 42 km/h*).
  - **Explainable AI Drawer (`/why`):** Slide-up bottom sheet displaying:
    - Atmospheric convective instability parameters: **CAPE (J/kg)**, **CIN (J/kg)**, **surface 2m temperature (°C)**, and **relative humidity (%)**.
    - Rain intensity percentiles: **P10**, **P50 (median)**, and **P90** ensemble spread in mm/h.
    - **SHAP Feature Attribution Bars:** Explains the percentage contribution of individual atmospheric drivers (e.g. `+38% Air instability (CAPE)`, `+32% Upwind advection`, `-12% Convective Inhibition`).
  - **Persona-Tailored Safety Advice:** 4 distinct interactive persona chips:
    - **General Public:** Immediate enclosed indoor shelter, avoidance of corded electronics/windows, 30-30 rule.
    - **🌾 Farmer / Outdoor Worker:** Open-field clearing urgency, absolute prohibition of sheltering under isolated trees, wire fence clearance, borewell pump isolation.
    - **🚗 Commuter / Traveler:** Immediate pullover guidance for two-wheelers, vehicle Faraday-cage safety rules, underpass flooding warnings.
    - **🎪 Event Organiser:** Stage electrical grounding, generator isolation, crowd evacuation protocol.
  - **Mandatory Disclaimers:** Official timestamp in IST, data freshness tag, and legal notice: *"Prototype — not an official IMD meteorological warning"*.

---

### 2.2 Replay Theatre (`/replay`) — Milestone M0/M1/M2 Core
* **Purpose:** The cornerstone judge proof screen demonstrating that VajraNet would have honestly warned the public before real historical storm events.
* **Key Features:**
  - **Historical Event Selector:** Switch between verified storm events (`evt_mock_01` Pre-Monsoon Squall) and fair-weather control days (`evt_mock_02` Fair Weather Day).
  - **Mandatory Lead-Time Banner:** Computed directly from the point's `summary` block in `points/{id}.json`:
    > *"Alert would have fired at **14:45 IST**, exactly **45 min** before storm onset."*
  - **Interactive Playback Scrubber:** Timeline slider across all issue times ($T$) with **Play / Pause**, Step Backward, and Step Forward controls.
  - **Side-by-Side Dual Canvas (Split Mode):**
    - **Left Canvas:** AI Nowcast forecast frame at selected lead time ($T+30\text{m}$, $+60\text{m}$, $+90\text{m}$, $+120\text{m}$, $+180\text{m}$).
    - **Right Canvas:** Ground-truth observed satellite rain frame from NASA GPM IMERG verifying what actually happened.
    - Toggle buttons for: **Side-by-Side Split**, **Forecast Only**, and **Ground Truth Only**.
  - **Lead Selector:** Quick buttons to jump between $+30\text{m}$, $+60\text{m}$, $+90\text{m}$, $+120\text{m}$, and $+180\text{m}$ forecast horizons.
  - **Model Benchmark Scorecard Modal:** Populated from `results.json`:
    - Statistical comparison table comparing **Persistence Baseline**, **Plain Extrapolation**, **pySTEPS Ensemble**, **LightGBM ML**, and the **VajraNet Calibrated Blend**.
    - Evaluates: **POD** (Probability of Detection), **FAR** (False Alarm Ratio), **CSI** (Critical Success Index / Threat Score), and **Brier Score**.
    - Displays overall dataset metrics: Total Hits, Total Misses, Total False Alarms, Correct Nulls, and Median Warning Lead Time in minutes.

---

### 2.3 Live Interactive Radar Map (`/map`)
* **Purpose:** Full-viewport interactive spatial radar experience.
* **Key Features:**
  - **MapLibre GL JS Basemap:** Smooth panning, tilting, and zooming over the region of interest.
  - **Resampled RGBA Radar Overlay:** Renders transparent PNG radar frames correctly positioned using `image_coordinates` (`[[w, n], [e, n], [e, s], [w, s]]`).
  - **Playback Controller:** Bottom timeline bar with play/pause and time slider.
  - **Dual Operational Modes:**
    - **Observed Rain:** Historical radar progression.
    - **Forecast Nowcast:** Extrapolated future storm movement.
  - **Display Parameter Toggle:** Switch between **Rain Rate (mm/h)** and **Rain Probability $P(\ge 5\text{ mm/h})$**.
  - **Opacity Slider:** Adjust radar transparency between 20% and 100%.
  - **Floating Information Chips:**
    - Upper-left: Frame index, timestamp in IST, and ISO-8601 UTC string.
    - Bottom-right: Color-coded legend stops (1, 5, 15, 30, 50+ mm/h).
  - **Interactive Location Pins:** Clickable city markers (Kolkata, Burdwan, Kharagpur) with pulse indicators.

---

### 2.4 Alerts & Public Safety Bulletins (`/alerts`)
* **Purpose:** Historical log of triggered alerts and export of open standard emergency feeds.
* **Key Features:**
  - **Severity Feed:** Chronological cards with severity badges (`EMERGENCY`, `WATCH`, `ALL-CLEAR`).
  - **Status Filter:** Filter alerts by *All*, *Emergency*, *Watch*, or *All-Clear*.
  - **OASIS CAP 1.2 XML Export Button:** Directly generates standard XML compliant with international and NDMA/IMD alerting gateways via `/api/cap`.

---

### 2.5 OASIS CAP 1.2 XML Endpoint (`/api/cap`)
* **Purpose:** Machine-readable Common Alerting Protocol v1.2 feed.
* **Key Features:**
  - Strict compliance with `urn:oasis:names:tc:emergency:cap:1.2`.
  - Set to `<status>Exercise</status>` to prevent misinterpretation as official operational alerts.
  - Populates standard elements: `<identifier>`, `<sender>`, `<sent>`, `<msgType>`, `<scope>`, `<urgency>`, `<severity>`, `<certainty>`, `<headline>`, `<description>`, `<instruction>`, and `<area><circle>` coordinate radius.

---

### 2.6 Flash-to-Bang Estimator (`/flash`)
* **Purpose:** Immediate field safety tool using the physical speed of sound.
* **Key Features:**
  - **Step 1 ("I Saw Lightning"):** Starts high-precision millisecond stopwatch.
  - **Step 2 ("I Heard Thunder"):** Stops stopwatch, applies acoustic formula:
    $$\text{Distance (km)} = \text{Seconds} \times 0.343$$
  - **10 km Danger Zone Trigger:** If strike distance $\le 10.0\text{ km}$, immediately triggers pulsing red warning banner (*"DANGER ZONE: Seek substantial indoor shelter now"*).
  - **30-Minute Safety Buffer Timer:** Automatically activates a 30-minute countdown (1800s) enforcing the national lightning safety rule (waiting 30 min after last thunder before leaving shelter).
  - **Tap History:** Records recent strikes with timestamp, delay seconds, and calculated distance.

---

### 2.7 Judge Demo Simulation Console (`/control`)
* **Purpose:** Live stage demo tool allowing the presenter to trigger a synchronized simulated storm across judges' smartphones simultaneously.
* **Key Features:**
  - **Passcode Protection:** Gated with passcode (`vajra2026`) to prevent accidental triggers.
  - **Scenario Selection:** Toggle between different demo squall scenarios (e.g. 40 km squall line moving at 40 km/h).
  - **Action Triggers:**
    - **Launch Live Storm:** Broadcasts `{ type: "sim_start", ... }` via Supabase Realtime channel.
    - **Stop Simulation:** Broadcasts `{ type: "sim_stop", ... }`.
    - **Send Instant Warning:** Broadcasts `{ type: "test_alert", ... }`.
  - **Dual-Bus Broadcast:** Sends to both Supabase Realtime (internet/cross-phone) and local `BroadcastChannel` (offline same-machine demo).
  - **Feedback Console:** Displays real-time delivery status and timestamp of last sent signal.

---

### 2.8 System Settings & Localization (`/settings`)
* **Purpose:** Prototype controls and metadata verification.
* **Key Features:**
  - **Language Selector:** Toggle between **English** and **हिन्दी (Hindi)**.
  - **Data Pipeline Indicator:** Displays active root (`/data-mock` vs `/data`).
  - **Contract & Architecture Spec Viewer:** Summary of grid resolution (0.1°), ensemble count (20 members), and LRI equation.
  - **GitHub Quick Link:** Clickable card pointing to `ArinHarwani/VajraNet`.

---

## 📊 3. Data Contracts & Mock Dataset

All files in `web/public/data-mock/` comply with **Contract Version 1.0**:
- `events.json`: 2 events with coordinates, resolution, leads, and points.
- `colormap.json`: Exact hex stops for rain rate and probability.
- `results.json`: Complete benchmark metrics (POD, FAR, CSI, Brier) across 5 methods and 6 lead times.
- `sim_scenarios.json`: Motion vectors and ETA triggers for judge simulation.
- `events/evt_mock_01/manifest.json`: 98 transparent RGBA PNG frames (14 observed + 84 forecast frames).
- `events/evt_mock_01/points/*.json`: 3 point timelines (Kolkata, Burdwan, Kharagpur) with full SHAP explainability.
- `events/evt_mock_02/...`: Identical schema structure for fair-weather control day.

---

## 🧪 4. Post-Project Acceptance Checklist (Final Verification)

When the entire project is completed and Person A and B have plugged in their real data, use this checklist to confirm final readiness:

### Code & Environment
- [ ] Run `python contracts/validate.py web/public/data` — passes with 0 errors.
- [ ] Run `cd web && npm test` — all 6 unit tests pass.
- [ ] Run `cd web && npm run build` — Next.js compiles all 8 routes cleanly.
- [ ] Verify `git status` — no `.env` or `web/.env.local` files appear in tracked git history.

### User Interface & Interactivity
- [ ] **Home (`/`):** LRI ring matches severity color; changing point dropdown updates all numbers and ETA.
- [ ] **Why Panel (`/`):** Clicking *"Why this risk?"* opens drawer showing CAPE, CIN, P10/P50/P90, and SHAP bars.
- [ ] **Persona Tabs (`/`):** Toggling Farmer/Commuter/Event changes the 4 safety steps appropriately.
- [ ] **Replay (`/replay`):** Scrubbing time slider updates both forecast and observed frames smoothly.
- [ ] **Scorecard (`/replay`):** Clicking *"Scorecard"* displays benchmark table with CSI and FAR metrics.
- [ ] **Live Map (`/map`):** Map pans and zooms; radar overlay animates on play; switching between mm/h and P(≥5mm/h) toggles legend correctly.
- [ ] **Flash-to-Bang (`/flash`):** Tapping *"I Saw Lightning"* then *"I Heard Thunder"* after 3 seconds displays $\approx 1.03\text{ km}$ and starts the 30-minute timer.
- [ ] **CAP Export (`/alerts`):** Clicking *"Export CAP 1.2 XML"* downloads valid XML containing `<status>Exercise</status>`.
- [ ] **Live Judge Demo (`/control`):**
  1. Open `http://<your-ip>:3000/` on phone A and phone B.
  2. Open `http://<your-ip>:3000/control` on laptop, unlock with `vajra2026`.
  3. Click *"Launch Live Storm"*.
  4. Both phones display the synchronized flashing red emergency simulation countdown banner.
