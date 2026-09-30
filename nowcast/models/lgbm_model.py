"""
nowcast/models/lgbm_model.py - LightGBM Thunderstorm & Convective Nowcast Classifier with SHAP Explainability.
Compliant with PRD_00 §3, §8 and PRD_B ML Nowcasting specifications.
"""
from typing import Dict, List, Tuple, Any
import numpy as np
import lightgbm as lgb
import shap

from pipeline.shared.geo import (
    latlon_to_pixel,
    extract_3x3_neighborhood_max,
    haversine_distance_km
)

FEATURE_NAMES = [
    "rain_current_3x3",
    "rain_lag30_3x3",
    "rain_tendency_30m",
    "advected_rain_lead",
    "storm_speed_kmh",
    "storm_heading_deg",
    "distance_to_core_km",
    "lead_minutes",
    "cape",
    "t2m",
    "rh",
    "cloud"
]


def extract_point_features(
    lat: float,
    lon: float,
    rain_current: np.ndarray,
    rain_lag30: np.ndarray,
    advected_rain_grid: np.ndarray,
    flow: np.ndarray,
    storm_speed_kmh: float,
    storm_heading_deg: float,
    lead_minutes: int,
    cape_grid: np.ndarray,
    t2m_grid: np.ndarray,
    rh_grid: np.ndarray,
    cloud_grid: np.ndarray,
    bbox: List[float] = [85.5, 21.0, 90.5, 26.0],
    res_deg: float = 0.1
) -> np.ndarray:
    """
    Extract 12 meteorological and kinematic features for a point at lead_minutes.
    Returns 1D feature vector of shape (12,).
    """
    row, col = latlon_to_pixel(lat, lon, bbox=bbox, res_deg=res_deg)

    # 1. Observational features
    rain_now = extract_3x3_neighborhood_max(rain_current, row, col)
    rain_prev = extract_3x3_neighborhood_max(rain_lag30, row, col)
    rain_tendency = rain_now - rain_prev

    # 2. Extrapolation feature
    advected_rain = extract_3x3_neighborhood_max(advected_rain_grid, row, col)

    # 3. Distance to nearest intense convective core (>= 10 mm/h)
    core_coords = np.argwhere(rain_current >= 10.0)
    if len(core_coords) > 0:
        west, south, east, north = bbox
        core_lats = north - (core_coords[:, 0] + 0.5) * res_deg
        core_lons = west + (core_coords[:, 1] + 0.5) * res_deg
        dists = [haversine_distance_km(lat, lon, clat, clon) for clat, clon in zip(core_lats, core_lons)]
        min_dist_km = min(dists)
    else:
        min_dist_km = 150.0  # Max default distance

    # 4. Predictors at station pixel
    cape_val = float(cape_grid[row, col])
    t2m_val = float(t2m_grid[row, col])
    rh_val = float(rh_grid[row, col])
    cloud_val = float(cloud_grid[row, col])

    features = np.array([
        rain_now,
        rain_prev,
        rain_tendency,
        advected_rain,
        storm_speed_kmh,
        storm_heading_deg,
        min_dist_km,
        float(lead_minutes),
        cape_val,
        t2m_val,
        rh_val,
        cloud_val
    ], dtype=np.float32)

    return features


class ConvectiveNowcastClassifier:
    """
    LightGBM classifier predicting P(rain >= 5 mm/h) with tree SHAP explainability.
    """
    def __init__(self, random_state: int = 42):
        self.model = lgb.LGBMClassifier(
            n_estimators=120,
            learning_rate=0.04,
            max_depth=5,
            num_leaves=24,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=random_state,
            verbose=-1
        )
        self.explainer = None
        self.is_trained = False

    def fit(self, X: np.ndarray, y: np.ndarray):
        """Train LightGBM model and build SHAP TreeExplainer."""
        self.model.fit(X, y)
        self.explainer = shap.TreeExplainer(self.model)
        self.is_trained = True

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Predict probability of class 1 (convective storm >= 5 mm/h)."""
        if not self.is_trained:
            raise RuntimeError("Model must be fitted before calling predict_proba.")
        probs = self.model.predict_proba(X)
        return probs[:, 1]

    def explain_point(self, feature_vector: np.ndarray) -> List[Dict[str, Any]]:
        """
        Generate human-interpretable feature attributions for a single prediction.
        Returns list of top factors sorted by absolute SHAP impact.
        """
        if self.explainer is None:
            raise RuntimeError("Explainer not initialized.")
        x_2d = feature_vector.reshape(1, -1)
        shap_values = self.explainer.shap_values(x_2d)
        # For binary classification, shap_values can be array or list
        vals = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0]

        attributions = []
        for name, val, f_val in zip(FEATURE_NAMES, vals, feature_vector):
            attributions.append({
                "feature": name,
                "value": round(float(f_val), 2),
                "shap_impact": round(float(val), 4),
                "description": self._format_description(name, float(f_val), float(val))
            })

        # Sort by absolute SHAP impact descending
        attributions.sort(key=lambda x: abs(x["shap_impact"]), reverse=True)
        return attributions

    def _format_description(self, feature: str, val: float, impact: float) -> str:
        direction = "increases" if impact > 0 else "reduces"
        if feature == "cape":
            return f"CAPE at {val:.0f} J/kg {direction} thunderstorm onset probability"
        elif feature == "advected_rain_lead":
            return f"Extrapolated storm cell arriving with {val:.1f} mm/h rain rate"
        elif feature == "distance_to_core_km":
            return f"Convective squall core located {val:.0f} km upstream"
        elif feature == "storm_speed_kmh":
            return f"Storm tracking at {val:.0f} km/h toward location"
        elif feature == "rain_tendency_30m":
            return f"Cell intensification tendency of {val:+.1f} mm/h over past 30 min"
        elif feature == "rh":
            return f"Near-surface relative humidity at {val:.0f}%"
        else:
            return f"{feature} = {val:.1f} ({direction} risk)"
