# 🌩️ VajraNet — Data Engineering Documentation & Handoff Notes

> **Author:** Person A (Data Engineering)  
> **Status:** Milestone M1 Achieved (Ready for Person B ML & Nowcasting)  
> **Date:** September 2026 (Pre-Monsoon Convective Season Calibration)  
> **Region:** Gangetic West Bengal & Odisha Convective Corridor (`BBOX = [85.5, 21.0, 90.5, 26.0]`)

---

## 🚀 Handoff Note for Person B (ML / Nowcasting Lead)

> **`pipeline/data/PROCESSED/evt_01.npz` is ready for pySTEPS baseline and LightGBM training!**

### Dataset Specifications:
- **Location:** `pipeline/data/PROCESSED/evt_01.npz`
- **File Size:** ~0.07 MB (compressed NumPy archive)
- **Time Dimension:** `n_times = 48` frames (30-minute intervals covering `00:00:00Z` through `23:30:00Z` on `2024-05-07`)
- **Spatial Grid:** `50 x 50` cells at `0.1°` (~11 km resolution)
- **Spatial Alignment:**
  - `lat`: 50 points, descending from `25.95°N` to `21.05°N` (**Row 0 = North**)
  - `lon`: 50 points, ascending from `85.55°E` to `90.45°E` (**Col 0 = West**)
- **Variables included:**
  1. `rain`: `(48, 50, 50)` float32 — Instantaneous half-hour mean rain rate in **mm/h** (Max: **41.25 mm/h**).
  2. `times`: `(48,)` string — Strictly increasing ISO-8601 UTC timestamps with `Z` suffix.
  3. `lat`: `(50,)` float64 — Grid cell center latitudes.
  4. `lon`: `(50,)` float64 — Grid cell center longitudes.
  5. `cape`: `(48, 50, 50)` float32 — Convective Available Potential Energy in **J/kg** (Range: `0.0` – `3680.0 J/kg`).
  6. `t2m`: `(48, 50, 50)` float32 — 2-metre air temperature in **°C** (Range: `21.7°C` – `38.0°C`).
  7. `rh`: `(48, 50, 50)` float32 — 2-metre relative humidity in **%**.
  8. `cloud`: `(48, 50, 50)` float32 — Total cloud cover in **%**.
  9. `meta`: JSON string containing data provenance, units, and bounding box specifications.

### Quick Load Snippet for Person B:
```python
import json
import numpy as np

with np.load("pipeline/data/PROCESSED/evt_01.npz", allow_pickle=True) as data:
    rain = data["rain"]    # shape: (48, 50, 50)
    times = data["times"]  # shape: (48,)
    cape = data["cape"]    # shape: (48, 50, 50)
    lat = data["lat"]      # descending: 25.95 down to 21.05
    lon = data["lon"]      # ascending: 85.55 up to 90.45
    meta = json.loads(str(data["meta"]))

print(f"Loaded {meta['event_id']} ({meta['date']}): max rain = {rain.max():.2f} mm/h")
```

---

## 🛰️ Raw Data Ingest Provenance & Methodology

### 1. NASA GPM IMERG Precipitation (Ground Truth & Nowcast Input)
- **Dataset:** NASA Global Precipitation Measurement (GPM) Integrated Multi-satellitE Retrievals for GPM (IMERG) Early Run.
- **Short Name:** `GPM_3IMERGHHE` (Version 07B).
- **Temporal Resolution:** Half-hourly (48 files/day).
- **Native Spatial Resolution:** 0.1° x 0.1° (~11.1 km).
- **Data Center:** NASA Goddard Earth Sciences Data and Information Services Center (GES DISC).
- **Authentication:** NASA Earthdata Login with authorized GES DISC application access (`client_id=e2WVk8Pw6weeLUKZYOxvTQ`).
- **Gaps & Fills:** 48/48 granules downloaded with zero corruptions (100% coverage). 0.00% NaNs detected.

### 2. Atmospheric Instability Predictors (Open-Meteo Reanalysis)
- **Source:** Open-Meteo Historical Weather API (`https://archive-api.open-meteo.com/v1/archive`).
- **Model Reanalysis Engine:** `models=gfs_seamless` (providing full 24-hour non-null CAPE reanalysis and convective parameters).
- **Parameters:**
  - `cape` (J/kg): Convective Available Potential Energy (normalized up to 2500 J/kg per `contracts/constants.json`).
  - `convective_inhibition` (J/kg): CIN.
  - `temperature_2m` (°C): Surface cold pool onset indicator.
  - `relative_humidity_2m` (%): Near-surface moisture availability.
  - `cloud_cover` (%): Convective anvil cloud fraction.
  - `wind_speed_10m` & `wind_direction_10m`: Surface inflow/gust fronts.
- **Interpolation:** 28 spatial anchors across `BBOX` mapped onto the 50x50 target grid using nearest neighbor spatial interpolation (`scipy.interpolate.NearestNDInterpolator`).

---

## 📊 Quality Assurance Audit (Phase A5 & A6)

| Event ID | Date (UTC) | Category | IMERG Frames | Max Rain Rate | Mean Rain Rate | NaN % | QA Status |
|---|---|---|---|---|---|---|---|
| `evt_01` | 2024-05-07 | Severe Kalbaishakhi Convective Storm | 48 / 48 | **41.25 mm/h** | 0.281 mm/h | 0.00% | **PASS (Clean Convective Signal)** |

- **QA Inspection Plot:** `docs/qa/2024-05-07_frames.png` (Raw IMERG NetCDF4 slices across day).
- **Processed Verification Plot:** `docs/qa/evt_01_processed_frames.png` (Preprocessed array parity check).
- **Both plots match identically:** No spatial inversions, no transposition artifacts, coordinate conventions strictly honored.
