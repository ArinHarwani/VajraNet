#!/usr/bin/env python3
"""
contracts/make_mock.py - Generates complete mock data root at web/public/data-mock/
Complies with VajraNet Contract v1.0 (PRD_00 §8, §9.1 - §9.6)
"""

import os
import math
import json
from pathlib import Path
from datetime import datetime, timedelta, timezone
from PIL import Image, ImageDraw

def hex_to_rgba(hex_str: str):
    hex_str = hex_str.lstrip("#")
    if len(hex_str) == 8:
        r = int(hex_str[0:2], 16)
        g = int(hex_str[2:4], 16)
        b = int(hex_str[4:6], 16)
        a = int(hex_str[6:8], 16)
        return (r, g, b, a)
    elif len(hex_str) == 6:
        r = int(hex_str[0:2], 16)
        g = int(hex_str[2:4], 16)
        b = int(hex_str[4:6], 16)
        return (r, g, b, 255)
    return (0, 0, 0, 0)

def interpolate_color(val: float, stops: list):
    if val <= stops[0]["value"]:
        return (0, 0, 0, 0)
    for i in range(len(stops) - 1):
        s1 = stops[i]
        s2 = stops[i+1]
        if s1["value"] <= val <= s2["value"]:
            t = (val - s1["value"]) / (s2["value"] - s1["value"] + 1e-9)
            c1 = hex_to_rgba(s1["color"])
            c2 = hex_to_rgba(s2["color"])
            r = int(c1[0] + t * (c2[0] - c1[0]))
            g = int(c1[1] + t * (c2[1] - c1[1]))
            b = int(c1[2] + t * (c2[2] - c1[2]))
            a = int(c1[3] + t * (c2[3] - c1[3]))
            return (r, g, b, a)
    return hex_to_rgba(stops[-1]["color"])

def generate_blob_field(width: int, height: int, cx: float, cy: float, sigma: float, peak: float):
    field = []
    for y in range(height):
        row = []
        for x in range(width):
            dist_sq = (x - cx)**2 + (y - cy)**2
            val = peak * math.exp(-dist_sq / (2 * (sigma**2)))
            row.append(val)
        field.append(row)
    return field

def render_field_png(field: list, stops: list, out_path: Path):
    height = len(field)
    width = len(field[0])
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    pixels = img.load()
    for y in range(height):
        for x in range(width):
            pixels[x, y] = interpolate_color(field[y][x], stops)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "PNG")

def main():
    root = Path(__file__).parent.parent / "web" / "public" / "data-mock"
    root.mkdir(parents=True, exist_ok=True)
    print(f"Generating mock data in: {root}")

    # 1. colormap.json
    colormap = {
        "contract_version": "1.0",
        "unit": "mm/h",
        "rain_stops": [
            { "value": 0.1, "color": "#00000000" },
            { "value": 1.0, "color": "#4fc3f799" },
            { "value": 5.0, "color": "#0288d1cc" },
            { "value": 15.0, "color": "#fbc02dcc" },
            { "value": 30.0, "color": "#f57c00e6" },
            { "value": 50.0, "color": "#d32f2fe6" }
        ],
        "prob_stops": [
            { "value": 0.05, "color": "#00000000" },
            { "value": 0.25, "color": "#81c78499" },
            { "value": 0.50, "color": "#fff176cc" },
            { "value": 0.75, "color": "#ffb74de6" },
            { "value": 0.90, "color": "#e57373e6" }
        ]
    }
    with open(root / "colormap.json", "w", encoding="utf-8") as f:
        json.dump(colormap, f, indent=2)

    # 2. sim_scenarios.json
    sim_scenarios = {
        "contract_version": "1.0",
        "scenarios": [
            {
                "id": "demo_squall",
                "label": "SIMULATION - Pre-Monsoon Severe Squall",
                "start_distance_km": 40.0,
                "bearing_from_deg": 245.0,
                "speed_kmh": 40.0,
                "cross_track_km": 0.0,
                "radius_km": 14.0,
                "peak_lri": 92.0,
                "watch_eta_min": 45.0,
                "emergency_eta_min": 15.0
            },
            {
                "id": "demo_coastal_storm",
                "label": "SIMULATION - Coastal Convective Cell",
                "start_distance_km": 25.0,
                "bearing_from_deg": 190.0,
                "speed_kmh": 32.0,
                "cross_track_km": 2.0,
                "radius_km": 10.0,
                "peak_lri": 78.0,
                "watch_eta_min": 35.0,
                "emergency_eta_min": 12.0
            }
        ]
    }
    with open(root / "sim_scenarios.json", "w", encoding="utf-8") as f:
        json.dump(sim_scenarios, f, indent=2)

    # 3. results.json
    results = {
        "contract_version": "1.0",
        "n_events": 2,
        "n_points": 6,
        "event_thr_mm_h": 5.0,
        "notes": "Synthetic mock baseline results for pipeline validation and Replay UI preview.",
        "by_method": {
            "persistence": { "POD": 0.45, "FAR": 0.38, "CSI": 0.34, "brier": 0.22 },
            "extrapolation": { "POD": 0.68, "FAR": 0.27, "CSI": 0.54, "brier": 0.16 },
            "steps_ensemble": { "POD": 0.76, "FAR": 0.22, "CSI": 0.63, "brier": 0.13 },
            "lightgbm": { "POD": 0.74, "FAR": 0.20, "CSI": 0.62, "brier": 0.12 },
            "blend": { "POD": 0.81, "FAR": 0.18, "CSI": 0.69, "brier": 0.10 }
        },
        "by_lead": {
            "30": { "blend": { "POD": 0.90, "FAR": 0.10, "CSI": 0.82, "brier": 0.06 } },
            "60": { "blend": { "POD": 0.81, "FAR": 0.18, "CSI": 0.69, "brier": 0.10 } },
            "90": { "blend": { "POD": 0.72, "FAR": 0.24, "CSI": 0.58, "brier": 0.14 } },
            "120": { "blend": { "POD": 0.64, "FAR": 0.30, "CSI": 0.49, "brier": 0.18 } },
            "150": { "blend": { "POD": 0.56, "FAR": 0.35, "CSI": 0.42, "brier": 0.21 } },
            "180": { "blend": { "POD": 0.49, "FAR": 0.40, "CSI": 0.36, "brier": 0.25 } }
        },
        "alerts": {
            "hit": 4,
            "miss": 0,
            "false_alarm": 1,
            "correct_null": 1,
            "median_lead_time_min": 45.0
        },
        "per_event": [
            { "id": "evt_mock_01", "hit": 3, "miss": 0, "false_alarm": 0, "median_lead_time_min": 45.0 },
            { "id": "evt_mock_02", "hit": 0, "miss": 0, "false_alarm": 0, "median_lead_time_min": 0.0 }
        ],
        "blend_weight_ens": 0.65
    }
    with open(root / "results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    # 4. events.json
    events_data = {
        "contract_version": "1.0",
        "mock": True,
        "events": [
            {
                "id": "evt_mock_01",
                "name": "Bengal Pre-Monsoon Squall (Synthetic)",
                "is_no_storm": False,
                "bbox": [86.0, 21.5, 90.0, 25.5],
                "grid": { "res_deg": 0.1, "nx": 40, "ny": 40 },
                "first_issue": "2025-05-15T08:00:00Z",
                "last_issue": "2025-05-15T11:00:00Z",
                "issue_step_min": 30,
                "leads_min": [30, 60, 90, 120, 150, 180],
                "event_thr_mm_h": 5.0,
                "reference": {
                    "label": "Synthetic Benchmark Scenario 1 (Kolkata Region)",
                    "url": "https://example.com/mock/evt_mock_01",
                    "verified": True
                },
                "points": [
                    { "id": "p1_kolkata", "name": "Kolkata City Center", "lat": 22.5726, "lon": 88.3639 },
                    { "id": "p2_burdwan", "name": "Burdwan Junction", "lat": 23.2324, "lon": 87.8615 },
                    { "id": "p3_kharagpur", "name": "Kharagpur Station", "lat": 22.3305, "lon": 87.3237 }
                ]
            },
            {
                "id": "evt_mock_02",
                "name": "Gangetic Plain Fair Weather Day (Synthetic Null)",
                "is_no_storm": True,
                "bbox": [86.0, 21.5, 90.0, 25.5],
                "grid": { "res_deg": 0.1, "nx": 40, "ny": 40 },
                "first_issue": "2025-05-16T08:00:00Z",
                "last_issue": "2025-05-16T11:00:00Z",
                "issue_step_min": 30,
                "leads_min": [30, 60, 90, 120, 150, 180],
                "event_thr_mm_h": 5.0,
                "reference": {
                    "label": "Synthetic Benchmark Scenario 2 (Clear Skies Control)",
                    "url": "https://example.com/mock/evt_mock_02",
                    "verified": True
                },
                "points": [
                    { "id": "p1_kolkata", "name": "Kolkata City Center", "lat": 22.5726, "lon": 88.3639 },
                    { "id": "p2_burdwan", "name": "Burdwan Junction", "lat": 23.2324, "lon": 87.8615 },
                    { "id": "p3_kharagpur", "name": "Kharagpur Station", "lat": 22.3305, "lon": 87.3237 }
                ]
            }
        ]
    }
    with open(root / "events.json", "w", encoding="utf-8") as f:
        json.dump(events_data, f, indent=2)

    # Image specs
    img_w, img_h = 120, 120
    # outer bbox [86.0, 21.5, 90.0, 25.5]
    # MapLibre image_coordinates: [[w,n],[e,n],[e,s],[w,s]]
    image_coords = [[86.0, 25.5], [90.0, 25.5], [90.0, 21.5], [86.0, 21.5]]

    # Generate events data
    for ev in events_data["events"]:
        ev_id = ev["id"]
        ev_dir = root / "events" / ev_id
        ev_dir.mkdir(parents=True, exist_ok=True)
        is_no_storm = ev["is_no_storm"]

        obs_dict = {}
        forecast_dict = {}

        # Issue times: 08:00, 08:30, 09:00, 09:30, 10:00, 10:30, 11:00
        start_dt = datetime(2025, 5, 15 if ev_id == "evt_mock_01" else 16, 7, 30, tzinfo=timezone.utc)
        total_steps = 14 # covers valid times up to 14:00

        # Pre-render observed frames for valid starts
        for step in range(total_steps):
            frame_dt = start_dt + timedelta(minutes=30 * step)
            iso_str = frame_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            fname = f"obs/{frame_dt.strftime('%Y%m%dT%H%MZ')}.png"

            if is_no_storm:
                # Virtually empty rain field
                field = [[0.0 for _ in range(img_w)] for _ in range(img_h)]
            else:
                # Moving Gaussian storm blob: starts at (20, 25) and moves toward (100, 95)
                # t from 0 to 1 across steps
                t = step / (total_steps - 1)
                cx = 15.0 + t * 90.0
                cy = 20.0 + t * 80.0
                sigma = 18.0 + 4.0 * math.sin(t * math.pi)
                peak = 45.0 + 10.0 * math.sin(t * math.pi)
                field = generate_blob_field(img_w, img_h, cx, cy, sigma, peak)

            render_field_png(field, colormap["rain_stops"], ev_dir / fname)
            obs_dict[iso_str] = fname

        # Forecast frames
        issue_dts = [datetime(2025, 5, 15 if ev_id == "evt_mock_01" else 16, h, m, tzinfo=timezone.utc)
                     for h in range(8, 12) for m in (0, 30) if not (h == 11 and m > 0)]

        for issue_dt in issue_dts:
            issue_iso = issue_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            forecast_dict[issue_iso] = {}

            # Base step index for issue time
            base_step = int((issue_dt - start_dt).total_seconds() / 1800)

            for lead in ev["leads_min"]:
                lead_step = int(lead / 30)
                fc_step = base_step + lead_step - 1

                mean_fname = f"fc/{issue_dt.strftime('%Y%m%dT%H%MZ')}_L{lead:03d}_mean.png"
                prob_fname = f"fc/{issue_dt.strftime('%Y%m%dT%H%MZ')}_L{lead:03d}_prob.png"

                if is_no_storm:
                    mean_field = [[0.0 for _ in range(img_w)] for _ in range(img_h)]
                    prob_field = [[0.0 for _ in range(img_w)] for _ in range(img_h)]
                else:
                    t = min(1.0, fc_step / (total_steps - 1))
                    cx = 15.0 + t * 90.0
                    cy = 20.0 + t * 80.0
                    sigma = 18.0 + 4.0 * math.sin(t * math.pi)
                    # Slight dispersion with lead time
                    sigma_fc = sigma * (1.0 + 0.08 * (lead / 30.0))
                    peak_fc = (45.0 + 10.0 * math.sin(t * math.pi)) * (1.0 - 0.05 * (lead / 30.0))
                    mean_field = generate_blob_field(img_w, img_h, cx, cy, sigma_fc, peak_fc)

                    # Prob field = P(rain >= 5 mm/h)
                    prob_field = []
                    for row in mean_field:
                        p_row = [min(1.0, max(0.0, (val / 12.0) ** 1.3)) for val in row]
                        prob_field.append(p_row)

                render_field_png(mean_field, colormap["rain_stops"], ev_dir / mean_fname)
                render_field_png(prob_field, colormap["prob_stops"], ev_dir / prob_fname)

                forecast_dict[issue_iso][str(lead)] = {
                    "mean": mean_fname,
                    "prob": prob_fname
                }

        # Write manifest.json
        manifest = {
            "contract_version": "1.0",
            "event_id": ev_id,
            "image_coordinates": image_coords,
            "image_projection": "web-mercator-resampled",
            "colormap": "../../colormap.json",
            "obs": obs_dict,
            "forecast": forecast_dict
        }
        with open(ev_dir / "manifest.json", "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

        # Points JSON
        points_dir = ev_dir / "points"
        points_dir.mkdir(parents=True, exist_ok=True)

        for pt_idx, pt in enumerate(ev["points"]):
            pt_id = pt["id"]

            if is_no_storm:
                summary = {
                    "observed_onset_start": None,
                    "alert_fired_at": None,
                    "lead_time_min": None,
                    "outcome": "correct_null"
                }
            else:
                onset_hour = 9 + pt_idx # p1 hits at 09:30, p2 at 10:30, p3 at 11:30
                summary = {
                    "observed_onset_start": f"2025-05-15T{onset_hour:02d}:30:00Z",
                    "alert_fired_at": f"2025-05-15T{onset_hour-1:02d}:45:00Z",
                    "lead_time_min": 45,
                    "outcome": "hit"
                }

            timeline = []
            for issue_idx, issue_dt in enumerate(issue_dts):
                issue_iso = issue_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

                # Distance progression to simulated storm
                if is_no_storm:
                    rain_now = 0.0
                    eta_window = None
                    motion = None
                    confidence = None
                    alert_state = "none"
                    alert_severity = None
                    alert_reason = "No thunderstorm activity detected in the region."
                    cape_val = 600.0
                else:
                    # Storm approaches point
                    time_diff = (issue_idx - (pt_idx * 2 + 1))
                    if time_diff < -1:
                        # Approaching
                        rain_now = 0.0
                        eta_window = [45, 60]
                        motion = { "heading_deg": 65.0, "from_deg": 245.0, "speed_kmh": 42.0 }
                        confidence = "high"
                        alert_state = "alert" if time_diff == -2 else "none"
                        alert_severity = "moderate" if alert_state != "none" else None
                        alert_reason = "Organized convective squall line approaching from WSW (245°)."
                    elif time_diff == -1:
                        # Imminent
                        rain_now = 1.2
                        eta_window = [15, 30]
                        motion = { "heading_deg": 65.0, "from_deg": 245.0, "speed_kmh": 40.0 }
                        confidence = "high"
                        alert_state = "emergency"
                        alert_severity = "severe"
                        alert_reason = "Severe thunderstorm with high lightning risk arrival within 15-30 minutes."
                    elif time_diff == 0:
                        # Onset
                        rain_now = 18.5
                        eta_window = [0, 10]
                        motion = { "heading_deg": 65.0, "from_deg": 245.0, "speed_kmh": 38.0 }
                        confidence = "high"
                        alert_state = "emergency"
                        alert_severity = "severe"
                        alert_reason = "Severe storm underway. Remain sheltered."
                    else:
                        # Departing
                        rain_now = max(0.0, 5.0 - time_diff * 2.0)
                        eta_window = None
                        motion = { "heading_deg": 65.0, "from_deg": 245.0, "speed_kmh": 35.0 }
                        confidence = "medium"
                        alert_state = "all_clear" if time_diff >= 2 else "none"
                        alert_severity = "low" if alert_state == "all_clear" else None
                        alert_reason = "Storm cell moving away to ENE. Conditions improving."

                    cape_val = 2250.0

                leads_list = []
                for lead in ev["leads_min"]:
                    valid_dt = issue_dt + timedelta(minutes=lead - 30)
                    valid_iso = valid_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

                    if is_no_storm:
                        p_final = 0.02
                        lri_val = 6.0
                        sev = "low"
                        r_p10, r_p50, r_p90 = 0.0, 0.0, 0.0
                    else:
                        # Lead risk curve
                        lead_dist = abs(lead - (45 + pt_idx * 30))
                        p_final = max(0.05, min(0.95, 1.0 - (lead_dist / 90.0)))
                        # LRI formula: 100 * clip(0.7*p_final + 0.3*clip(cape/2500,0,1), 0, 1)
                        lri_val = round(min(100.0, max(0.0, 100.0 * (0.7 * p_final + 0.3 * (cape_val / 2500.0)))), 1)
                        if lri_val >= 80:
                            sev = "severe"
                        elif lri_val >= 60:
                            sev = "strong"
                        elif lri_val >= 30:
                            sev = "moderate"
                        else:
                            sev = "low"
                        r_p50 = round(p_final * 28.0, 1)
                        r_p10 = round(r_p50 * 0.4, 1)
                        r_p90 = round(r_p50 * 1.8, 1)

                    leads_list.append({
                        "lead_min": lead,
                        "valid_start": valid_iso,
                        "p_ens": round(p_final * 0.95, 2),
                        "p_ml": round(p_final * 1.05 if p_final < 0.9 else 0.95, 2),
                        "p_final": round(p_final, 2),
                        "rain_p10": r_p10,
                        "rain_p50": r_p50,
                        "rain_p90": r_p90,
                        "lri": lri_val,
                        "severity": sev
                    })

                timeline.append({
                    "issue_time": issue_iso,
                    "rain_now_mm_h": round(rain_now, 1),
                    "leads": leads_list,
                    "eta_window_min": eta_window,
                    "motion": motion,
                    "confidence": confidence,
                    "alert": {
                        "state": alert_state,
                        "severity": alert_severity,
                        "is_new": (alert_state in ("alert", "emergency", "all_clear")),
                        "reason": alert_reason
                    },
                    "explain": {
                        "cape": round(cape_val, 0),
                        "cin": -18.0 if not is_no_storm else -120.0,
                        "t2m_c": 33.5 if not is_no_storm else 31.0,
                        "rh_pct": 74.0 if not is_no_storm else 52.0,
                        "top_features": [
                            { "name": "cape", "label_en": "Air instability (CAPE)", "contribution": 0.38 },
                            { "name": "reflectivity_advection", "label_en": "Upwind Radar/Precip Advection", "contribution": 0.32 },
                            { "name": "rh_surface", "label_en": "Boundary-layer Moisture", "contribution": 0.18 },
                            { "name": "cin", "label_en": "Convective Inhibition CIN", "contribution": -0.12 }
                        ]
                    }
                })

            point_doc = {
                "contract_version": "1.0",
                "event_id": ev_id,
                "point": pt,
                "summary": summary,
                "timeline": timeline
            }
            with open(points_dir / f"{pt_id}.json", "w", encoding="utf-8") as f:
                json.dump(point_doc, f, indent=2)

    print("Mock data generation finished successfully!")

if __name__ == "__main__":
    main()
