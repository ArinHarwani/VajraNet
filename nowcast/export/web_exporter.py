"""
nowcast/export/web_exporter.py - Export real nowcast predictions, manifests, and color-mapped PNGs.
Compliant with contracts/validate.py and PRD_00 §8.
"""
from typing import Dict, List, Any, Optional
import json
from pathlib import Path
import numpy as np
from PIL import Image

WEB_DATA_DIR = Path("web/public/data")

# Color ramps from colormap.json
# Hex RGBA converted to tuple (R, G, B, A)
RAIN_COLOR_STOPS = [
    (0.1,  (0, 0, 0, 0)),        # Transparent below 0.1 mm/h
    (1.0,  (79, 195, 247, 153)), # #4fc3f799
    (5.0,  (2, 136, 209, 204)),  # #0288d1cc
    (15.0, (251, 192, 45, 204)), # #fbc02dcc
    (30.0, (245, 124, 0, 230)),  # #f57c00e6
    (50.0, (211, 47, 47, 230))   # #d32f2fe6
]

PROB_COLOR_STOPS = [
    (0.05, (0, 0, 0, 0)),        # Transparent below 5%
    (0.25, (129, 199, 132, 153)),# #81c78499
    (0.50, (255, 241, 118, 204)),# #fff176cc
    (0.75, (255, 183, 77, 230)), # #ffb74de6
    (0.90, (229, 115, 115, 230)) # #e57373e6
]


def interpolate_color(val: float, stops: List[tuple]) -> tuple:
    """Linearly interpolate RGBA color based on threshold stops."""
    if val <= stops[0][0]:
        return stops[0][1]
    if val >= stops[-1][0]:
        return stops[-1][1]

    for i in range(len(stops) - 1):
        v1, c1 = stops[i]
        v2, c2 = stops[i + 1]
        if v1 <= val <= v2:
            t = (val - v1) / (v2 - v1)
            r = int(round(c1[0] + t * (c2[0] - c1[0])))
            g = int(round(c1[1] + t * (c2[1] - c1[1])))
            b = int(round(c1[2] + t * (c2[2] - c1[2])))
            a = int(round(c1[3] + t * (c2[3] - c1[3])))
            return (r, g, b, a)
    return (0, 0, 0, 0)


def array_to_rgba_image(
    grid_2d: np.ndarray,
    is_probability: bool = False,
    upsample_factor: int = 4
) -> Image.Image:
    """
    Convert a 2D float array (ny, nx) into an RGBA Pillow Image.
    Uses nearest-neighbor upsampling to ensure crisp, anti-aliased radar-style cells.
    """
    ny, nx = grid_2d.shape
    stops = PROB_COLOR_STOPS if is_probability else RAIN_COLOR_STOPS

    rgba = np.zeros((ny, nx, 4), dtype=np.uint8)
    for r in range(ny):
        for c in range(nx):
            val = float(grid_2d[r, c])
            rgba[r, c] = interpolate_color(val, stops)

    img = Image.fromarray(rgba, mode="RGBA")
    if upsample_factor > 1:
        img = img.resize((nx * upsample_factor, ny * upsample_factor), resample=Image.Resampling.NEAREST)
    return img


def save_grid_png(
    grid_2d: np.ndarray,
    out_path: Path,
    is_probability: bool = False
):
    """Render and save 2D grid to PNG."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img = array_to_rgba_image(grid_2d, is_probability=is_probability, upsample_factor=4)
    img.save(out_path, format="PNG", optimize=True)


def export_event_delivery(
    event_id: str,
    event_meta: Dict[str, Any],
    observed_frames: Dict[str, np.ndarray],
    forecast_results: Dict[str, Dict[int, Dict[str, np.ndarray]]],
    point_timelines: List[Dict[str, Any]],
    output_root: Path = WEB_DATA_DIR
):
    """
    Export all artifacts for a single event to output_root/events/<event_id>/.
    Conforming 100% to contracts/schemas.
    """
    event_dir = output_root / "events" / event_id
    obs_dir = event_dir / "obs"
    forecast_dir = event_dir / "forecast"
    points_dir = event_dir / "points"

    event_dir.mkdir(parents=True, exist_ok=True)
    obs_dir.mkdir(parents=True, exist_ok=True)
    forecast_dir.mkdir(parents=True, exist_ok=True)
    points_dir.mkdir(parents=True, exist_ok=True)

    # 1. Export Observed Rain PNGs
    manifest_obs = {}
    for valid_time, rain_grid in observed_frames.items():
        # Filename slug e.g. 2024-05-07T140000Z.png
        slug = valid_time.replace(":", "").replace("-", "")
        rel_path = f"obs/{slug}.png"
        full_path = event_dir / rel_path
        save_grid_png(rain_grid, full_path, is_probability=False)
        manifest_obs[valid_time] = rel_path

    # 2. Export Forecast PNGs (Mean & Prob)
    manifest_forecast = {}
    for issue_time, leads in forecast_results.items():
        issue_slug = issue_time.replace(":", "").replace("-", "")
        manifest_forecast[issue_time] = {}

        for lead_min, grids in leads.items():
            rel_mean = f"forecast/{issue_slug}/{lead_min}/mean.png"
            rel_prob = f"forecast/{issue_slug}/{lead_min}/prob.png"

            save_grid_png(grids["mean"], event_dir / rel_mean, is_probability=False)
            save_grid_png(grids["prob"], event_dir / rel_prob, is_probability=True)

            manifest_forecast[issue_time][str(lead_min)] = {
                "mean": rel_mean,
                "prob": rel_prob
            }

    # 3. Export Event Manifest
    # image_coordinates: [[west, north], [east, north], [east, south], [west, south]]
    west, south, east, north = event_meta["bbox"]
    manifest_data = {
        "contract_version": "1.0",
        "event_id": event_id,
        "image_coordinates": [
            [west, north],
            [east, north],
            [east, south],
            [west, south]
        ],
        "image_projection": "web-mercator-resampled",
        "colormap": "../../colormap.json",
        "obs": manifest_obs,
        "forecast": manifest_forecast
    }
    with open(event_dir / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2)

    # 4. Export Points JSON
    for pt in point_timelines:
        pt_path = points_dir / f"{pt['point']['id']}.json"
        with open(pt_path, "w", encoding="utf-8") as f:
            json.dump(pt, f, indent=2)

    print(f"📦 Exported event {event_id} delivery: {len(manifest_obs)} obs frames, {len(manifest_forecast)} issues.")
