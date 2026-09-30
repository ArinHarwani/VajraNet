# 🌩️ VajraNet — Event Candidate Shortlist

> **Owner:** All 3 Team Members & Person A (Data Engineering)  
> **Region:** Gangetic West Bengal / Odisha Convective Corridor (approx 21.0°N – 26.0°N, 85.5°E – 90.5°E)  
> **Time Period:** Pre-Monsoon Season (April – June 2024 / 2025)

---

## Candidate Storm Events (Target: 3–5 Verified Storms + 1–2 Verified Null Days)

| Event ID | Date (UTC) | Location | Description & Impact | Ground Truth Source Link | Verified? |
|---|---|---|---|---|---|
| `evt_01` | 2024-05-06 | Kolkata & Hooghly, WB | Severe Kalbaishakhi squall line (gusts > 70 km/h, widespread lightning strikes). | [IMD Regional Bulletin / News Link] | ⏳ Pending IMERG Check |
| `evt_02` | 2024-05-18 | Burdwan & Bankura, WB | Convective squall with heavy localized precipitation and lightning casualties. | [State Disaster Authority Report] | ⏳ Pending IMERG Check |
| `evt_03` | 2024-04-28 | Midnapore & Kharagpur, WB | Pre-monsoon afternoon convective cell passage. | [IMD Weather Warning / News Link] | ⏳ Pending IMERG Check |
| `evt_04` | 2024-06-02 | Howrah & South 24 Parganas | Evening thunderstorm with rapid convective onset. | [Local News / IMD Radar Archive] | ⏳ Pending IMERG Check |
| `evt_05_null` | 2024-05-12 | Gangetic West Bengal | Clear sky, fair weather day with zero lightning or rain (Benchmark Control). | [IMD Daily Summary: No Rain] | ⏳ Pending IMERG Check |

---

## Verification Criteria (PRD_00 §10.1)
An event only transitions to `reference.verified: true` when:
1. A human opens and verifies the news/IMD link.
2. Person A downloads the NASA IMERG precipitation frames and confirms rain rate $\ge 5.0\text{ mm/h}$ during that time window.
