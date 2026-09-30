"""
pipeline/shared/geo.py - Geographic coordinates, grid geometry, and spatial helpers.
Compliant with PRD_00 §7, §8 and PRD_A Phase A6.
Co-owned with Person B (Nowcasting).
"""
import math
from typing import Tuple, List
import numpy as np

from pipeline.shared.config import BBOX, GRID_RES_DEG

EARTH_RADIUS_KM = 6371.0


def make_grid_coords(bbox: List[float] = BBOX, res_deg: float = GRID_RES_DEG) -> Tuple[np.ndarray, np.ndarray]:
    """
    Construct 1D lat and lon arrays for grid cell centers.
    Convention (PRD_00 §7):
    - Row 0 = North, lat descending.
    - Col 0 = West, lon ascending.
    """
    west, south, east, north = bbox
    # Pixel centers
    lats = np.arange(north - res_deg / 2.0, south, -res_deg)
    lons = np.arange(west + res_deg / 2.0, east, res_deg)
    return lats, lons


def latlon_to_pixel(lat: float, lon: float, bbox: List[float] = BBOX, res_deg: float = GRID_RES_DEG) -> Tuple[int, int]:
    """
    Convert geographic latitude and longitude to [row, col] pixel indices.
    Row 0 is northern boundary (descending), Col 0 is western boundary (ascending).
    Clamped to grid bounds.
    """
    west, south, east, north = bbox
    ny = int(round((north - south) / res_deg))
    nx = int(round((east - west) / res_deg))

    row = int(math.floor((north - lat) / res_deg))
    col = int(math.floor((lon - west) / res_deg))

    # Clamp
    row = max(0, min(ny - 1, row))
    col = max(0, min(nx - 1, col))
    return row, col


def pixel_to_latlon(row: int, col: int, bbox: List[float] = BBOX, res_deg: float = GRID_RES_DEG) -> Tuple[float, float]:
    """
    Convert [row, col] pixel indices to cell center (lat, lon).
    """
    west, south, east, north = bbox
    lat_center = north - (row + 0.5) * res_deg
    lon_center = west + (col + 0.5) * res_deg
    return round(lat_center, 4), round(lon_center, 4)


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Great-circle distance between two points on Earth in kilometres.
    Radius = 6371 km.
    """
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (math.sin(dphi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c


def calculate_bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Compass heading (0-360 degrees, clockwise, 0=N, 90=E) that storm moves TOWARD.
    """
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dlambda = math.radians(lon2 - lon1)

    y = math.sin(dlambda) * math.cos(phi2)
    x = (math.cos(phi1) * math.sin(phi2) -
         math.sin(phi1) * math.cos(phi2) * math.cos(dlambda))

    bearing = math.degrees(math.atan2(y, x))
    return (bearing + 360.0) % 360.0


def extract_3x3_neighborhood_max(grid_2d: np.ndarray, row: int, col: int) -> float:
    """
    PRD_00 §7: 'Rain at a point' = max over 3x3 pixel block centered on point's pixel.
    """
    ny, nx = grid_2d.shape
    r_min = max(0, row - 1)
    r_max = min(ny, row + 2)
    c_min = max(0, col - 1)
    c_max = min(nx, col + 2)
    sub = grid_2d[r_min:r_max, c_min:c_max]
    return float(np.nanmax(sub)) if sub.size > 0 else 0.0
