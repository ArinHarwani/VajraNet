"""
pipeline/raw_ingest/04_preprocess.py - Preprocess raw IMERG and atmospheric predictors into aligned .npz arrays.
Compliant with PRD_00 §7, §8 and PRD_A Phase A6.
"""
import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime, timezone
import numpy as np
import netCDF4
from scipy.interpolate import NearestNDInterpolator
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from pipeline.shared.config import BBOX, GRID_RES_DEG, CANDIDATE_DATES
from pipeline.shared.geo import make_grid_coords
from pipeline.shared.time_utils import imerg_filename_to_start_utc, format_isoz

RAW_IMERG_DIR = Path("pipeline/data/RAW/imerg")
RAW_PREDICTORS_DIR = Path("pipeline/data/RAW/predictors")
PROCESSED_DIR = Path("pipeline/data/PROCESSED")
QA_OUT_DIR = Path("docs/qa")

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
QA_OUT_DIR.mkdir(parents=True, exist_ok=True)


def load_predictors_spatial_interpolators(date_str: str, target_lats: np.ndarray, target_lons: np.ndarray):
    """
    Loads all JSON predictor files for date_str, and creates an hourly spatial interpolator
    mapping (lat, lon) to (cape, t2m, rh, cloud) on the target grid (50, 50).
    Returns dict: hour (0-23) -> dict of 2D grids (ny, nx).
    """
    pred_dir = RAW_PREDICTORS_DIR / date_str
    assert pred_dir.exists(), f"Predictor directory {pred_dir} does not exist"

    json_files = list(pred_dir.glob("*.json"))
    assert len(json_files) > 0, f"No predictor files in {pred_dir}"

    coords = []
    records = []
    for jf in json_files:
        with open(jf, "r", encoding="utf-8") as f:
            d = json.load(f)
        lat = d["latitude"]
        lon = d["longitude"]
        coords.append((lat, lon))
        records.append(d["hourly"])

    coords = np.array(coords)  # (N, 2)

    # Build meshgrid of target coordinates: (ny, nx)
    lon_mesh, lat_mesh = np.meshgrid(target_lons, target_lats)
    grid_points = np.column_stack([lat_mesh.ravel(), lon_mesh.ravel()])

    hourly_grids = {}
    for hour in range(24):
        capes = np.array([r["cape"][hour] for r in records], dtype=np.float32)
        t2ms = np.array([r["temperature_2m"][hour] for r in records], dtype=np.float32)
        rhs = np.array([r["relative_humidity_2m"][hour] for r in records], dtype=np.float32)
        clouds = np.array([r["cloud_cover"][hour] for r in records], dtype=np.float32)

        # Spatial nearest interpolation across BBOX
        interp_cape = NearestNDInterpolator(coords, capes)(grid_points).reshape(len(target_lats), len(target_lons))
        interp_t2m = NearestNDInterpolator(coords, t2ms)(grid_points).reshape(len(target_lats), len(target_lons))
        interp_rh = NearestNDInterpolator(coords, rhs)(grid_points).reshape(len(target_lats), len(target_lons))
        interp_cloud = NearestNDInterpolator(coords, clouds)(grid_points).reshape(len(target_lats), len(target_lons))

        hourly_grids[hour] = {
            "cape": interp_cape.astype(np.float32),
            "t2m": interp_t2m.astype(np.float32),
            "rh": interp_rh.astype(np.float32),
            "cloud": interp_cloud.astype(np.float32)
        }

    return hourly_grids


def preprocess_event(date_str: str, event_id: str):
    """
    Process raw IMERG + Predictors for date_str and write pipeline/data/PROCESSED/<event_id>.npz.
    """
    print(f"\n==================================================")
    print(f"[PREPROCESS] Aligning & Packaging: {event_id} ({date_str})")
    print(f"==================================================")

    # 1. Target coordinate grid (PRD_00 §7)
    target_lats, target_lons = make_grid_coords(BBOX, GRID_RES_DEG)
    ny, nx = len(target_lats), len(target_lons)
    print(f"[GRID] Target Grid: {ny}x{nx} cells (0.1 deg)")
    print(f"       Lat range: [{target_lats[0]:.2f}N down to {target_lats[-1]:.2f}N] (descending)")
    print(f"       Lon range: [{target_lons[0]:.2f}E up to {target_lons[-1]:.2f}E] (ascending)")

    # 2. Find and sort IMERG granules
    date_dir = RAW_IMERG_DIR / date_str
    assert date_dir.exists(), f"IMERG directory {date_dir} missing"
    raw_files = sorted(list(date_dir.glob("*.HDF5")))
    assert len(raw_files) >= 44, f"Insufficient files for {date_str}: {len(raw_files)} found"

    # 3. Read and align precipitation frames
    frames = []
    times = []
    gaps_filled = 0

    west, south, east, north = BBOX

    for f in raw_files:
        dt_utc = imerg_filename_to_start_utc(f.name)
        times.append(format_isoz(dt_utc))

        with netCDF4.Dataset(str(f), "r") as ds:
            grid = ds.groups["Grid"]
            lats = grid.variables["lat"][:]
            lons = grid.variables["lon"][:]
            precip = grid.variables["precipitation"][:]  # (time, lon, lat)
            units = getattr(grid.variables["precipitation"], "units", "mm/hr")

            lat_mask = (lats >= south) & (lats <= north)
            lon_mask = (lons >= west) & (lons <= east)

            # Crop (lon, lat) slice
            p_sub = precip[0, lon_mask, :][:, lat_mask]

            # Transpose to (lat, lon) -> shape (ny, nx)
            p_lat_lon = p_sub.T

            # Reverse latitude axis so row 0 = North (descending lat)
            p_oriented = p_lat_lon[::-1, :]

            # Clean NaNs or fill values (e.g. -9999.9)
            invalid_mask = np.isnan(p_oriented) | (p_oriented < 0.0)
            if np.any(invalid_mask):
                fill_count = int(invalid_mask.sum())
                gaps_filled += fill_count
                p_oriented[invalid_mask] = 0.0

            frames.append(p_oriented.astype(np.float32))

    rain_arr = np.stack(frames, axis=0)  # Shape (n_times, ny, nx)
    n_times = len(times)
    print(f"[RAIN] Stacked precipitation array shape: {rain_arr.shape} ({units})")
    print(f"       Max rain rate: {float(np.max(rain_arr)):.2f} mm/h")
    print(f"       Gaps/NaNs filled: {gaps_filled}")

    # 4. Load & Align Predictors (Phase A4)
    print("[PREDICTORS] Aligning atmospheric instability fields...")
    hourly_predictors = load_predictors_spatial_interpolators(date_str, target_lats, target_lons)

    cape_frames = []
    t2m_frames = []
    rh_frames = []
    cloud_frames = []

    for t_str in times:
        dt = datetime.fromisoformat(t_str.replace("Z", "+00:00"))
        hour = dt.hour
        fields = hourly_predictors[hour]
        cape_frames.append(fields["cape"])
        t2m_frames.append(fields["t2m"])
        rh_frames.append(fields["rh"])
        cloud_frames.append(fields["cloud"])

    cape_arr = np.stack(cape_frames, axis=0)  # (n_times, ny, nx)
    t2m_arr = np.stack(t2m_frames, axis=0)
    rh_arr = np.stack(rh_frames, axis=0)
    cloud_arr = np.stack(cloud_frames, axis=0)

    print(f"[ALIGN] Arrays synchronized across {n_times} time frames.")
    print(f"        CAPE range: [{np.min(cape_arr):.1f}, {np.max(cape_arr):.1f}] J/kg")
    print(f"        T2m range:  [{np.min(t2m_arr):.1f}, {np.max(t2m_arr):.1f}] degC")

    # 5. Metadata
    meta = {
        "event_id": event_id,
        "date": date_str,
        "bbox": BBOX,
        "grid_res_deg": GRID_RES_DEG,
        "nx": nx,
        "ny": ny,
        "n_times": n_times,
        "rain_units": "mm/h",
        "cape_units": "J/kg",
        "t2m_units": "degC",
        "rh_units": "%",
        "cloud_units": "%",
        "source_rain": "NASA GPM IMERG Early Run L3 V07 (0.1 deg)",
        "source_predictors": "Open-Meteo Historical Reanalysis (GFS Seamless)",
        "gaps_filled": gaps_filled,
        "created_at_utc": datetime.now(timezone.utc).isoformat()
    }

    # 6. Save compressed .npz archive
    out_npz_path = PROCESSED_DIR / f"{event_id}.npz"
    np.savez_compressed(
        out_npz_path,
        rain=rain_arr,
        times=np.array(times, dtype=object),
        lat=target_lats.astype(np.float64),
        lon=target_lons.astype(np.float64),
        cape=cape_arr,
        t2m=t2m_arr,
        rh=rh_arr,
        cloud=cloud_arr,
        meta=json.dumps(meta)
    )
    npz_mb = out_npz_path.stat().st_size / (1024 * 1024)
    print(f"✅ Processed dataset saved to: {out_npz_path} ({npz_mb:.2f} MB)")

    # 7. Generate Phase A6 Processed Sanity Plot
    # 6-frame grid plot on the processed array
    indices = np.linspace(0, n_times - 1, 6, dtype=int)
    fig, axes = plt.subplots(2, 3, figsize=(15, 9))
    fig.suptitle(f"Processed Array Sanity Check — {event_id} ({date_str})\nShape: {rain_arr.shape} | Units: mm/h", fontsize=14, fontweight="bold")

    vmax = max(15.0, min(50.0, float(np.max(rain_arr))))
    for ax, idx in zip(axes.flat, indices):
        frame_data = rain_arr[idx]
        t_label = times[idx]
        im = ax.imshow(
            frame_data,
            origin="upper",
            extent=[target_lons[0], target_lons[-1], target_lats[-1], target_lats[0]],
            cmap="Blues",
            vmin=0.0,
            vmax=vmax
        )
        ax.plot(88.36, 22.57, "r*", markersize=8, label="Kolkata")
        ax.set_title(f"Step #{idx+1:02d} ({t_label[11:16]}Z)", fontsize=11)
        ax.set_xlabel("Longitude (°E)", fontsize=9)
        ax.set_ylabel("Latitude (°N)", fontsize=9)
        ax.grid(color="gray", linestyle=":", alpha=0.4)

    cbar_ax = fig.add_axes([0.92, 0.15, 0.02, 0.7])
    cbar = fig.colorbar(im, cax=cbar_ax)
    cbar.set_label("Rain Rate (mm/h)", fontsize=11)

    qa_plot_path = QA_OUT_DIR / f"{event_id}_processed_frames.png"
    plt.savefig(qa_plot_path, dpi=120, bbox_inches="tight")
    plt.close()
    print(f"📸 Processed QA Map Grid saved to: {qa_plot_path}")

    return out_npz_path


def main():
    parser = argparse.ArgumentParser(description="Preprocess IMERG and atmospheric predictors into .npz.")
    parser.add_argument("--date", type=str, default="2024-05-07", help="Date to process")
    parser.add_argument("--event-id", type=str, default="evt_01", help="Event ID (e.g. evt_01)")
    args = parser.parse_args()

    preprocess_event(args.date, args.event_id)


if __name__ == "__main__":
    main()
