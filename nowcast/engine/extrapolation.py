"""
nowcast/engine/extrapolation.py - Semi-Lagrangian backward advection for deterministic nowcasting.
Compliant with PRD_00 §7 and PRD_B ML Nowcasting specifications.
"""
from typing import Dict, List
import numpy as np
import cv2

DEFAULT_LEADS_MIN = [30, 60, 90, 120, 150, 180]


def advect_field(
    field_2d: np.ndarray,
    flow: np.ndarray,
    step_multiplier: float
) -> np.ndarray:
    """
    Perform semi-Lagrangian backward advection of a 2D scalar field along motion field `flow`.
    Inputs:
        field_2d: (ny, nx) float32 array
        flow: (ny, nx, 2) float32 array with (dx, dy)
        step_multiplier: float number of 30-minute advection steps (e.g. 1.0 for 30m, 2.0 for 60m)
    Returns:
        advected: (ny, nx) float32 array
    """
    ny, nx = field_2d.shape
    grid_x, grid_y = np.meshgrid(np.arange(nx, dtype=np.float32), np.arange(ny, dtype=np.float32))

    # Backward trajectory: where did the parcel come from?
    map_x = grid_x - step_multiplier * flow[..., 0]
    map_y = grid_y - step_multiplier * flow[..., 1]

    # Remap with bilinear interpolation and zero boundary
    advected = cv2.remap(
        field_2d.astype(np.float32),
        map_x,
        map_y,
        interpolation=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=0.0
    )
    return np.maximum(0.0, advected)


def generate_extrapolation_forecasts(
    frame_curr: np.ndarray,
    flow: np.ndarray,
    leads_min: List[int] = DEFAULT_LEADS_MIN,
    step_min: int = 30
) -> Dict[int, np.ndarray]:
    """
    Generate deterministic extrapolation nowcasts for all requested lead times.
    Returns: dict of lead_min -> 2D forecast array (ny, nx)
    """
    forecasts = {}
    for lead in leads_min:
        steps = float(lead) / float(step_min)
        forecast_grid = advect_field(frame_curr, flow, step_multiplier=steps)
        forecasts[lead] = forecast_grid
    return forecasts
