"""
nowcast/engine/ensemble.py - Stochastic ensemble nowcasting (20 members, S-PROG cascade).
Compliant with PRD_00 §7, §8 and PRD_B ML Nowcasting specifications.
"""
from typing import Dict, List, Tuple
import numpy as np
from scipy.ndimage import gaussian_filter

from nowcast.engine.extrapolation import advect_field

DEFAULT_LEADS_MIN = [30, 60, 90, 120, 150, 180]
DEFAULT_ENSEMBLE_MEMBERS = 20
DEFAULT_SEED = 42
CONVECTIVE_EVENT_THR_MM_H = 5.0


def generate_ensemble_nowcast(
    frame_curr: np.ndarray,
    flow: np.ndarray,
    leads_min: List[int] = DEFAULT_LEADS_MIN,
    n_members: int = DEFAULT_ENSEMBLE_MEMBERS,
    threshold_mm_h: float = CONVECTIVE_EVENT_THR_MM_H,
    seed: int = DEFAULT_SEED
) -> Dict[int, Dict[str, np.ndarray]]:
    """
    Generate stochastic ensemble nowcast across leads.
    Returns:
        dict of lead_min -> {
            "mean": (ny, nx) float32 ensemble mean rain rate (mm/h),
            "prob": (ny, nx) float32 probability (0.0 to 1.0) of rain >= threshold_mm_h,
            "members": (n_members, ny, nx) float32 all members
        }
    """
    rng = np.random.RandomState(seed)
    ny, nx = frame_curr.shape

    results = {}

    for lead in leads_min:
        step_mult = float(lead) / 30.0
        # Lead-dependent uncertainty increases with lead time
        lead_factor = np.sqrt(step_mult)

        members = []
        for m in range(n_members):
            # 1. Motion field perturbation (velocity dispersion)
            # Jitter velocity angle and magnitude
            vel_jitter_mag = rng.normal(1.0, 0.12 * lead_factor)
            vel_jitter_angle_deg = rng.normal(0.0, 8.0 * lead_factor)
            rad = np.radians(vel_jitter_angle_deg)
            cos_a, sin_a = np.cos(rad), np.sin(rad)

            # Rotated and scaled flow
            flow_m = np.zeros_like(flow)
            u = flow[..., 0] * vel_jitter_mag
            v = flow[..., 1] * vel_jitter_mag
            flow_m[..., 0] = u * cos_a - v * sin_a
            flow_m[..., 1] = u * sin_a + v * cos_a

            # 2. Advect field
            advected = advect_field(frame_curr, flow_m, step_multiplier=step_mult)

            # 3. Stochastic cascade perturbation (spatial noise representing cell growth/decay)
            raw_noise = rng.normal(0.0, 1.0, size=(ny, nx))
            # Correlate noise spatially with scale ~3-5 pixels (~30-50 km cell size)
            smooth_noise = gaussian_filter(raw_noise, sigma=3.5)
            # Normalize noise to zero mean, unit variance
            if np.std(smooth_noise) > 1e-6:
                smooth_noise = (smooth_noise - np.mean(smooth_noise)) / np.std(smooth_noise)

            # Amplitude scales with rain intensity and lead time
            noise_amplitude = 0.25 * np.sqrt(step_mult) * np.sqrt(advected + 0.1)
            perturbed = advected + noise_amplitude * smooth_noise

            # Convective decay damping factor over longer leads
            decay = np.exp(-0.04 * (step_mult - 1.0))
            member_rain = np.maximum(0.0, perturbed * decay)
            members.append(member_rain.astype(np.float32))

        members_arr = np.stack(members, axis=0)  # (n_members, ny, nx)

        # Ensemble mean
        mean_grid = np.mean(members_arr, axis=0).astype(np.float32)

        # Probability P(rain >= threshold)
        prob_grid = np.mean((members_arr >= threshold_mm_h).astype(np.float32), axis=0).astype(np.float32)

        results[lead] = {
            "mean": mean_grid,
            "prob": prob_grid,
            "members": members_arr
        }

    return results
