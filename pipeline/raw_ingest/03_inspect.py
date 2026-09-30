"""
pipeline/raw_ingest/03_inspect.py - Inspect and QA raw IMERG precipitation data.
Compliant with PRD_00 §7 and PRD_A Phase A5.
"""
import os
import sys
import argparse
from pathlib import Path
import numpy as np
import netCDF4
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from pipeline.shared.config import BBOX, CANDIDATE_DATES

RAW_IMERG_DIR = Path("pipeline/data/RAW/imerg")
QA_OUT_DIR = Path("docs/qa")
QA_OUT_DIR.mkdir(parents=True, exist_ok=True)


def extract_bbox_slice(file_path: Path, bbox=BBOX):
    """
    Extract precipitation array cropped over BBOX [west, south, east, north].
    Returns (rain_cropped, lats_cropped, lons_cropped, timestamp_str)
    """
    west, south, east, north = bbox
    with netCDF4.Dataset(str(file_path), "r") as ds:
        grid = ds.groups["Grid"]
        lats = grid.variables["lat"][:]
        lons = grid.variables["lon"][:]
        # IMERG precipitation shape: (time, lon, lat)
        precip = grid.variables["precipitation"][:]

        lat_mask = (lats >= south) & (lats <= north)
        lon_mask = (lons >= west) & (lons <= east)

        lats_sub = lats[lat_mask]
        lons_sub = lons[lon_mask]

        # Crop (lon, lat) slice
        p_sub = precip[0, lon_mask, :][:, lat_mask]

        # Transpose to (lat, lon) so rows=lat, cols=lon
        p_lat_lon = p_sub.T

        # Reverse latitude axis so row 0 is North (descending lat)
        p_standard = p_lat_lon[::-1, :]
        lats_standard = lats_sub[::-1]

        # Extract time
        time_var = grid.variables.get("time")
        time_str = file_path.stem.split(".")[4] if len(file_path.stem.split(".")) > 4 else file_path.stem

    return p_standard, lats_standard, lons_sub, time_str


def inspect_date(date_str: str):
    """Inspect all IMERG frames for a date, generate 6-frame QA plot, and report stats."""
    date_dir = RAW_IMERG_DIR / date_str
    if not date_dir.exists():
        print(f"[ERROR] Directory {date_dir} does not exist.")
        return False

    files = sorted(list(date_dir.glob("*.HDF5")))
    total_files = len(files)
    print(f"\n==================================================")
    print(f"[QA INSPECT] NASA IMERG Quality Audit: {date_str}")
    print(f"==================================================")
    print(f"Found {total_files} granules (expected: 48)")

    frames = []
    timestamps = []
    lats_ref = None
    lons_ref = None
    read_success = 0

    for f in files:
        try:
            p_arr, lats, lons, t_str = extract_bbox_slice(f)
            frames.append(p_arr)
            timestamps.append(t_str)
            if lats_ref is None:
                lats_ref = lats
                lons_ref = lons
            read_success += 1
        except Exception as e:
            print(f"   [WARN] Failed to read {f.name}: {e}")

    if not frames:
        print(f"[FAIL] No readable frames for {date_str}.")
        return False

    stacked = np.stack(frames, axis=0)  # (N, ny, nx)
    nan_count = np.isnan(stacked).sum()
    total_pixels = stacked.size
    nan_pct = (nan_count / total_pixels) * 100.0

    valid_pixels = stacked[~np.isnan(stacked)]
    min_val = float(np.min(valid_pixels)) if len(valid_pixels) > 0 else 0.0
    max_val = float(np.max(valid_pixels)) if len(valid_pixels) > 0 else 0.0
    mean_val = float(np.mean(valid_pixels)) if len(valid_pixels) > 0 else 0.0

    is_suspect = False
    reasons = []
    if nan_pct > 10.0:
        is_suspect = True
        reasons.append(f">10% NaNs ({nan_pct:.1f}%)")
    if read_success < 40:
        is_suspect = True
        reasons.append(f"fewer than 40 readable frames ({read_success}/48)")
    if max_val == 0.0:
        is_suspect = True
        reasons.append("max rain rate is 0.0 mm/h everywhere")

    status_tag = f"SUSPECT ({', '.join(reasons)})" if is_suspect else "PASS (Clean Convective Signal)"

    print(f"\n📊 Quality Statistics for {date_str}:")
    print(f"   - Readable Frames:   {read_success} / 48")
    print(f"   - Missing/Corrupt:   {48 - read_success}")
    print(f"   - NaN Pixel Ratio:   {nan_pct:.2f}%")
    print(f"   - Min Rain Rate:     {min_val:.2f} mm/h")
    print(f"   - Max Rain Rate:     {max_val:.2f} mm/h")
    print(f"   - Mean Rain Rate:    {mean_val:.4f} mm/h")
    print(f"   - QA Verdict:        {status_tag}")

    # Generate 6-frame grid plot
    # Select 6 evenly spaced frame indices across the sequence
    indices = np.linspace(0, len(frames) - 1, 6, dtype=int)
    fig, axes = plt.subplots(2, 3, figsize=(15, 9))
    fig.suptitle(f"NASA GPM IMERG Half-Hourly Rain Rate (mm/h) — {date_str}\nBBOX: {BBOX} | Verdict: {status_tag}", fontsize=14, fontweight="bold")

    vmax = max(15.0, min(50.0, max_val))
    cmap = "Blues"

    for ax, idx in zip(axes.flat, indices):
        frame_data = frames[idx]
        t_label = timestamps[idx]
        im = ax.imshow(
            frame_data,
            origin="upper",
            extent=[lons_ref[0], lons_ref[-1], lats_ref[-1], lats_ref[0]],
            cmap=cmap,
            vmin=0.0,
            vmax=vmax
        )
        # Mark Kolkata (22.57, 88.36)
        ax.plot(88.36, 22.57, "r*", markersize=8, label="Kolkata")
        ax.set_title(f"Frame #{idx+1:02d} ({t_label})", fontsize=11)
        ax.set_xlabel("Longitude (°E)", fontsize=9)
        ax.set_ylabel("Latitude (°N)", fontsize=9)
        ax.grid(color="gray", linestyle=":", alpha=0.4)

    # Colorbar on side
    cbar_ax = fig.add_axes([0.92, 0.15, 0.02, 0.7])
    cbar = fig.colorbar(im, cax=cbar_ax)
    cbar.set_label("Precipitation Rate (mm/h)", fontsize=11)

    plot_path = QA_OUT_DIR / f"{date_str}_frames.png"
    plt.savefig(plot_path, dpi=120, bbox_inches="tight")
    plt.close()

    print(f"\n📸 QA Map Grid saved to: {plot_path}")
    return not is_suspect


def main():
    parser = argparse.ArgumentParser(description="Inspect and QA raw IMERG precipitation data.")
    parser.add_argument("--date", type=str, help="Specific date to inspect (YYYY-MM-DD)")
    args = parser.parse_args()

    target_date = args.date or CANDIDATE_DATES[0]["date"]
    inspect_date(target_date)


if __name__ == "__main__":
    main()
