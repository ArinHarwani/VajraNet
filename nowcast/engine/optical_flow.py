"""
nowcast/engine/optical_flow.py - Optical flow motion estimation for convective storm cells.
Compliant with PRD_00 §7 and PRD_B ML Nowcasting specifications.
"""
from typing import Tuple
import numpy as np
import cv2

KM_PER_DEGREE = 111.0  # Approx 111 km per degree latitude
MIN_PRECIP_THRESHOLD_MM_H = 0.2  # Threshold below which pixels are treated as clear air


def compute_farneback_optical_flow(
    frame_prev: np.ndarray,
    frame_curr: np.ndarray,
    grid_res_deg: float = 0.1,
    time_step_hours: float = 0.5
) -> Tuple[np.ndarray, np.ndarray, float, float]:
    """
    Compute dense motion field between two consecutive rain frames.
    Inputs:
        frame_prev: 2D array of rain rate (ny, nx) at t - 30min
        frame_curr: 2D array of rain rate (ny, nx) at t
    Returns:
        flow: (ny, nx, 2) array of (u, v) displacements in pixel units per frame
        speed_kmh: (ny, nx) array of storm cell speeds in km/h
        mean_speed: scalar average storm speed over active rain cells (km/h)
        mean_heading: scalar compass heading toward which storm moves (0-360 deg, clockwise, 0=N, 90=E)
    """
    ny, nx = frame_curr.shape

    # Normalize frames to 8-bit for robust Farneback tracking
    # Log-transform rain rates to enhance contrast in convective cores
    vmax = max(10.0, float(np.max(frame_curr)), float(np.max(frame_prev)))
    p_prev_norm = np.clip(np.log1p(frame_prev) / np.log1p(vmax) * 255.0, 0, 255).astype(np.uint8)
    p_curr_norm = np.clip(np.log1p(frame_curr) / np.log1p(vmax) * 255.0, 0, 255).astype(np.uint8)

    # Compute Farneback optical flow
    flow = cv2.calcOpticalFlowFarneback(
        p_prev_norm,
        p_curr_norm,
        None,
        pyr_scale=0.5,
        levels=3,
        winsize=15,
        iterations=3,
        poly_n=5,
        poly_sigma=1.2,
        flags=0
    )  # flow shape: (ny, nx, 2) with (dx, dy)

    dx = flow[..., 0]  # Eastward displacement in pixels
    dy = flow[..., 1]  # Southward displacement in pixels (+y is row index increasing southward)

    # Convert to physical speed (km/h)
    # 1 pixel = grid_res_deg * 111 km
    km_per_pixel = grid_res_deg * KM_PER_DEGREE
    speed_pixels_per_step = np.sqrt(dx ** 2 + dy ** 2)
    speed_kmh = (speed_pixels_per_step * km_per_pixel) / time_step_hours

    # Mask for active rain pixels (where motion is meteorologically significant)
    active_mask = (frame_curr >= MIN_PRECIP_THRESHOLD_MM_H) | (frame_prev >= MIN_PRECIP_THRESHOLD_MM_H)

    if np.any(active_mask):
        mean_dx = float(np.median(dx[active_mask]))
        mean_dy = float(np.median(dy[active_mask]))
        mean_speed = float(np.median(speed_kmh[active_mask]))
    else:
        mean_dx = 0.0
        mean_dy = 0.0
        mean_speed = 0.0

    # Compass heading: 0=N, 90=E, 180=S, 270=W (moving toward)
    # Eastward vector: u = mean_dx
    # Northward vector: v_north = -mean_dy (since +y is South in matrix indexing)
    heading_rad = np.arctan2(mean_dx, -mean_dy)
    mean_heading = float((np.degrees(heading_rad) + 360.0) % 360.0)

    return flow, speed_kmh, mean_speed, mean_heading
