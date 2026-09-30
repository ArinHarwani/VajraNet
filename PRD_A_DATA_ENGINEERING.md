# PRD A — Data Engineering (Person A)

Read `PRD_00_SHARED.md` fully first — it has the conventions, constants and contracts this file relies on. This PRD is a strict phase list. Do not skip or reorder phases. Every phase ends with a **Phase Report** and a **Human check**, and the agent waits for approval before continuing.

**Your mission:** turn free, public weather data into clean, correct, QA'd arrays that Person B can run a nowcast model on, without any silent errors.

---

## Phase A0 — Environment

**Tasks**
1. Create `pipeline/raw_ingest/`, `pipeline/shared/`, `pipeline/data/RAW/`, `pipeline/data/PROCESSED/`, `pipeline/tests/`.
2. Create `pipeline/requirements.txt` pinned: `earthaccess`, `xarray`, `h5netcdf`, `netCDF4`, `numpy`, `pandas`, `scipy`, `matplotlib`, `requests`, `pydantic`, `pytest`, `python-dotenv`. [Verify exact working version numbers by installing in a clean venv and freezing]
3. Create a virtual environment and install. Confirm `python -c "import earthaccess, xarray, netCDF4"` works.
4. Follow `PRD_00_SHARED.md` Section 6 exactly to create root `.env` and `.env.example`. **STOP** and wait for the human to fill in `EARTHDATA_USERNAME` / `EARTHDATA_PASSWORD`.

**Human check:** confirm `.env` is filled in and NOT tracked by git (`git status` shows it untracked/ignored).

---

## Phase A1 — Earthdata login test

**Tasks**
1. Write `pipeline/raw_ingest/00_auth_test.py`:
   ```python
   from dotenv import load_dotenv
   load_dotenv()
   import earthaccess
   auth = earthaccess.login(strategy="environment")  # reads EARTHDATA_USERNAME/PASSWORD from env
   assert auth.authenticated, "Earthdata login failed"
   print("Earthdata login OK")
   ```
   [Verify the exact `earthaccess.login` strategy name/signature in its current docs — do not guess]
2. Run it. It must print success without printing the username/password anywhere.
3. If it fails, STOP and report the exact error text (never the credentials) to the human.

**Human check:** script prints "Earthdata login OK".

---

## Phase A2 — Config: region, dates, points [depends on human input]

**Tasks**
1. **STOP first.** Ask the human for: the region name, its approximate centre lat/lon, and confirmation that `docs/EVENT_SHORTLIST.md` (built in Phase 0 of the shared PRD) has at least 6 candidate dates with links.
2. Create `pipeline/shared/config.py`:
   ```python
   BBOX = [west, south, east, north]        # from PRD_00 Section 7 convention, outer edges
   CANDIDATE_DATES = [                      # from docs/EVENT_SHORTLIST.md, ISO date strings
       {"date": "2025-05-20", "label": "string", "source_url": "https://...", "expected_no_storm": False},
   ]
   TIMEZONE_LOCAL = "Asia/Kolkata"
   ```
   Only real, human-provided dates and URLs go in this file. No invented dates.
3. Write `pipeline/tests/test_config.py`: BBOX has 4 floats with west<east, south<north; every candidate has a date and a source_url starting with `https://`.
4. Run `pytest pipeline/tests/test_config.py`.

**Human check:** open `config.py`, confirm the box and dates match what was actually decided.

---

## Phase A3 — Download IMERG (the real rain data)

**Background for the agent:** Dataset is **GPM IMERG Early Run, Level 3, Half-Hourly, 0.1°, Version 07** (near-real-time-style product — use Early, not Final, so the nowcast stays honest about what would really have been available at the time; see `PRD_00_SHARED.md` Section 7 on issue time). [Verify the exact current short name via `earthaccess.search_datasets(keyword="GPM IMERG")` — do not hardcode a short name from memory without checking it resolves to results]

**Tasks**
1. Write `pipeline/raw_ingest/01_download_imerg.py`:
   - For each candidate date in `config.py`, search granules for that UTC day (remember: local date in `Asia/Kolkata` may span two UTC days — convert correctly, see PRD_00 §7).
   - Download using `earthaccess.download()` into `pipeline/data/RAW/imerg/<date>/`.
   - Skip a file if it already exists (checksum or just existence + size > 0).
   - **Test with exactly ONE date first.** Print granule count and file sizes. STOP after the first date and wait for a "continue" before looping over all dates.
   - Log every request (date, granule count, bytes) to `pipeline/data/RAW/imerg/download_log.jsonl`.
2. Write `pipeline/tests/test_download_imerg.py`: asserts that for a downloaded date, exactly 48 half-hourly files exist (or documents in the log why fewer — e.g. data gap) and each file is a valid HDF5/NetCDF (opens without error).
3. Run the one-date test. Report file count and sizes. **STOP.**
4. On approval, run for all candidate dates.

**Human check:** spot-open the download log; confirm dates match the shortlist; confirm no more than a couple of files are missing per day.

---

## Phase A4 — Download instability predictors (CAPE, CIN, temperature, humidity)

**Primary choice [Decided]:** **Open-Meteo Historical Weather API** (`https://archive-api.open-meteo.com/v1/archive`), no account needed, free for non-commercial use. It serves ERA5-based hourly reanalysis including `cape`, `temperature_2m`, `relative_humidity_2m`, `precipitation`, `wind_speed_10m`, `wind_direction_10m`, `wind_gusts_10m`, `cloud_cover`. [Verify `cape` and `convective_inhibition` are actually returned for your date range and region by making one test call and checking the response — CIN in particular may not be available; if missing, proceed without it and note it in DATA_NOTES.md, do not fabricate values]

**Tasks**
1. Write `pipeline/raw_ingest/02_download_predictors.py`:
   - For a small grid of points covering `BBOX` (e.g. every 0.5°, or just the event's demo points — decide based on Phase B's actual feature needs, coordinate with B before building the full grid), call the archive API for each candidate date with `hourly=cape,temperature_2m,relative_humidity_2m,cloud_cover` (add `convective_inhibition` only if Verify confirms it's returned).
   - Save raw JSON responses to `pipeline/data/RAW/predictors/<date>/<lat>_<lon>.json`.
   - Respect the API politely: small delay between calls, no more than a few requests per second. [Verify current rate-limit guidance for non-commercial use]
2. Write `pipeline/tests/test_download_predictors.py`: each saved JSON has an `hourly` key with a `time` array of length 24 and matching-length variable arrays.
3. Test on one date/point, then STOP, then run for all.

**Human check:** open one JSON file, confirm `cape` values look like real numbers (roughly 0–5000 range), not all zero or null.

---

## Phase A5 — Inspect and QA raw data (mandatory before any preprocessing)

This phase exists because silently ingesting broken data is the single most common failure. Do not skip it.

**Tasks**
1. Write `pipeline/raw_ingest/03_inspect.py` that, for each candidate date:
   - Opens all 48 IMERG files, extracts the precipitation variable over `BBOX`, and plots **6 evenly-spaced frames** across the day as a grid of small maps, saved to `docs/qa/<date>_frames.png`.
   - Prints: min/max/mean rain rate, % of pixels that are NaN, number of frames successfully read vs expected 48.
   - Flags a date as `SUSPECT` if: >10% NaN, or fewer than 40/48 frames readable, or max rain rate is 0 everywhere (likely wrong variable or wrong units).
2. **STOP.** Show the plots and stats to the human for every date. A human looks at the 6-frame plots and confirms: "yes, this looks like a real storm moving" or "this looks like noise / nothing / an error."
3. Cross-check: does the date and rough location of visible rain match the news report in `docs/EVENT_SHORTLIST.md`? If not, discuss with the human — the date, timezone, or bounding box may be wrong.
4. Only dates that pass this human review continue to Phase A6. Drop or re-investigate the rest.

**Human check:** this entire phase IS a human check — look at every plot before approving.

---

## Phase A6 — Preprocess to aligned arrays

**Tasks**
1. Write `pipeline/shared/geo.py` (co-owned with B, PR both approve) implementing exactly the conventions in `PRD_00_SHARED.md` §7: grid construction from `BBOX` at `grid_res_deg`, `[row,col]` with row 0 = north, haversine distance, bearing/heading helpers, lat/lon ↔ pixel index conversion. Write unit tests for each function with hand-checked examples (e.g. a known distance between two real cities).
2. Write `pipeline/shared/time_utils.py`: ISO-Z parsing/formatting, IMERG "frame start → covers [S,S+30)" helpers, "issue time" computation, IST conversion for display only. Unit tests with hand-checked examples.
3. Write `pipeline/raw_ingest/04_preprocess.py`:
   - Regrid every IMERG frame for a date onto the common grid from `geo.py` (IMERG is already ~0.1°, so this is mainly a crop + coordinate-order check, not interpolation — verify orientation matches convention, flip if needed).
   - Convert to mm/h (check the source units in the file metadata; IMERG precipitation is often already mm/h — [Verify] against the file's own unit attribute, don't assume).
   - Stack into one array `rain[t, y, x]` per date, plus `times` (ISO-Z, one per frame) and `lat`, `lon` (1-D arrays).
   - Attach the matching predictor values (Phase A4) nearest in time/space, forward-filled if an hour is missing, and log every fill.
   - Save as `pipeline/data/PROCESSED/<event_id>.npz` (`rain`, `times`, `lat`, `lon`, `cape`, `t2m`, `rh`, `cloud`, plus a `meta` dict with source, units, and how many gaps were filled).
4. Write `pipeline/tests/test_preprocess.py`: output array shapes match `(n_times, ny, nx)`; `lat` descending, `lon` ascending (per convention); no NaN remains without being explicitly documented in `meta`; timestamps are strictly increasing and 30 minutes apart.
5. Re-run the Phase A5 style 6-frame plot **on the processed array** (not the raw file) as a final sanity check, saved to `docs/qa/<event_id>_processed_frames.png`.

**Human check:** compare a raw-file plot (A5) and a processed-array plot (A6) for the same date side by side — they must look the same (same storm, same rough shape), just possibly cropped/regridded.

---

## Phase A7 — Assign event IDs, finalize shortlist, hand off

**Tasks**
1. For each date that passed A5+A6, assign `evt_01`, `evt_02`, ... Mark 1–2 as `is_no_storm: true`.
2. Write `docs/EVENT_SHORTLIST.md` final table: event_id, date, region, one-line description, reference URL, verified (yes/no by a human), is_no_storm.
3. Write `docs/DATA_NOTES.md`: exact dataset names and versions used, date range, units, known gaps and how they were filled, grid resolution, any date dropped in A5 and why.
4. Tell Person B, in a written handoff note (`docs/DATA_NOTES.md` top section or a message): "`pipeline/data/PROCESSED/evt_0X.npz` are ready. Shape and fields are: ... QA plots are at `docs/qa/`."

**Human check:** this is Milestone **M1** from the shared PRD — confirm with Person B that they can load and use the file before moving on to support B/C for the rest of the project.

---

## Ongoing (Day 2): support role
Once M1 is reached, your main job becomes: help Person B debug any data-shape issues, re-download or re-process if B finds a problem, and finish `docs/DATA_CARD.md` (licences/attribution: NASA GPM IMERG citation, Open-Meteo CC BY 4.0 attribution — [Verify current required citation text on each provider's site]). Do not start new downloads after the D2 09:00 decision point in the shared PRD unless explicitly asked.
