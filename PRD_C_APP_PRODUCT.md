# PRD C — App & Product (Person C)

Read `PRD_00_SHARED.md` fully first. This PRD is a strict phase list; don't skip or reorder. Every phase ends with a Phase Report and a Human check; the agent waits for approval before continuing.

**Your mission:** build the app judges actually touch — replay theatre, live simulated-storm demo, alerts, CAP export — working on mock data immediately, then swap to Person B's real data without a rebuild.

---

## Phase C0 — Repo, scaffold, mock data

**Tasks**
1. Create the GitHub repo (see PRD_00 §10, step 0.1): add the 4 PRD files, `.gitignore`, `.env.example` (root, empty — A fills), `web/.env.local.example`.
2. Scaffold Next.js (App Router, TypeScript, Tailwind) in `/web`. Add MapLibre GL JS.
3. Follow `PRD_00_SHARED.md` §6 exactly for `web/.env.local`: create it from the example, **STOP** and ask the human to fill in Supabase URL/anon key (created in C1) and a `CONTROL_PASSCODE` of their choice. Never open/print this file afterward.
4. Write a mock-data generator (`contracts/make_mock.py` or `web/scripts/make-mock.ts` — pick one language and be consistent) producing a full fake root at `web/public/data-mock/`:
   - 2 fake events, 3 points each, a synthetic Gaussian rain blob moving at a constant velocity, rendered as PNGs.
   - Match every contract field in PRD_00 §9.1–9.5 exactly, `"mock": true` everywhere, plausible but clearly synthetic alert timelines.
5. Set `NEXT_PUBLIC_DATA_BASE=/data-mock`. Build a tiny data-loader module (`lib/data.ts`) that fetches from `${NEXT_PUBLIC_DATA_BASE}/...` so switching to real data later is a one-line env change.
6. Run `python contracts/validate.py web/public/data-mock`. Fix until it passes.

**Human check:** confirm the validator passes and that a sample mock event's PNGs visibly show a moving blob when flipped through manually.

---

## Phase C1 — Supabase and Vercel projects

**Tasks**
1. **STOP.** Ask the human to create a free Supabase project and a Vercel project (both need a human to click through signup/OAuth — the agent cannot do this part). Get the Supabase URL and anon key from the human, put only the *names of the fields* in `.env.local.example`, and have the human paste the actual values into `web/.env.local` themselves (never into chat).
2. Confirm `web/.env.local` is git-ignored (`git check-ignore -v web/.env.local`).
3. Add a minimal `lib/supabase.ts` client using `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, and confirm a trivial Realtime Broadcast round-trip works (subscribe + send + receive in a scratch test page), then delete the scratch page.

**Human check:** confirm both accounts exist and the round-trip test worked.

---

## Phase C2 — Shared utils, map, layout

**Tasks**
1. Port the *display-only* parts of `time_utils.py`/`geo.py` logic into TypeScript (`lib/time.ts`, `lib/geo.ts`): UTC↔IST conversion, haversine distance, bearing/heading label formatting. Keep the source-of-truth definitions identical to PRD_00 §7 — write unit tests (`vitest`) comparing a few values against Python-computed expected outputs (ask Person A/B for 2–3 worked examples to test against).
2. Build the app shell: mobile-first (390px baseline), bottom nav or tab bar for `/`, `/replay`, `/map`, `/alerts`, `/flash`, `/settings`, and a hidden `/control`.
3. Build the MapLibre map component with an open tile/style source [Verify current terms for whichever style you pick, e.g. OpenFreeMap], user/point marker, and an image-source layer that can display one of Person B's `manifest.json` PNG frames using `image_coordinates` directly (MapLibre's `ImageSource` takes exactly that 4-corner format — no reprojection needed on the frontend).

**Human check:** open on an actual phone (or Chrome device mode) — does it feel usable at 390px width?

---

## Phase C3 — Replay Theatre (P0-1, the most important screen)

**Tasks**
1. `/replay`: event picker (from `events.json`), a time scrubber across `issue_times`, two map panels or a toggle: **observed** vs **forecast-at-selected-lead**, using `manifest.json` PNGs.
2. Show the "alert would have fired at HH:MM (IST), N min before onset" banner, computed directly from that point's `summary` block in its `points/{id}.json` — never invent or round this number, display exactly what's in the file.
3. Play/pause auto-advance through issue times.
4. Link to a simple results view driven by `results.json` (a table: method vs POD/FAR/CSI/lead time — render exactly what's there, including if the numbers are unflattering).

**Human check:** with mock data, does scrubbing feel smooth? Does the banner text read naturally?

---

## Phase C4 — Home / point card, Why panel

**Tasks**
1. `/`: main threat card for a selected point — severity colour (never the only signal, per PRD_00 §8), risk ring showing LRI, "starts in N min", motion arrow, confidence label, last-updated timestamp, the fixed disclaimer text, persona chip (Farmer/Commuter/Event organiser — persona only changes the safety-step wording, not the underlying numbers).
2. `/why` (bottom sheet): motion vector, P10/P50/P90 rain, CAPE, top SHAP features from `explain.top_features` — render the `label_en` strings provided, don't invent feature names.
3. All values read from the current `timeline` entry closest to "now" (or the scrubber position in replay mode) — build one small selector function so Home and Replay share the same read logic, no duplicated parsing.

**Human check:** toggle through a few mock timeline entries — do severity colour, risk ring, and countdown all update consistently together?

---

## Phase C5 — Realtime simulation and emergency modal (the judge-phone moment)

**Tasks**
1. `sim_scenarios.json` (PRD_00 §9.6) — author 1–2 scenarios by hand.
2. `/control` (passcode-gated via `CONTROL_PASSCODE`): buttons "Launch simulated storm [scenario]", "Stop", "Send test alert". Sends a small Supabase Realtime Broadcast message: `{type, scenario_id, t0_epoch_ms}` on channel `NEXT_PUBLIC_SIM_CHANNEL`.
3. Every other client, on receiving `sim_start`, **computes its own state locally** every second: current distance = `start_distance_km − (elapsed_hours × speed_kmh)` along `bearing_from_deg`, from either the device's real geolocation (ask permission with a plain-language reason) or a preset demo anchor if denied. Convert distance/speed to an ETA, drive LRI toward `peak_lri` as distance shrinks, and trigger states from `watch_eta_min`/`emergency_eta_min`.
4. Emergency modal: full-screen, high-contrast, large countdown, safety steps (Section 10.4 default list — write it once in `lib/safety.ts`, reuse everywhere), "I understand" button, visible **SIMULATION** ribbon always present during a sim.
5. **Offline fallback:** if Supabase Realtime is unreachable, `/control` also posts to a `BroadcastChannel` for same-device/same-browser testing, and Home shows a "Run local demo" button that starts the same scenario without any network. Test this by turning off Wi-Fi.
6. Write a Vitest test for the pure distance/ETA/state-transition function (no network involved) — feed it synthetic elapsed times and check the expected state.

**Human check:** open the app on 2–3 real phones on the same network, launch from `/control`, confirm all phones count down together and the emergency modal fires at the right ETA.

---

## Phase C6 — Alerts, dedup, CAP export, Flash-to-Bang

**Tasks**
1. `/alerts`: bell icon with unread count, list from the alert states in the current point's timeline, matching the `is_new`/`state` semantics B computed — don't re-derive dedup logic on the frontend, just render what B/the sim already decided.
2. `/api/cap/route.ts`: build CAP 1.2 XML from an alert (fields listed in the original architecture doc: `identifier`, `sender`, `sent`, `status` — always `Exercise` for anything demo/sim-derived — `msgType`, `scope`, `info.category=Met`, `event`, `urgency`, `severity`, `certainty`, `effective`, `expires`, `headline`, `description`, `instruction` = safety steps, `area.circle` = "lat,lon radius_km"). Validate the output with an online CAP validator; save one sample file into `docs/`. [Verify field requirements against the CAP 1.2 spec itself, not memory]
3. `/flash`: two big buttons ("I saw lightning" / "I heard thunder"), compute `distance_km = seconds × 0.343`, show "Take shelter now" if ≤ 10 km, start a 30-minute countdown that resets on each new thunder tap, in-memory only (no storage needed for the demo).

**Human check:** manually validate the CAP XML in an online validator; do the Flash-to-Bang numbers match hand calculation (e.g., 3s → ~1.03km)?

---

## Phase C7 — i18n, PWA, polish

**Tasks**
1. `lib/i18n.ts`: flat key map, English base, Hindi translations for all P0 screens. Generate a first draft, then **STOP** and ask the human to get a Hindi speaker to review the safety-critical strings before demo day.
2. PWA manifest + icons (192/512px, maskable), a minimal service worker (cache-first for the shell, don't cache `public/data` aggressively since it may switch from mock to real).
3. Responsive check at 390px and at a tablet width; verify color contrast on the severity colours meets basic accessibility (colour is never the only signal, per shared rules).

**Human check:** install the PWA on a phone home screen and open it from there — does it feel like a real app?

---

## Phase C8 — Integrate real data (Milestone M2/M3)

**Tasks**
1. When Person B says a real event is exported to `web/public/data`, run `python contracts/validate.py web/public/data`.
2. Switch `NEXT_PUBLIC_DATA_BASE=/data`, open `/map` and `/replay` for that event, and **check the overlay against a real landmark** in the bounding box (coastline, river, city) — this is the single most likely place for a silent bug (wrong row order, wrong corner order, wrong projection).
3. Report any misalignment to B with a screenshot before B mass-produces the remaining events.
4. Repeat for each additional event as B exports it. Keep `data-mock` in the repo and keep a `?mock=1` query param or a settings toggle that switches back to it, as a safety net for the live demo if real data breaks last-minute.

**Human check:** side-by-side screenshot of the overlay against a real map (e.g., Google Maps of the same bbox) — do the storm cells sit over believable locations?

---

## Phase C9 — Deploy, screenshots, README, video, deck

**Tasks**
1. Deploy to Vercel, set the same env vars there (never commit them), confirm the live URL works on mobile data (not just Wi-Fi).
2. Generate a QR code (Python `qrcode` or any offline tool) pointing at the live URL for the judge-phone moment.
3. Take 6–8 screenshots (Chrome device mode, 390×844): Home, Replay, Map, Why panel, Emergency modal, Flash-to-Bang, Hindi view, CAP output.
4. Write `README.md`: what it is, honest limitations paragraph (pull from `MODEL_CARD.md`/`DATA_NOTES.md`, don't restate more confidently than B/A wrote), how to run `/web` locally in under 5 minutes, how to run the pipeline (link to A/B docs).
5. Assemble the deck using the official SIH template: problem, prior art (mention IMD/IITM's Damini app, [Verify current status]), architecture diagram (from PRD_00 §… reuse the Mermaid diagram concept), novelty points, the real `results.json` table, limitations, roadmap.
6. Record the ~3-minute demo video following the script: problem → Replay Theatre → Why panel → judge-phone simulated storm → Flash-to-Bang → results table/CAP/limitations. Record a backup copy even if you plan to do it live.
7. Rehearse the full demo twice on real phones before submission.

**Human check:** run through the full `PRD_00_SHARED.md` §12 acceptance checklist as a group with A and B before submitting.
