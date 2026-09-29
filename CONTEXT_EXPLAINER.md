# VajraNet — What we're building (plain-English context)

Share this file with a teammate, a mentor, or another AI to get them up to speed in 2 minutes.

## The problem
Official thunderstorm/lightning warnings (IMD) are broad — they cover a whole district. A person can't tell "is it about to hit *my exact spot*, and when?"

## The idea
A phone web-app called **VajraNet**. You open it, it knows your location, and it tells you:
- Is a thunderstorm/lightning threat coming in the next 0–3 hours?
- How many minutes until it arrives?
- Which direction is it coming from?
- What should you do right now (safety steps)?

## What makes it more than "just a weather app"
Most teams at this hackathon will wrap a free weather API and call it done. We're doing three things they likely won't:

1. **A real prediction engine, not just an API call.** We take a real rain map, use a technique called optical-flow extrapolation (a tool called **pySTEPS**) to predict how it will move over the next 3 hours, and add a small machine-learning model (**LightGBM**) that predicts whether the storm will grow or fade, using air-instability data (CAPE).
2. **We prove it on real past storms.** We download real rain data from storms that actually happened, run our engine on it "as if it were live," and compare our prediction to what really happened. This gives us honest numbers: how often we were right, how often we were wrong, and how many minutes of warning we gave.
3. **A live demo moment.** Since we can't wait for a real storm during judging, we simulate one moving toward the judges. Every judge's phone shows a live countdown and a red emergency alert — clearly labelled "SIMULATION" so it's not misleading.

## Real data vs fake data — both are used, on purpose
| Part of the demo | Data | Why |
|---|---|---|
| "Would this have warned people?" proof | **Real** past storm data (NASA satellite rain data) | Proves the engine actually works |
| Judges' phones lighting up | **Simulated**, clearly labelled | Can't wait for a real storm live |

## The three jobs (3 people)
- **Person A — Data:** downloads and cleans the real storm data.
- **Person B — ML:** builds the prediction engine and machine-learning model, tests it against reality, produces the results.
- **Person C — App:** builds the actual phone app, the live demo, the alerts, and puts the submission together (video, slides, deploy).

A feeds B, B feeds C — but C doesn't wait around: C builds the whole app on fake placeholder data first, then swaps in the real thing once it's ready.

## Tech stack
Next.js (web app) + Supabase (sends the live alert to everyone's phone at once) + Python (data + AI) + pySTEPS + LightGBM. Hosted free on Vercel.

## What's real vs. what's honest limitation
- The AI-predicted risk is a **risk score**, not a guaranteed forecast — we say this clearly in the app.
- It's built on free public data, not full weather-radar quality — we say this too.
- In-app alerts only reach people while the app is open (like most hackathon prototypes); we mention this as a known limitation and a future improvement (push notifications).

## Where the data comes from
- **Rain maps:** NASA's GPM IMERG satellite data (free, needs a free NASA account).
- **Air-instability data (CAPE):** Open-Meteo's free historical weather API (no account needed).

## Status / next step
Check `docs/EVENT_SHORTLIST.md` for which real storm dates we're using, and `PRD_00_SHARED.md` for the full technical plan if you want the detailed version.
