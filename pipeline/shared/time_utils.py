"""
pipeline/shared/time_utils.py - Time handling, ISO-8601 UTC formatting, and IMERG issue/valid time logic.
Compliant with PRD_00 §7 and PRD_A Phase A6.
Co-owned with Person B (Nowcasting).
"""
import re
from datetime import datetime, timedelta, timezone

# IST is UTC+05:30
IST_OFFSET = timezone(timedelta(hours=5, minutes=30), name="IST")


def parse_isoz(ts: str) -> datetime:
    """Parse ISO-8601 string with 'Z' or offset into UTC timezone-aware datetime."""
    clean = ts.replace("Z", "+00:00")
    dt = datetime.fromisoformat(clean)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt


def format_isoz(dt: datetime) -> str:
    """Format datetime into ISO-8601 string with 'Z' suffix."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def imerg_filename_to_start_utc(filename: str) -> datetime:
    """
    Extract frame start timestamp from standard NASA IMERG filename:
    e.g. '3B-HHR-E.MS.MRG.3IMERG.20240507-S140000-E142959.0840.V07B.HDF5' -> 2024-05-07 14:00:00 UTC
    """
    match = re.search(r"(\d{8})-S(\d{6})", filename)
    if not match:
        raise ValueError(f"Could not parse IMERG start timestamp from filename: {filename}")
    date_part, time_part = match.groups()
    dt = datetime.strptime(f"{date_part}{time_part}", "%Y%m%d%H%M%S")
    return dt.replace(tzinfo=timezone.utc)


def frame_coverage_interval(start_utc: datetime) -> tuple[datetime, datetime]:
    """
    PRD_00 §7: An IMERG half-hour frame with start time S covers [S, S+30min).
    """
    return start_utc, start_utc + timedelta(minutes=30)


def calculate_issue_time(last_frame_start_utc: datetime) -> datetime:
    """
    PRD_00 §7: Issue time T = the earliest moment a forecast could honestly be made
    = (last available frame's start) + 30min.
    """
    return last_frame_start_utc + timedelta(minutes=30)


def calculate_verification_frame_start(issue_time_t: datetime, lead_minutes: int) -> datetime:
    """
    PRD_00 §7: Forecast for lead L minutes, issued at T, verifies against observed frame with:
    valid_start = T + L - 30min.
    """
    return issue_time_t + timedelta(minutes=lead_minutes - 30)


def utc_to_ist(dt_utc: datetime) -> datetime:
    """Convert UTC datetime to Indian Standard Time (UTC+05:30) for display."""
    if dt_utc.tzinfo is None:
        dt_utc = dt_utc.replace(tzinfo=timezone.utc)
    return dt_utc.astimezone(IST_OFFSET)


def format_ist_display(dt: datetime) -> str:
    """Format datetime as IST display string, e.g. '19:30 IST'."""
    ist_dt = utc_to_ist(dt)
    return ist_dt.strftime("%H:%M IST")
