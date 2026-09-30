"""
pipeline/shared/geo.py - Geometry and coordinate utilities for Person A and Person B
Compliant with PRD_00 §7.
"""

import math

EARTH_RADIUS_KM = 6371.0

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance between two coordinates in kilometers."""
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    rlat1 = math.radians(lat1)
    rlat2 = math.radians(lat2)

    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(rlat1) * math.cos(rlat2) * math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c

def heading_to_from_deg(heading_deg: float) -> float:
    """
    heading_deg: compass bearing storm moves TOWARD (0=N, 90=E).
    from_deg = (heading_deg + 180) % 360 (compass bearing storm moves FROM).
    """
    return (heading_deg + 180.0) % 360.0

def get_grid_indices(lat: float, lon: float, bbox: list[float], res_deg: float = 0.1) -> tuple[int, int]:
    """
    Computes grid [row, col] for a coordinate within bbox [west, south, east, north].
    PRD_00 §7: row 0 = North (lat descending), col 0 = West (lon ascending).
    """
    west, south, east, north = bbox
    row = int(math.floor((north - lat) / res_deg))
    col = int(math.floor((lon - west) / res_deg))
    return (row, col)
