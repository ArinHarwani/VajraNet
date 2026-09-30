"""
pipeline/tests/test_geo_time.py - Unit tests for shared geo and time utilities.
Compliant with PRD_A Phase A6 Task 1 & 2.
"""
from datetime import datetime, timezone
import numpy as np
import pytest

from pipeline.shared.geo import (
    make_grid_coords,
    latlon_to_pixel,
    pixel_to_latlon,
    haversine_distance_km,
    calculate_bearing_deg,
    extract_3x3_neighborhood_max
)
from pipeline.shared.time_utils import (
    parse_isoz,
    format_isoz,
    imerg_filename_to_start_utc,
    calculate_issue_time,
    calculate_verification_frame_start,
    utc_to_ist,
    format_ist_display
)


def test_geo_grid_coords():
    bbox = [85.5, 21.0, 90.5, 26.0]
    lats, lons = make_grid_coords(bbox=bbox, res_deg=0.1)
    
    # Check lengths: (26.0 - 21.0)/0.1 = 50, (90.5 - 85.5)/0.1 = 50
    assert len(lats) == 50
    assert len(lons) == 50
    
    # Convention: lat descending (Row 0 = North), lon ascending (Col 0 = West)
    assert lats[0] > lats[-1], "Latitude must be descending"
    assert lons[0] < lons[-1], "Longitude must be ascending"
    assert round(lats[0], 2) == 25.95
    assert round(lats[-1], 2) == 21.05
    assert round(lons[0], 2) == 85.55
    assert round(lons[-1], 2) == 90.45


def test_latlon_to_pixel_and_back():
    bbox = [85.5, 21.0, 90.5, 26.0]
    # Center of Kolkata: (22.5726, 88.3639)
    row, col = latlon_to_pixel(22.5726, 88.3639, bbox=bbox, res_deg=0.1)
    assert 0 <= row < 50
    assert 0 <= col < 50
    
    # Check pixel_to_latlon round trip within 0.1 deg
    lat_c, lon_c = pixel_to_latlon(row, col, bbox=bbox, res_deg=0.1)
    assert abs(lat_c - 22.5726) < 0.1
    assert abs(lon_c - 88.3639) < 0.1


def test_haversine_distance():
    # Distance between Kolkata (22.5726, 88.3639) and Burdwan (23.2324, 87.8615)
    # Known real-world distance: ~88 - 92 km
    dist = haversine_distance_km(22.5726, 88.3639, 23.2324, 87.8615)
    assert 85.0 < dist < 95.0, f"Distance {dist} km outside expected ~90 km"


def test_calculate_bearing():
    # Kolkata to a point directly north of it
    bearing_north = calculate_bearing_deg(22.5, 88.0, 23.5, 88.0)
    assert abs(bearing_north - 0.0) < 1.0 or abs(bearing_north - 360.0) < 1.0

    # Kolkata to a point directly east of it
    bearing_east = calculate_bearing_deg(22.5, 88.0, 22.5, 89.0)
    assert abs(bearing_east - 90.0) < 1.0


def test_neighborhood_3x3():
    grid = np.zeros((10, 10))
    grid[3, 3] = 18.5  # peak in neighborhood
    max_val = extract_3x3_neighborhood_max(grid, 2, 2)
    assert max_val == 18.5
    # Outside neighborhood
    assert extract_3x3_neighborhood_max(grid, 0, 0) == 0.0


def test_time_conventions():
    # 1. Parse and format ISO-Z
    ts = "2024-05-07T12:00:00Z"
    dt = parse_isoz(ts)
    assert dt.tzinfo == timezone.utc
    assert format_isoz(dt) == ts

    # 2. IMERG filename parsing
    fname = "3B-HHR-E.MS.MRG.3IMERG.20240507-S140000-E142959.0840.V07B.HDF5"
    start_utc = imerg_filename_to_start_utc(fname)
    assert start_utc == datetime(2024, 5, 7, 14, 0, 0, tzinfo=timezone.utc)

    # 3. Issue time computation: last frame start (14:00) + 30 min = 14:30 UTC
    issue_t = calculate_issue_time(start_utc)
    assert issue_t == datetime(2024, 5, 7, 14, 30, 0, tzinfo=timezone.utc)

    # 4. Valid start for lead 60 min: issue_t + 60 min - 30 min = 15:00 UTC
    verif_start = calculate_verification_frame_start(issue_t, lead_minutes=60)
    assert verif_start == datetime(2024, 5, 7, 15, 0, 0, tzinfo=timezone.utc)

    # 5. IST conversion: 14:00 UTC = 19:30 IST
    ist_str = format_ist_display(start_utc)
    assert ist_str == "19:30 IST"
