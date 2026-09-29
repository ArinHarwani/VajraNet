# PRD 00 — SHARED (read by ALL 3 people and ALL 3 agents, before anything else)

**Project:** VajraNet — explainable AI thunderstorm & lightning nowcast demo · SIH26072 · Contract version **1.0**
**Files:** `PRD_00_SHARED.md` (this) · `PRD_A_DATA_ENGINEERING.md` (Person A) · `PRD_B_ML_NOWCAST.md` (Person B) · `PRD_C_APP_PRODUCT.md` (Person C)
Legend: **[Decided]** fixed · **[Proposed]** may change, needs all 3 people's OK · **[Verify]** confirm before relying on it · **STOP** = agent must halt and ask the human, not guess.

---

## 1. The three roles, one sentence each

- **Person A — Data Engineering:** gets real storm data onto the disk, clean and correct. Owns downloading and preprocessing.
- **Person B — ML / Nowcast Engine:** turns A's clean data into predictions (pySTEPS + LightGBM), scores them against reality, and exports the exact files the app needs.
- **Person C — App & Product:** builds the phone app, the live "storm approaching" demo, the alerts, and packages everything for submission.

**Dependency chain:** A → B → C, but only for *real data*. C does not wait: C builds against **mock data** from hour zero, and switches to real data only once B hands it over (Milestone M2). This is the single most important idea in this whole plan — read it twice.

## 2. How to run this with Antigravity (do this exactly)

Each person opens the repo in their own Antigravity workspace/session and adds a rule (workspace rule / `AGENTS.md` — exact mechanism: [Verify in current Antigravity docs]) that says:

> "Read PRD_00_SHARED.md and PRD_<X>_....md completely before any action. Work one phase at a time, in order. At the end of every phase, stop and produce a Phase Report: what you ran, exact inputs, exact outputs (file paths), which checks passed or failed, assumptions you made, and anything you could not verify. Wait for my explicit approval before starting the next phase. Never invent data, dates, URLs, numbers, library functions, or metrics — if you cannot find or confirm something, say STOP and ask. Never delete or weaken a test to make it pass."

Kickoff prompt (same shape for all three, swap the letter):
> "Read PRD_00_SHARED.md and PRD_A_DATA_ENGINEERING.md in full. Give me an implementation plan for Phase A0 only, nothing else. Wait for my approval before touching any file."

**The human's job each phase:** read the Phase Report, check the "Human check" line for that phase, and only then say "approved, continue."

## 3. Non-negotiable rules (every agent, every phase)

1. **No fabrication.** No invented storm dates, news links, coordinates, metrics, dataset variable names, or library APIs. Unconfirmed → STOP.
2. **No silent substitution.** If real data is missing or a step fails, never quietly swap in fake data. Fake/synthetic data only lives under a path containing `mock` or `data-mock`, and every such file is marked `"mock": true`.
3. **No test-set peeking.** Model thresholds, features, and blend weights are chosen only on training days, never on the 3–5 replay/test events. (Full detail in Person B's PRD.)
4. **Fail loudly.** No bare `except: pass`. Every script prints what it's doing and exits non-zero on error.
5. **Reproducible.** Fixed random seed `42` everywhere. Pin dependency versions in a `requirements.txt` / `package.json`. Every script logs its inputs and outputs.
6. **Tests before "done."** `pytest` (Python) / `vitest` (web) must pass before a Phase Report can say complete.
7. **Secrets are never read by the agent.** See Section 6. No `.env` file is ever opened, printed, or committed.
8. **Honest language, always.** Never say "radar" for satellite-derived rain data — say "satellite-derived precipitation (IMERG)". Lightning output is an **index**, never a "probability". Anything simulated is labelled **SIMULATION**. Every screen shows a data timestamp and: *"Prototype — not an official warning."*
9. **Contracts are frozen.** The JSON shapes in Section 8 don't change without all 3 people agreeing and logging it in `contracts/CHANGELOG.md`.
10. **Document as you go.** Each phase updates its doc file (list is per-person PRD).

## 4. Repository layout and ownership

```
/PRD_00_SHARED.md  /PRD_A_DATA_ENGINEERING.md  /PRD_B_ML_NOWCAST.md  /PRD_C_APP_PRODUCT.md
/README.md  /LICENSE  /.gitignore  /.env.example  (local only, ignored: /.env)
/contracts/    constants.json  *.schema.json  validate.py  CHANGELOG.md      -- built in Phase 0, owned jointly
/pipeline/
  /raw_ingest/    01_*, 02_*                                                  -- Person A
  /nowcast/       03_*..07_*                                                  -- Person B
  /shared/        geo.py, time_utils.py  (imported by both A and B)
  /data/          RAW/  PROCESSED/  (git-ignored, both read/write per their PRD)
  /tests/
/models/         growth_lgbm.txt  feature_names.json  train_meta.json         -- Person B
/web/            Next.js app; public/data-mock/ ; public/data/                -- Person C (public/data/ is filled by B's export, then owned by C)
/docs/           EVENT_SHORTLIST.md  DATA_NOTES.md (A)  MODEL_CARD.md RESULTS.md (B)  DATA_CARD.md README parts (C)  figures/  screenshots/  qa/
```
- Branches: `main` (always demo-stable) · `feat/data` (A) · `feat/ml` (B) · `feat/app` (C). Merge by PR at each milestone; a different person reviews.
- A owns `/pipeline/raw_ingest` and `pipeline/data/RAW`. B owns `/pipeline/nowcast`, `/models`, `pipeline/data/PROCESSED` outputs, and writes into `web/public/data/`. C owns everything in `/web` except the `public/data/` *contents* (C only reads/renders it). `/pipeline/shared` is edited by A or B only with a PR the other approves.
- Tag `demo-stable` on every state where the full demo path works end-to-end.
- Git-ignored: `pipeline/data/`, `node_modules/`, `.next/`. Committed: `web/public/data-mock/`, `web/public/data/` (small exported files only), `/contracts`, all docs.

## 5. Accounts — who creates what, and why

| Account | Owner | Why | Cost |
|---|---|---|---|
| **NASA Earthdata** (urs.earthdata.nasa.gov) | **A** | Download real rain data (IMERG) | Free |
| Copernicus CDS (optional) | A | Only if Open-Meteo's historical API doesn't cover a needed variable | Free |
| **GitHub** | **C** creates the repo, all 3 join | Code + submission proof | Free |
| **Supabase** | **C** | Realtime signal for the simulated storm; optional push storage | Free tier |
| **Vercel** | **C** | Hosts the app so judges get a live link/QR | Free tier |

Person B needs **no account** — B only runs Python locally/in the agent's terminal on files A already downloaded.

## 6. Secrets and `.env` files [Decided]

Two separate secrets files, both git-ignored, each with a committed `*.example` template with empty values:

**Root `.env`** (Person A only):
```
EARTHDATA_USERNAME=
EARTHDATA_PASSWORD=
```
**`web/.env.local`** (Person C only):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SIM_CHANNEL=
CONTROL_PASSCODE=
NEXT_PUBLIC_DATA_BASE=/data-mock
NEXT_PUBLIC_MAP_STYLE_URL=
# P1 only:
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
SUPABASE_SERVICE_ROLE_KEY=
```

**Exact agent procedure, in order, run by whoever owns the file (A for root `.env`, C for `web/.env.local`):**
1. Add the right entries to `.gitignore` **first**: `.env`, `.env.*`, `!.env.example`, `web/.env.local`, `pipeline/data/`, `*.netrc`, `__pycache__/`, `node_modules/`, `.next/`.
2. Create the `*.example` file (names only, committed).
3. Create the real `.env` / `web/.env.local` by copying the example (values still empty).
4. Verify: `git check-ignore -v .env` (and `web/.env.local`) must report them as ignored; `git ls-files | grep -E '\.env(\.local)?$'` must print nothing.
5. **STOP.** Tell the human: "Open `.env` yourself and fill in the values. Do not paste them into this chat."
6. From then on, the agent never opens/cats/prints these files. Code reads them only through `python-dotenv`'s `load_dotenv()` (Python) or Next.js's built-in env loading (JS), and only ever checks "is this variable present", never its value.

Password note: avoid `#`, spaces, quotes and backslash in the Earthdata password — `#` starts a comment inside `.env` files. If a secret is ever pasted into chat or committed by mistake, rotate it immediately.

## 7. Shared conventions (the usual source of silent bugs — follow exactly)

**Time**
- Everything stored is **UTC**, ISO-8601 with `Z` (e.g. `2025-05-20T09:30:00Z`). Only the UI converts to **IST** and always labels it "IST".
- An IMERG half-hour frame with **start time S** covers `[S, S+30min)` and its value is the mean rain rate over that interval.
- **Issue time T** = the earliest moment a forecast could honestly be made = `(last available frame's start) + 30min`. A forecast issued at T may only use frames with start `≤ T − 30min`. Never anything later — this is what makes the nowcast honest.
- Forecast for **lead L minutes**, issued at T, verifies against the observed frame with `valid_start = T + L − 30min`.

**Geometry**
- Native grid: **0.1°** IMERG cells (~11.1 km N–S; E–W ≈ 11.1 × cos(latitude) km). Arrays are `[row, col]` with **row 0 = north**, **col 0 = west**; `lat` descending, `lon` ascending.
- Bounding boxes are stored as `[west, south, east, north]`, using **outer cell edges**.
- `heading_deg`: compass bearing the storm moves **toward** (0=N, 90=E, clockwise). `from_deg = (heading_deg + 180) % 360`.
- "Rain at a point" = **max over the 3×3 pixel block** centred on the point's pixel — used consistently for both forecasts and observations.
- Distances: haversine, Earth radius 6371 km.

**Units:** rain rate mm/h · speed km/h · CAPE J/kg · temperature °C · probabilities 0–1 · LRI (lightning risk index) 0–100.

## 8. Constants — single source of truth (`contracts/constants.json`, built in Phase 0) [Proposed]

```json
{
  "contract_version": "1.0",
  "grid_res_deg": 0.1, "issue_step_min": 30,
  "leads_min": [30, 60, 90, 120, 150, 180],
  "ensemble_members": 20, "seed": 42,
  "event_thr_mm_h": 5.0,
  "neighbourhood": "3x3",
  "cape_norm_max": 2500,
  "lri_formula": "100 * clip(0.7*p_final + 0.3*clip(cape/2500,0,1), 0, 1)",
  "severity_bins": { "low": [0, 30], "moderate": [30, 60], "strong": [60, 80], "severe": [80, 100] },
  "alert_lri": 60, "emergency_lri": 80, "alert_window_min": 60,
  "all_clear_lri": 30, "all_clear_consecutive_issues": 2,
  "eta_p_final": 0.5
}
```
`event_thr_mm_h` may be changed **once**, by Person A+B together, before any replay/test event is inspected — log it in `contracts/CHANGELOG.md`. Severity colours: low = grey-green, moderate = yellow, strong = orange, severe = red; colour is never the *only* signal.

## 9. Data contracts v1.0 (frozen — full detail; A and B implement, C consumes)

Root is either `web/public/data-mock/` (fake, built by C in Phase C0) or `web/public/data/` (real, built by B's export step). Both must pass `python contracts/validate.py <root>`. Every file carries `"contract_version":"1.0"`; mock files also carry `"mock": true`.

### 9.1 `events.json`
```json
{ "contract_version": "1.0", "mock": false,
  "events": [{
    "id": "evt_01", "name": "string", "is_no_storm": false,
    "bbox": [w, s, e, n],
    "grid": { "res_deg": 0.1, "nx": 100, "ny": 100 },
    "first_issue": "ISO-Z", "last_issue": "ISO-Z",
    "issue_step_min": 30, "leads_min": [30,60,90,120,150,180],
    "event_thr_mm_h": 5.0,
    "reference": { "label": "string", "url": "https://...", "verified": true },
    "points": [{ "id": "p1", "name": "string", "lat": 0.0, "lon": 0.0 }]
  }] }
```
`reference.verified` must be `true`, set only after a human opened the link.

### 9.2 `events/{id}/manifest.json`
```json
{ "contract_version": "1.0", "event_id": "evt_01",
  "image_coordinates": [[w,n],[e,n],[e,s],[w,s]],
  "image_projection": "web-mercator-resampled",
  "colormap": "../../colormap.json",
  "obs": { "<valid_start ISO-Z>": "obs/20250520T0930Z.png" },
  "forecast": { "<issue ISO-Z>": { "60": { "mean": "fc/20250520T0900Z_L060_mean.png",
                                          "prob": "fc/20250520T0900Z_L060_prob.png" } } } }
```
`image_coordinates` follows MapLibre's image-source order (top-left, top-right, bottom-right, bottom-left), lon/lat of outer cell edges. PNGs: transparent RGBA, rows resampled to equal Web-Mercator spacing so they line up on the map. `mean` = ensemble-mean rain rate; `prob` = P(rain ≥ `event_thr_mm_h`).

### 9.3 `colormap.json`
```json
{ "contract_version": "1.0", "unit": "mm/h",
  "rain_stops": [{ "value": 0.1, "color": "#RRGGBBAA" }],
  "prob_stops": [{ "value": 0.1, "color": "#RRGGBBAA" }] }
```

### 9.4 `events/{id}/points/{pointId}.json`
```json
{ "contract_version": "1.0", "event_id": "evt_01",
  "point": { "id": "p1", "name": "string", "lat": 0.0, "lon": 0.0 },
  "summary": { "observed_onset_start": "ISO-Z | null", "alert_fired_at": "ISO-Z | null",
               "lead_time_min": 47, "outcome": "hit|miss|false_alarm|correct_null|ongoing_at_start" },
  "timeline": [{
    "issue_time": "ISO-Z", "rain_now_mm_h": 0.0,
    "leads": [{ "lead_min": 60, "valid_start": "ISO-Z",
                "p_ens": 0.0, "p_ml": 0.0, "p_final": 0.0,
                "rain_p10": 0.0, "rain_p50": 0.0, "rain_p90": 0.0,
                "lri": 0, "severity": "low|moderate|strong|severe" }],
    "eta_window_min": [30, 60],
    "motion": { "heading_deg": 65, "from_deg": 245, "speed_kmh": 38 },
    "confidence": "high|medium|low",
    "alert": { "state": "none|alert|emergency|all_clear", "severity": "string|null", "is_new": true, "reason": "string" },
    "explain": { "cape": 0, "cin": null, "t2m_c": 0, "rh_pct": 0,
                 "top_features": [{ "name": "cape", "label_en": "Air instability (CAPE)", "contribution": 0.21 }] }
  }] }
```
`eta_window_min` / `motion` / `confidence` are `null` when nothing is threatening. `lead_time_min` only set when `outcome == "hit"`.

### 9.5 `results.json`
```json
{ "contract_version": "1.0", "n_events": 0, "n_points": 0,
  "event_thr_mm_h": 5.0, "notes": "Small-sample demonstration; not an operational skill claim.",
  "by_method": { "persistence": {"POD":0,"FAR":0,"CSI":0,"brier":0},
                 "extrapolation": {}, "steps_ensemble": {}, "lightgbm": {}, "blend": {} },
  "by_lead": { "60": { "blend": {"POD":0,"FAR":0,"CSI":0,"brier":0} } },
  "alerts": { "hit": 0, "miss": 0, "false_alarm": 0, "correct_null": 0, "median_lead_time_min": 0 },
  "per_event": [{ "id": "evt_01", "hit": 0, "miss": 0, "false_alarm": 0, "median_lead_time_min": 0 }],
  "blend_weight_ens": 0.0 }
```
Placeholders only — nothing here may appear in the UI or deck except real script output.

### 9.6 `sim_scenarios.json` (owned by C — listed here since it's still a contract)
```json
{ "contract_version": "1.0", "scenarios": [{
  "id": "demo_squall", "label": "SIMULATION",
  "start_distance_km": 40, "bearing_from_deg": 245, "speed_kmh": 40,
  "cross_track_km": 0, "radius_km": 12, "peak_lri": 92,
  "watch_eta_min": 45, "emergency_eta_min": 15 }] }
```

## 10. Phase 0 — all three people together (~90 min) before splitting up

| Step | Who | Task | Done when |
|---|---|---|---|
| 0.1 | C | Create the GitHub repo, add the 4 PRD files, branches, `.gitignore`, both `.env*.example` files | `git check-ignore` passes on both real `.env` files |
| 0.2 | A+B together | Write `contracts/constants.json` and the JSON Schemas for 9.1–9.5, and `contracts/validate.py` (Python, `jsonschema` package; also checks referenced PNGs exist and share one image size per event) | validator runs cleanly on an empty root and rejects a broken sample |
| 0.3 | C | Write a mock-data generator producing a complete fake data root at `web/public/data-mock/` (2 events, 3 points each, a synthetic moving "blob" of rain as PNGs), matching the contracts exactly, `"mock": true` everywhere | `python contracts/validate.py web/public/data-mock` passes |
| 0.4 | All 3 (humans) | Choose the **region** and build an **event shortlist** by hand — see 10.1 | saved to `docs/EVENT_SHORTLIST.md` |
| 0.5 | All 3 | Final read of the contracts, then tag `contracts-v1.0` in git | all approve |

### 10.1 Event shortlist — humans do this, not the agent
Pick one region (~10°×10°) with frequent pre-monsoon thunderstorms/lightning (roughly April–June) [Proposed]. Search news / IMD / state disaster-authority reports for storm or lightning events there in the last ~2 years. For each candidate, record: date, place, source name, URL. Get 6–8 candidates before narrowing. Person A later cross-checks each against the actual rain data (their Phase A5) — an event only becomes "real" (`reference.verified: true`) once **both** the news report and the rain data agree something happened. Final set: 3–5 storm events + 1–2 verified no-storm days.

## 11. Integration milestones

| Milestone | Condition | Then |
|---|---|---|
| **M0** | Phase 0 complete, `contracts-v1.0` tagged | A, B, C work in parallel |
| **M1** | A hands B the first cleanly preprocessed event (`pipeline/data/PROCESSED/evt_01.npz` + QA plots) | B starts the nowcast engine on real data |
| **M2** | B exports the *first real event* into `web/public/data/` and it passes the validator | C switches `NEXT_PUBLIC_DATA_BASE=/data`, checks the map overlay lines up correctly, reports any mismatch to B |
| **M3** | B exports all events + final `results.json` | C finishes the results UI and screenshots |
| **M4** | Shared acceptance checklist (Section 12) passes | code freeze; record video; submit |

## 12. Final acceptance checklist (whole project, checked by all 3 together)
- [ ] `python contracts/validate.py web/public/data` passes; nothing marked `mock`
- [ ] Every real event has `reference.verified: true` with a working link
- [ ] `results.json` comes from B's evaluation script, includes a no-storm day, and shows simple baselines (persistence, plain extrapolation) next to the full model
- [ ] Map overlay alignment checked against a real, known place (all 3 sign off)
- [ ] Replay banner text is computed from data and shows misses honestly, not just wins
- [ ] Simulated storm reaches 3+ phones with correct per-device countdowns; offline fallback tested
- [ ] CAP sample XML validates and says `status=Exercise`
- [ ] Hindi toggle covers all P0 screens; safety text reviewed by a Hindi speaker
- [ ] No secrets anywhere in git history
- [ ] README lets a stranger run the web app in 5 minutes
- [ ] Demo video recorded; backup copy on all 3 laptops and one phone

## 13. Two-day timeline (3 people)

| Block | Person A — Data Engineering | Person B — ML / Nowcast | Person C — App & Product |
|---|---|---|---|
| D1 09:00–10:30 | Phase 0 (joint) | Phase 0 (joint) | Phase 0 (joint) + repo setup |
| D1 10:30–13:00 | A0 env+account, A1 config, A2 candidate scan, A3 start IMERG download | B0 env, study pySTEPS on its bundled sample data, write shared `geo.py`/`time_utils.py` with A | C0 mock data generator, C1 scaffold Next.js, C2 map |
| D1 14:00–18:00 | A4 CAPE/CIN download, A5 inspect+QA one event, A6 preprocess to `.npz` | B1 baselines (persistence, extrapolation) on mock-shaped dummy arrays | C3 Replay Theatre UI, C4 point card |
| D1 19:00–22:00 | A7 preprocess all events, write `docs/DATA_NOTES.md` | **M1** reached → B2 pySTEPS ensemble on first real event | C5 Why panel, C6 Supabase realtime + `/control` |
| D2 09:00–13:00 | Support B/C, verify event references, buffer for re-downloads | B3 predictors join, B4 LightGBM train (train-day split only), B5 blend | C7 alert modal + dedup + CAP, C8 Flash-to-Bang |
| D2 13:00–17:00 | Finalize `docs/DATA_CARD.md` sources/licences | B6 evaluate (POD/FAR/CSI/lead time), B7 export → **M2 → M3** | C9 integrate real data, i18n, PWA, deploy |
| D2 17:00–21:00 | Help with QA, screenshots | Model card, figures, help debug exports | Video, deck, README, rehearse on 3 phones |

**Decision points (protect the deadline over the wishlist):**
- **D1 22:00:** if M1 hasn't happened → C keeps building on mock data; A/B get another 2 hours before the plan is re-cut.
- **D2 09:00:** if pySTEPS ensemble isn't reliable yet → B ships deterministic extrapolation as the headline, ensemble becomes a stretch goal.
- **D2 13:00:** if LightGBM doesn't clearly beat the plain extrapolation baseline on held-out days → report that honestly in `results.json`; the ensemble stays the headline model, ML is presented as "tested, marginal gain" not hidden.
- **D2 17:00:** code freeze, no exceptions.
