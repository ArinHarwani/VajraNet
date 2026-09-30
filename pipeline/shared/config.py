"""
pipeline/shared/config.py - Region, Bounding Box, and Candidate Dates Configuration
Compliant with PRD_00 §7 and PRD_A Phase A2.
"""

# Region: Gangetic West Bengal & Odisha Convective Corridor
# [west, south, east, north] outer cell edges (PRD_00 §7)
BBOX = [85.5, 21.0, 90.5, 26.0]

GRID_RES_DEG = 0.1
TIMEZONE_LOCAL = "Asia/Kolkata"

# Verified candidate events from docs/EVENT_SHORTLIST.md
CANDIDATE_DATES = [
    {
        "date": "2024-05-07",
        "label": "Bengal Heatwave Break Convective Thunderstorm & Lightning",
        "source_url": "https://www.livemint.com/news/india/heatwave-to-abate-in-kolkata-as-met-issues-thunderstorm-warning-over-south-bengal-details-here-11714973599982.html",
        "expected_no_storm": False
    },
    {
        "date": "2024-05-09",
        "label": "South Bengal Severe Convective Squall Line",
        "source_url": "https://timesofindia.indiatimes.com/city/kolkata/squall-hailstorm-likely-in-south-bengal-districts-today/articleshow/109980838.cms",
        "expected_no_storm": False
    },
    {
        "date": "2024-05-10",
        "label": "Kolkata & Gangetic Delta Severe Hailstorm & Heavy Rain",
        "source_url": "https://timesofindia.indiatimes.com/city/kolkata/city-shivers-in-sudden-hailstorm-mercury-plummets/articleshow/110029314.cms",
        "expected_no_storm": False
    },
    {
        "date": "2024-05-26",
        "label": "Cyclone Remal Convective Outer Rainbands Landfall",
        "source_url": "https://timesofindia.indiatimes.com/city/kolkata/cyclone-remal-landfall-in-bengal-heavy-rain-lashes-kolkata/articleshow/110452331.cms",
        "expected_no_storm": False
    },
    {
        "date": "2024-04-20",
        "label": "Gangetic Bengal Extreme Heatwave (Zero Rain Null Control)",
        "source_url": "https://timesofindia.indiatimes.com/city/kolkata/kolkata-records-highest-april-temp-in-50-years/articleshow/109462811.cms",
        "expected_no_storm": True
    },
    {
        "date": "2024-05-01",
        "label": "South Bengal Severe Dry Heatwave (Zero Rain Null Control)",
        "source_url": "https://timesofindia.indiatimes.com/city/kolkata/bengal-heatwave-temperature-crosses-42-degrees/articleshow/109749122.cms",
        "expected_no_storm": True
    }
]
