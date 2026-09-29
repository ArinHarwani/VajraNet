#!/usr/bin/env python3
"""
contracts/validate.py - VajraNet Contract Validator v1.0
Validates a data root (e.g. web/public/data-mock or web/public/data)
against contracts/schemas/*.schema.json and checks image consistency.
"""

import sys
import json
from pathlib import Path
from PIL import Image
import jsonschema

def load_json(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def validate_schema(data, schema_path: Path, context_msg: str):
    schema = load_json(schema_path)
    try:
        jsonschema.validate(instance=data, schema=schema)
    except jsonschema.ValidationError as e:
        raise ValueError(f"Schema violation in {context_msg}: {e.message} at path {list(e.path)}")

def validate_root(root_dir: str | Path):
    root = Path(root_dir).resolve()
    print(f"=== Validating VajraNet Data Root: {root} ===")

    if not root.exists():
        print(f"[ERROR] Target path does not exist: {root}")
        return False

    schemas_dir = Path(__file__).parent / "schemas"
    events_schema = schemas_dir / "events.schema.json"
    manifest_schema = schemas_dir / "manifest.schema.json"
    colormap_schema = schemas_dir / "colormap.schema.json"
    point_schema = schemas_dir / "point.schema.json"
    results_schema = schemas_dir / "results.schema.json"
    sim_schema = schemas_dir / "sim_scenarios.schema.json"

    events_path = root / "events.json"
    if not events_path.exists():
        # Check if root is simply empty
        items = list(root.iterdir())
        if not items:
            print("[INFO] Root directory is empty. Validation clean (0 events).")
            return True
        else:
            print(f"[ERROR] Missing required events.json in {root}")
            return False

    events_data = load_json(events_path)
    validate_schema(events_data, events_schema, "events.json")
    is_mock = events_data.get("mock", False)
    print(f"[OK] events.json valid (mock={is_mock}, {len(events_data['events'])} events)")

    # colormap.json
    colormap_path = root / "colormap.json"
    if colormap_path.exists():
        colormap_data = load_json(colormap_path)
        validate_schema(colormap_data, colormap_schema, "colormap.json")
        print("[OK] colormap.json valid")
    else:
        print("[WARN] colormap.json not found in root (may be relative to manifest)")

    # results.json (if present)
    results_path = root / "results.json"
    if results_path.exists():
        results_data = load_json(results_path)
        validate_schema(results_data, results_schema, "results.json")
        print("[OK] results.json valid")

    # sim_scenarios.json (if present)
    sim_path = root / "sim_scenarios.json"
    if sim_path.exists():
        sim_data = load_json(sim_path)
        validate_schema(sim_data, sim_schema, "sim_scenarios.json")
        print("[OK] sim_scenarios.json valid")

    # Validate each event
    total_pngs = 0
    total_points = 0

    for ev in events_data["events"]:
        ev_id = ev["id"]
        ev_dir = root / "events" / ev_id
        if not ev_dir.exists():
            raise FileNotFoundError(f"Missing event directory: {ev_dir}")

        manifest_path = ev_dir / "manifest.json"
        if not manifest_path.exists():
            raise FileNotFoundError(f"Missing manifest.json for event {ev_id}")

        manifest_data = load_json(manifest_path)
        validate_schema(manifest_data, manifest_schema, f"events/{ev_id}/manifest.json")

        # Collect and check all PNGs
        event_images = []
        for valid_time, rel_png in manifest_data.get("obs", {}).items():
            png_file = ev_dir / rel_png
            if not png_file.exists():
                raise FileNotFoundError(f"Referenced obs PNG missing: {png_file} (event {ev_id})")
            event_images.append(png_file)

        for issue_time, leads in manifest_data.get("forecast", {}).items():
            for lead_min, files in leads.items():
                for ftype in ("mean", "prob"):
                    rel_png = files.get(ftype)
                    if rel_png:
                        png_file = ev_dir / rel_png
                        if not png_file.exists():
                            raise FileNotFoundError(f"Referenced forecast {ftype} PNG missing: {png_file} (event {ev_id})")
                        event_images.append(png_file)

        # Check all images in this event have matching dimensions
        first_dims = None
        for img_path in event_images:
            with Image.open(img_path) as im:
                dims = im.size
                if first_dims is None:
                    first_dims = dims
                elif dims != first_dims:
                    raise ValueError(f"Image dimension mismatch in event {ev_id}: {img_path} has {dims}, expected {first_dims}")
        total_pngs += len(event_images)
        print(f"[OK] Event {ev_id} manifest and {len(event_images)} PNGs validated (dimensions: {first_dims})")

        # Check points
        points_dir = ev_dir / "points"
        for pt in ev["points"]:
            pt_id = pt["id"]
            pt_path = points_dir / f"{pt_id}.json"
            if not pt_path.exists():
                raise FileNotFoundError(f"Missing point file {pt_path} for event {ev_id}")
            pt_data = load_json(pt_path)
            validate_schema(pt_data, point_schema, f"events/{ev_id}/points/{pt_id}.json")
            total_points += 1

    print(f"=== Validation Passed Successfully! ({len(events_data['events'])} events, {total_points} points, {total_pngs} PNG frames checked) ===")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python contracts/validate.py <data_root>")
        sys.exit(1)
    target_root = sys.argv[1]
    try:
        success = validate_root(target_root)
        sys.exit(0 if success else 1)
    except Exception as exc:
        print(f"[VALIDATION FAILED] {exc}")
        sys.exit(1)
