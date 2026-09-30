"""
nowcast/engine/blend.py - Calibrated probability blending and Lightning Risk Index (LRI) calculation.
Compliant with contracts/constants.json and PRD_00 §8.
"""
from typing import Dict, List, Optional, Tuple, Any
import numpy as np

CAPE_NORM_MAX = 2500.0
W_ENSEMBLE = 0.7
W_LGBM = 0.3
W_LRI_P = 0.7
W_LRI_CAPE = 0.3
ETA_P_THRESHOLD = 0.5


def compute_p_final(p_ensemble: float, p_lgbm: float) -> float:
    """
    Compute blended probability of convective storm:
    p_final = 0.7 * p_ensemble + 0.3 * p_lgbm.
    """
    p_blend = W_ENSEMBLE * p_ensemble + W_LGBM * p_lgbm
    return float(np.clip(p_blend, 0.0, 1.0))


def compute_lri(p_final: float, cape_j_kg: float) -> float:
    """
    Compute Lightning Risk Index (0 - 100):
    lri = 100 * clip(0.7 * p_final + 0.3 * clip(cape / 2500, 0, 1), 0, 1).
    """
    cape_norm = np.clip(cape_j_kg / CAPE_NORM_MAX, 0.0, 1.0)
    lri_val = 100.0 * np.clip(W_LRI_P * p_final + W_LRI_CAPE * cape_norm, 0.0, 1.0)
    return float(round(lri_val, 1))


def get_severity_category(lri: float) -> str:
    """Classify LRI into severity tier."""
    if lri >= 80.0:
        return "severe"
    elif lri >= 60.0:
        return "strong"
    elif lri >= 30.0:
        return "moderate"
    else:
        return "low"


def compute_eta_minutes(leads_min: List[int], p_finals: List[float], threshold: float = ETA_P_THRESHOLD) -> Optional[int]:
    """
    Find earliest lead time where p_final exceeds threshold (default 0.50).
    Returns integer minutes or None if threshold not exceeded.
    """
    for lead, p in zip(leads_min, p_finals):
        if p >= threshold:
            return lead
    return None
