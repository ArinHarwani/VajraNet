"""
pipeline/raw_ingest/02_download_predictors.py - Download atmospheric instability predictors from Open-Meteo Historical API.
Compliant with PRD_00 §7 and PRD_A Phase A4.
"""
import os
import sys
import time
import json
import argparse
from pathlib import Path
import requests

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from pipeline.shared.config import BBOX, CANDIDATE_DATES

PREDICTORS_RAW_DIR = Path("pipeline/data/RAW/predictors")
OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

# Primary demo points + anchor points covering BBOX [85.5, 21.0, 90.5, 26.0]
DEMO_POINTS = [
    {"name": "Kolkata", "lat": 22.57, "lon": 88.36},
    {"name": "Burdwan", "lat": 23.23, "lon": 87.86},
    {"name": "Kharagpur", "lat": 22.33, "lon": 87.32}
]


def generate_grid_points():
    """Generate anchor grid points (every 1.0 deg) + key demo stations."""
    points = []
    # Add key demo stations first
    for dp in DEMO_POINTS:
        points.append((dp["lat"], dp["lon"]))
    
    # 1.0 degree anchor grid across BBOX
    lats = [21.5, 22.5, 23.5, 24.5, 25.5]
    lons = [86.0, 87.0, 88.0, 89.0, 90.0]
    for lat in lats:
        for lon in lons:
            coord = (round(lat, 2), round(lon, 2))
            if coord not in points:
                points.append(coord)
    return points


# Shared session with retries
session = requests.Session()
from urllib3.util import Retry
from requests.adapters import HTTPAdapter

retries = Retry(
    total=5,
    backoff_factor=1.0,
    status_forcelist=[429, 500, 502, 503, 504],
    raise_on_status=False
)
adapter = HTTPAdapter(max_retries=retries)
session.mount("https://", adapter)
session.mount("http://", adapter)


def download_predictor_for_point(date_str: str, lat: float, lon: float, force: bool = False):
    """
    Download hourly CAPE, CIN, T2m, RH, cloud cover, and winds for a single point and date.
    Uses models=gfs_seamless which provides complete, verified non-null CAPE reanalysis.
    """
    out_dir = PREDICTORS_RAW_DIR / date_str
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"{lat:.2f}_{lon:.2f}.json"

    if not force and out_file.exists() and out_file.stat().st_size > 0:
        return out_file, False

    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": date_str,
        "end_date": date_str,
        "hourly": "cape,convective_inhibition,temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,wind_direction_10m",
        "models": "gfs_seamless"
    }

    for attempt in range(4):
        try:
            resp = session.get(OPEN_METEO_ARCHIVE_URL, params=params, timeout=25)
            if resp.status_code == 429:
                time.sleep(3.0 * (attempt + 1))
                continue
            resp.raise_for_status()
            data = resp.json()
            break
        except (requests.exceptions.RequestException, ConnectionResetError) as e:
            if attempt == 3:
                raise
            time.sleep(2.0 * (attempt + 1))

    # Basic sanity check
    assert "hourly" in data, f"Response missing 'hourly' key for {lat}, {lon}"
    assert len(data["hourly"].get("time", [])) == 24, f"Expected 24 hourly steps for {date_str}"

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    return out_file, True


def download_all_for_date(date_str: str, single_point: bool = False, force: bool = False):
    """Download predictors for a date across points."""
    print(f"\n==================================================")
    print(f"[PREDICTORS] Open-Meteo Ingest: {date_str}")
    print(f"==================================================")

    points = generate_grid_points()
    if single_point:
        points = [points[0]]  # Kolkata demo point only
        print(f"[MODE] Single-point test mode: {points[0]}")
    else:
        print(f"[MODE] Full grid mode: {len(points)} locations")

    downloaded = 0
    cached = 0
    for lat, lon in points:
        out_file, is_new = download_predictor_for_point(date_str, lat, lon, force=force)
        if is_new:
            downloaded += 1
            print(f"   [FETCH] ({lat:.2f}, {lon:.2f}) -> {out_file.name}")
            time.sleep(0.15)  # Polite API delay
        else:
            cached += 1

    print(f"[SUMMARY] Predictors for {date_str}: {downloaded} downloaded, {cached} cached.")


def main():
    parser = argparse.ArgumentParser(description="Download atmospheric instability predictors from Open-Meteo.")
    parser.add_argument("--date", type=str, help="Date to download (YYYY-MM-DD)")
    parser.add_argument("--single-point", action="store_true", help="Download only single test point (Kolkata)")
    parser.add_argument("--all", action="store_true", help="Download for all candidate dates")
    parser.add_argument("--force", action="store_true", help="Force re-download")
    args = parser.parse_args()

    target_date = args.date or CANDIDATE_DATES[0]["date"]

    if args.all:
        for item in CANDIDATE_DATES:
            download_all_for_date(item["date"], single_point=args.single_point, force=args.force)
    else:
        download_all_for_date(target_date, single_point=args.single_point, force=args.force)


if __name__ == "__main__":
    main()
