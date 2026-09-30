"""
nowcast/tests/test_nowcast_engine.py - Unit tests for ML and nowcasting engine.
Compliant with PRD_00 §7, §8 and PRD_B specifications.
"""
import numpy as np
import pytest

from nowcast.engine.optical_flow import compute_farneback_optical_flow
from nowcast.engine.extrapolation import advect_field, generate_extrapolation_forecasts
from nowcast.engine.ensemble import generate_ensemble_nowcast
from nowcast.engine.blend import (
    compute_p_final,
    compute_lri,
    get_severity_category,
    compute_eta_minutes
)


def test_optical_flow_synthetic_translation():
    # Synthetic frame with a Gaussian rain cell at (20, 20)
    y, x = np.ogrid[:50, :50]
    frame_prev = 25.0 * np.exp(-((x - 20)**2 + (y - 20)**2) / (2 * 4**2))
    # Cell shifted east by 3 pixels: to (20, 23)
    frame_curr = 25.0 * np.exp(-((x - 23)**2 + (y - 20)**2) / (2 * 4**2))

    flow, speed_kmh, mean_speed, heading_deg = compute_farneback_optical_flow(
        frame_prev, frame_curr, grid_res_deg=0.1, time_step_hours=0.5
    )

    assert flow.shape == (50, 50, 2)
    # Moving eastward: heading should be roughly 90 degrees
    assert 60.0 < heading_deg < 120.0, f"Expected eastward heading ~90 deg, got {heading_deg}"
    # Speed: 3 pixels in 30 min = 3 * 11.1 km / 0.5 h ≈ 66 km/h
    assert 40.0 < mean_speed < 90.0, f"Expected speed ~66 km/h, got {mean_speed}"


def test_semi_lagrangian_extrapolation():
    ny, nx = 50, 50
    frame = np.zeros((ny, nx), dtype=np.float32)
    frame[25, 25] = 20.0  # Point rain source

    # Constant flow moving eastward (+1 pixel / step in x)
    flow = np.zeros((ny, nx, 2), dtype=np.float32)
    flow[..., 0] = 2.0  # dx = +2 pixels

    extrap = generate_extrapolation_forecasts(frame, flow, leads_min=[30, 60], step_min=30)
    assert 30 in extrap and 60 in extrap
    assert extrap[30].shape == (ny, nx)

    # After 1 step (30 min, dx=+2): the cell at (25, 25) should have moved to (25, 27)
    assert extrap[30][25, 27] > 10.0


def test_ensemble_nowcast_properties():
    ny, nx = 50, 50
    frame = np.zeros((ny, nx), dtype=np.float32)
    frame[20:30, 20:30] = 15.0  # 10x10 rain block

    flow = np.zeros((ny, nx, 2), dtype=np.float32)
    flow[..., 0] = 1.0  # slight drift

    res = generate_ensemble_nowcast(frame, flow, leads_min=[30, 60], n_members=20, threshold_mm_h=5.0)

    for lead in [30, 60]:
        assert "mean" in res[lead]
        assert "prob" in res[lead]
        assert "members" in res[lead]
        assert res[lead]["members"].shape == (20, ny, nx)

        # Probabilities strictly in [0.0, 1.0]
        prob = res[lead]["prob"]
        assert np.all(prob >= 0.0) and np.all(prob <= 1.0)
        # Inside the storm core, probability should be high
        assert np.max(prob) > 0.8
        # Outside, probability should be 0
        assert prob[0, 0] == 0.0


def test_blending_and_lri_formulas():
    # 1. p_final = 0.7 * p_ens + 0.3 * p_ml
    p_final = compute_p_final(0.8, 0.6)
    expected_p = 0.7 * 0.8 + 0.3 * 0.6  # 0.56 + 0.18 = 0.74
    assert abs(p_final - expected_p) < 1e-4

    # 2. lri = 100 * clip(0.7 * p_final + 0.3 * clip(cape/2500, 0, 1), 0, 1)
    # With p_final=0.74, cape=2500 -> cape_norm=1.0 -> 100 * (0.7*0.74 + 0.3*1.0) = 100 * (0.518 + 0.3) = 81.8
    lri = compute_lri(0.74, 2500.0)
    assert abs(lri - 81.8) < 0.2
    assert get_severity_category(lri) == "severe"

    # 3. ETA minutes: threshold 0.5
    leads = [30, 60, 90, 120]
    p_series = [0.2, 0.45, 0.75, 0.85]
    eta = compute_eta_minutes(leads, p_series, threshold=0.5)
    assert eta == 90, f"Expected ETA 90 min, got {eta}"
