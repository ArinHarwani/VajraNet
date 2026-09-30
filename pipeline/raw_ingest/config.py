"""
pipeline/raw_ingest/config.py - Data ingestion configuration for Person A
Compliant with PRD_00 §7 and PRD_A
"""

# Default target bounding box: Gangetic West Bengal & Odisha Convective Corridor
# [west, south, east, north] outer cell edges
DEFAULT_BBOX = [85.5, 21.0, 90.5, 26.0]
GRID_RES_DEG = 0.1

# Candidate events for ingestion
EVENTS = [
    {
        "id": "evt_01",
        "name": "Pre-Monsoon Kalbaishakhi Squall",
        "date": "2024-05-06",
        "start_utc": "2024-05-06T08:00:00Z",
        "end_utc": "2024-05-06T16:00:00Z",
        "bbox": DEFAULT_BBOX,
        "is_no_storm": False,
    },
    {
        "id": "evt_02_null",
        "name": "Gangetic Bengal Clear Sky Day (Null Control)",
        "date": "2024-05-12",
        "start_utc": "2024-05-12T08:00:00Z",
        "end_utc": "2024-05-12T16:00:00Z",
        "bbox": DEFAULT_BBOX,
        "is_no_storm": True,
    }
]
