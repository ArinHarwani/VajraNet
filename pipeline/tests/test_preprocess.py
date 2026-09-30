"""
pipeline/tests/test_preprocess.py - Verify preprocessed .npz arrays and conventions.
Compliant with PRD_A Phase A6 Task 4.
"""
import json
from pathlib import Path
from datetime import datetime, timezone
import numpy as np
import pytest

PROCESSED_DIR = Path("pipeline/data/PROCESSED")


def test_processed_event_files():
    assert PROCESSED_DIR.exists(), f"{PROCESSED_DIR} must exist"
    npz_files = list(PROCESSED_DIR.glob("*.npz"))
    assert len(npz_files) >= 1, "At least one preprocessed .npz file must exist"

    for npz_path in npz_files:
        with np.load(npz_path, allow_pickle=True) as data:
            # Check required keys
            expected_keys = ["rain", "times", "lat", "lon", "cape", "t2m", "rh", "cloud", "meta"]
            for key in expected_keys:
                assert key in data, f"File {npz_path.name} missing key '{key}'"

            rain = data["rain"]
            times = data["times"]
            lats = data["lat"]
            lons = data["lon"]
            cape = data["cape"]
            t2m = data["t2m"]
            rh = data["rh"]
            cloud = data["cloud"]
            meta = json.loads(str(data["meta"]))

            n_times, ny, nx = rain.shape
            assert n_times >= 44, f"Expected ~48 time frames, found {n_times}"
            assert ny == 50, f"Expected 50 lat cells, found {ny}"
            assert nx == 50, f"Expected 50 lon cells, found {nx}"

            # Shape alignments
            assert cape.shape == (n_times, ny, nx)
            assert t2m.shape == (n_times, ny, nx)
            assert rh.shape == (n_times, ny, nx)
            assert cloud.shape == (n_times, ny, nx)
            assert lats.shape == (ny,)
            assert lons.shape == (nx,)
            assert len(times) == n_times

            # PRD_00 §7 Convention checks:
            # Row 0 = North, lat descending
            assert lats[0] > lats[-1], "Latitude must be strictly descending (Row 0 = North)"
            assert np.all(np.diff(lats) < 0), "Latitude must be monotonically decreasing"

            # Col 0 = West, lon ascending
            assert lons[0] < lons[-1], "Longitude must be strictly ascending (Col 0 = West)"
            assert np.all(np.diff(lons) > 0), "Longitude must be monotonically increasing"

            # No NaNs without documentation in meta
            assert not np.isnan(rain).any(), "rain array contains undocumented NaNs"
            assert not np.isnan(cape).any(), "cape array contains undocumented NaNs"
            assert not np.isnan(t2m).any(), "t2m array contains undocumented NaNs"

            # Rain values non-negative
            assert np.min(rain) >= 0.0, "rain array contains negative values"

            # Check timestamps strictly increasing and ~30 minutes apart
            dt_list = [datetime.fromisoformat(str(t).replace("Z", "+00:00")) for t in times]
            for i in range(len(dt_list) - 1):
                delta_sec = (dt_list[i + 1] - dt_list[i]).total_seconds()
                assert delta_sec == 1800, f"Time step between {times[i]} and {times[i+1]} is not 30 minutes ({delta_sec}s)"
