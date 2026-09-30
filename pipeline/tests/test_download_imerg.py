"""
pipeline/tests/test_download_imerg.py - Verify downloaded NASA IMERG files.
Compliant with PRD_A Phase A3.
"""
from pathlib import Path
import netCDF4
import pytest

RAW_IMERG_DIR = Path("pipeline/data/RAW/imerg")


def test_imerg_download_structure():
    assert RAW_IMERG_DIR.exists(), f"{RAW_IMERG_DIR} directory must exist"
    date_dirs = [d for d in RAW_IMERG_DIR.iterdir() if d.is_dir() and not d.name.startswith(".") and d.name != "test"]
    assert len(date_dirs) >= 1, "At least one date directory must exist in raw IMERG data"

    for date_dir in date_dirs:
        files = sorted(list(date_dir.glob("*.HDF5")))
        assert len(files) > 0, f"No HDF5 files found in {date_dir}"
        
        # In a standard UTC day, there are 48 half-hour granules
        # Some rare observational gaps may have 46-48, but should be at least 44
        assert len(files) >= 44, f"Expected ~48 files for date {date_dir.name}, found {len(files)}"

        # Verify that each file is a valid, readable NetCDF4/HDF5 file
        for f in files[:5]:  # Spot check first 5
            assert f.stat().st_size > 100_000, f"File {f.name} too small ({f.stat().st_size} bytes)"
            with netCDF4.Dataset(str(f), "r") as ds:
                assert "Grid" in ds.groups, f"File {f.name} missing 'Grid' group"
                grid = ds.groups["Grid"]
                assert "precipitation" in grid.variables, f"File {f.name} missing precipitation variable"

        # Also spot check the last file
        last_file = files[-1]
        with netCDF4.Dataset(str(last_file), "r") as ds:
            assert "Grid" in ds.groups, f"File {last_file.name} missing 'Grid' group"
            grid = ds.groups["Grid"]
            assert "precipitation" in grid.variables
