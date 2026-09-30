# PRD A — Data Engineering (Person A)

**Project:** VajraNet — Explainable AI Thunderstorm & Lightning Nowcast Demo  
**Role:** Person A — Data Engineering  
**Prerequisite:** Read `PRD_00_SHARED.md` completely before taking any action.

---

## 🎯 Your Mission

Get real thunderstorm and control-day data onto the disk—clean, verified, and correctly aligned with the shared coordinate grid. You own downloading raw satellite precipitation and atmospheric instability data, validating it against ground truth news reports, and preprocessing it into standard `.npz` packages for **Person B (ML Engine)**.

**Milestone Target:** **M1** — Hand Person B the first clean event (`pipeline/data/PROCESSED/evt_01.npz` + QA plots) so Person B can start training and evaluating.

---

## 📜 Non-Negotiable Data Engineering Rules (PRD_00 §3 & §7)

1. **Grid Geometry:** Native grid is **0.1°** cells. Arrays must be shaped `[time, row, col]` where:
   - **Row 0 = North** (`lat` descending from north to south).
   - **Col 0 = West** (`lon` ascending from west to east).
   - Bounding boxes are `[west, south, east, north]` outer cell edges.
2. **Issue Time vs Observation Window:**
   - An IMERG half-hour frame with start time $S$ covers $[S, S+30\text{min})$.
   - Issue time $T = S + 30\text{min}$. A forecast issued at $T$ can **never** peek at frames with start time $> T - 30\text{min}$.
3. **No Fabricated Storms:** Every event must have a verified news/IMD link in `docs/EVENT_SHORTLIST.md` and confirmed rain rate $\ge 5.0\text{ mm/h}$ in the IMERG data.
4. **Secrets:** Earthdata password goes in the root `.env`. Never commit, print, or push `.env`.

---

## 🛠️ Phase-by-Phase Implementation Plan

### Phase A0 — Environment & NASA Earthdata Setup
1. **Virtual Environment & Dependencies:**
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   pip install -r pipeline/requirements.txt
   ```
2. **NASA Earthdata Account:**
   - Sign up for a free NASA Earthdata account at: [urs.earthdata.nasa.gov](https://urs.earthdata.nasa.gov)
   - Add NASA GESDISC as an approved application in your Earthdata profile applications list.
3. **Secrets File:**
   - Create root `.env` from `.env.example`:
     ```ini
     EARTHDATA_USERNAME=your_username
     EARTHDATA_PASSWORD=your_password
     ```
   - Verify it is ignored by git: `git check-ignore -v .env`

---

### Phase A1 — Region & Candidate Shortlist
1. Review `docs/EVENT_SHORTLIST.md`.
2. Target region: Gangetic West Bengal & Odisha Convective Corridor:
   - Bounding Box: `[85.5, 21.0, 90.5, 26.0]` (approx 50x50 cells at 0.1°).
3. Candidate Dates: Pre-monsoon afternoon/evening thunderstorms (April–June 2024/2025) plus 1 fair-weather control day.

---

### Phase A2 — NASA GPM IMERG Downloader (`pipeline/raw_ingest/01_download_imerg.py`)
1. Create `pipeline/raw_ingest/01_download_imerg.py`.
2. Connect to NASA GES DISC / CMR API to locate half-hour IMERG Final/Late Run HDF5/NetCDF files (`GPM_3IMERGHH_07`).
3. Authenticate with HTTP Basic auth or `.netrc` session using `EARTHDATA_USERNAME` and `EARTHDATA_PASSWORD`.
4. Download the half-hour frames covering each candidate storm window (typically 6–8 hours per event) into:
   `pipeline/data/RAW/imerg/{event_id}/`

---

### Phase A3 — Atmospheric Instability Downloader (`pipeline/raw_ingest/02_download_openmeteo.py`)
1. Create `pipeline/raw_ingest/02_download_openmeteo.py`.
2. Query Open-Meteo Historical Weather API for the same bounding box and date ranges:
   - **Instability variables:** `cape`, `convective_inhibition`, `lifted_index`
   - **Surface & Steering winds:** `wind_speed_10m`, `wind_direction_10m`, `wind_speed_700hPa`, `wind_direction_700hPa`
   - **Context:** `temperature_2m`, `relative_humidity_2m`
3. Save raw JSON responses into:
   `pipeline/data/RAW/openmeteo/{event_id}.json`

---

### Phase A4 — Inspection & Sanity QA (`pipeline/raw_ingest/03_inspect_event.py`)
1. Load the first event (`evt_01`) using `xarray`.
2. Check for missing half-hour timesteps.
3. Verify coordinate orientation:
   - Does latitude decrease from Row 0 to Row N?
   - Does longitude increase from Col 0 to Col N?
4. Generate QA plots using `matplotlib`:
   - Maximum rain rate spatial heatmap.
   - Time-series plot of peak rain rate and CAPE across the event.
5. Save verification plots to `docs/figures/evt_01_qa.png`.

---

### Phase A5 — Preprocessing to Standard `.npz` (`pipeline/raw_ingest/04_preprocess_events.py`)
1. Resample and crop all frames onto the uniform 0.1° grid specified in Contract v1.0.
2. Package each event into `pipeline/data/PROCESSED/{event_id}.npz` with keys:
   - `rain`: float32 array `[time, ny, nx]` in mm/h.
   - `cape`: float32 array `[time, ny, nx]` in J/kg.
   - `timestamps`: 1D array of ISO-8601 UTC strings.
   - `lats`: 1D array of latitude coordinates (descending).
   - `lons`: 1D array of longitude coordinates (ascending).
   - `bbox`: `[west, south, east, north]`.

---

### Phase A6 — Milestone M1 Handover Report & Documentation
1. Write `docs/DATA_NOTES.md`:
   - Source data versions (GPM IMERG V07B, Open-Meteo).
   - Summary table of each processed event: Date, Bounding Box, Peak Rain Rate, Peak CAPE, Ground Truth Reference URL.
2. Hand over `pipeline/data/PROCESSED/evt_01.npz` to **Person B (ML Engine)**.

---

## 📌 Checklist to Mark Phase A Done:
- [ ] NASA Earthdata credentials verified and functional.
- [ ] Raw IMERG NetCDF files downloaded to `pipeline/data/RAW/imerg/`.
- [ ] Open-Meteo variables downloaded to `pipeline/data/RAW/openmeteo/`.
- [ ] Array coordinate order verified (`Row 0 = North`, `Col 0 = West`).
- [ ] `pipeline/data/PROCESSED/evt_01.npz` saved and verified with `numpy.load()`.
- [ ] QA figures saved in `docs/figures/`.
- [ ] `docs/DATA_NOTES.md` committed.
