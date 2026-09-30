# 🌩️ VajraNet — Event Candidate Shortlist

> **Owner:** All 3 Team Members & Person A (Data Engineering)  
> **Region:** Gangetic West Bengal / Odisha Convective Corridor (approx 21.0°N – 26.0°N, 85.5°E – 90.5°E)  
> **Time Period:** Pre-Monsoon Season (April – June 2024 / 2025)

---

## Candidate Storm Events (Target: 3–5 Verified Storms + 1–2 Verified Null Days)

| Event ID | Date (UTC) | Location | Description & Impact | Ground Truth Source Link | Verified? |
|---|---|---|---|---|---|
| `evt_01` | 2024-05-07 | Kolkata & South Bengal | Bengal Heatwave Break Convective Thunderstorm & Lightning | [LiveMint Report](https://www.livemint.com/news/india/heatwave-to-abate-in-kolkata-as-met-issues-thunderstorm-warning-over-south-bengal-details-here-11714973599982.html) | ✅ Verified (IMERG 41.25 mm/h, 48/48 frames) |
| `evt_02` | 2024-05-09 | South Bengal | South Bengal Severe Convective Squall Line | [Times of India](https://timesofindia.indiatimes.com/city/kolkata/squall-hailstorm-likely-in-south-bengal-districts-today/articleshow/109980838.cms) | ⏳ Candidate |
| `evt_03` | 2024-05-10 | Kolkata & Gangetic Delta | Kolkata & Gangetic Delta Severe Hailstorm & Heavy Rain | [Times of India](https://timesofindia.indiatimes.com/city/kolkata/city-shivers-in-sudden-hailstorm-mercury-plummets/articleshow/110029314.cms) | ⏳ Candidate |
| `evt_04` | 2024-05-26 | Gangetic Bengal & Coast | Cyclone Remal Convective Outer Rainbands Landfall | [Times of India](https://timesofindia.indiatimes.com/city/kolkata/cyclone-remal-landfall-in-bengal-heavy-rain-lashes-kolkata/articleshow/110452331.cms) | ⏳ Candidate |
| `evt_05_null` | 2024-04-20 | Gangetic Bengal | Extreme Heatwave (Zero Rain Null Control) | [Times of India](https://timesofindia.indiatimes.com/city/kolkata/kolkata-records-highest-april-temp-in-50-years/articleshow/109462811.cms) | ⏳ Candidate Null Control |
| `evt_06_null` | 2024-05-01 | South Bengal | Severe Dry Heatwave >42°C (Zero Rain Null Control) | [Times of India](https://timesofindia.indiatimes.com/city/kolkata/bengal-heatwave-temperature-crosses-42-degrees/articleshow/109749122.cms) | ⏳ Candidate Null Control |

---

## Verification Criteria (PRD_00 §10.1)
An event only transitions to `reference.verified: true` when:
1. A human opens and verifies the news/IMD link.
2. Person A downloads the NASA IMERG precipitation frames and confirms rain rate $\ge 5.0\text{ mm/h}$ during that time window.
