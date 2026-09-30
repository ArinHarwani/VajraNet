"""
pipeline/tests/test_config.py - Tests for shared pipeline configuration.
Compliant with PRD_A Phase A2.
"""
from datetime import datetime
from pipeline.shared.config import BBOX, CANDIDATE_DATES, GRID_RES_DEG, TIMEZONE_LOCAL


def test_bbox_structure():
    assert isinstance(BBOX, (list, tuple)), "BBOX must be a list or tuple"
    assert len(BBOX) == 4, "BBOX must have exactly 4 values: [west, south, east, north]"
    west, south, east, north = BBOX
    for val in (west, south, east, north):
        assert isinstance(val, (int, float)), f"BBOX coordinate {val} must be numeric"
    assert west < east, f"west ({west}) must be strictly less than east ({east})"
    assert south < north, f"south ({south}) must be strictly less than north ({north})"


def test_candidate_dates():
    assert isinstance(CANDIDATE_DATES, list), "CANDIDATE_DATES must be a list"
    assert len(CANDIDATE_DATES) >= 6, "Must have at least 6 candidate dates"
    
    has_storm = False
    has_null = False

    for item in CANDIDATE_DATES:
        assert "date" in item, "Item must contain 'date'"
        assert "source_url" in item, "Item must contain 'source_url'"
        assert "label" in item, "Item must contain 'label'"
        assert "expected_no_storm" in item, "Item must contain 'expected_no_storm'"

        # Verify date format YYYY-MM-DD
        dt = datetime.strptime(item["date"], "%Y-%m-%d")
        assert dt.year >= 2020, "Date should be within recent observational period"

        # Verify source_url starts with https://
        assert item["source_url"].startswith("https://"), (
            f"source_url '{item['source_url']}' must start with https://"
        )

        if item["expected_no_storm"]:
            has_null = True
        else:
            has_storm = True

    assert has_storm, "Must contain at least one convective storm candidate"
    assert has_null, "Must contain at least one null control candidate"


def test_grid_and_timezone():
    assert GRID_RES_DEG > 0
    assert TIMEZONE_LOCAL == "Asia/Kolkata"
