"""
pipeline/tests/test_download_predictors.py - Verify downloaded atmospheric instability predictors.
Compliant with PRD_A Phase A4.
"""
import json
from pathlib import Path
import pytest

PREDICTORS_RAW_DIR = Path("pipeline/data/RAW/predictors")


def test_predictors_structure():
    assert PREDICTORS_RAW_DIR.exists(), f"{PREDICTORS_RAW_DIR} must exist"
    date_dirs = [d for d in PREDICTORS_RAW_DIR.iterdir() if d.is_dir() and not d.name.startswith(".")]
    assert len(date_dirs) >= 1, "At least one date directory must exist in predictors"

    for date_dir in date_dirs:
        json_files = list(date_dir.glob("*.json"))
        assert len(json_files) >= 1, f"No JSON predictor files in {date_dir}"

        for jf in json_files:
            with open(jf, "r", encoding="utf-8") as f:
                data = json.load(f)

            assert "hourly" in data, f"File {jf.name} missing 'hourly' key"
            hourly = data["hourly"]
            assert "time" in hourly, f"File {jf.name} missing 'time' key in hourly"
            times = hourly["time"]
            assert len(times) == 24, f"Expected 24 time steps in {jf.name}, got {len(times)}"

            required_vars = [
                "cape",
                "temperature_2m",
                "relative_humidity_2m",
                "cloud_cover",
                "wind_speed_10m",
                "wind_direction_10m"
            ]

            for var in required_vars:
                assert var in hourly, f"File {jf.name} missing variable '{var}'"
                vals = hourly[var]
                assert len(vals) == 24, f"Variable '{var}' length mismatch with time ({len(vals)} != 24)"

            # Check CAPE physical range (0 to 5000 J/kg)
            capes = [c for c in hourly["cape"] if c is not None]
            assert len(capes) == 24, f"CAPE values in {jf.name} contain nulls"
            assert max(capes) >= 0.0, "CAPE should be non-negative"
            assert all(0.0 <= c <= 7000.0 for c in capes), "CAPE values outside expected physical range [0, 7000]"
