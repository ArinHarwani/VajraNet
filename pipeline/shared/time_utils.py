"""
pipeline/shared/time_utils.py - Time utilities for Person A and Person B (Python)
Compliant with PRD_00 §7.
"""

from datetime import datetime, timedelta, timezone

def parse_iso_z(iso_str: str) -> datetime:
    """Parses ISO-8601 UTC string (e.g. '2025-05-15T09:30:00Z')."""
    return datetime.fromisoformat(iso_str.replace("Z", "+00:00"))

def to_iso_z(dt: datetime) -> str:
    """Formats datetime to standard ISO-8601 UTC string with Z."""
    dt_utc = dt.astimezone(timezone.utc)
    return dt_utc.strftime("%Y-%m-%dT%H:%M:%SZ")

def compute_valid_start(issue_iso: str, lead_min: int) -> str:
    """
    Computes valid_start for lead L minutes issued at T:
    valid_start = T + L - 30min (PRD_00 §7)
    """
    dt_issue = parse_iso_z(issue_iso)
    dt_valid = dt_issue + timedelta(minutes=lead_min - 30)
    return to_iso_z(dt_valid)

def format_utc_to_ist(utc_iso: str) -> str:
    """Converts UTC ISO string to IST display label."""
    dt = parse_iso_z(utc_iso)
    dt_ist = dt + timedelta(hours=5, minutes=30)
    return dt_ist.strftime("%H:%M IST")
