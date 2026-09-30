#!/usr/bin/env python3
"""
pipeline/raw_ingest/02_download_openmeteo.py - Ingest atmospheric instability data from Open-Meteo
Compliant with PRD_00 §7 and PRD_A Phase A3.
"""

import os
import json
import requests
from pathlib import Path
from config import EVENTS

API_URL = "https://archive-api.open-meteo.com/v1/archive"

HOURLY_VARS = [
    "temperature_2m",
    "relative_humidity_2m",
    "precipitation",
    "rain",
    "wind_speed_10m",
    "wind_direction_10m",
    "wind_speed_700hPa",
    "wind_direction_700hPa",
    "cape"
]

def fetch_event_openmeteo(event: dict, out_dir: Path):
    event_id = event["id"]
    date_str = event["date"]
    west, south, east, north = event["bbox"]

    # Sample central coordinate for point diagnostic or grid
    center_lat = (south + north) / 2.0
    center_lon = (west + east) / 2.0

    params = {
        "latitude": center_lat,
        "longitude": center_lon,
        "start_date": date_str,
        "end_date": date_str,
        "hourly": ",".join(HOURLY_VARS),
        "timezone": "UTC"
    }

    print(f"Fetching Open-Meteo data for {event_id} ({date_str}) at ({center_lat}, {center_lon})...")
    resp = requests.get(API_URL, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    out_file = out_dir / f"{event_id}.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"[OK] Saved {out_file} ({len(data.get('hourly', {}).get('time', []))} hourly records)")

def main():
    raw_dir = Path(__file__).parent.parent / "data" / "RAW" / "openmeteo"
    raw_dir.mkdir(parents=True, exist_ok=True)

    for ev in EVENTS:
        try:
            fetch_event_openmeteo(ev, raw_dir)
        except Exception as e:
            print(f"[ERROR] Failed for {ev['id']}: {e}")

if __name__ == "__main__":
    main()
