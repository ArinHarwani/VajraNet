import os
import sys
import json
import argparse
from datetime import datetime, timezone
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from dotenv import load_dotenv

load_dotenv()
import earthaccess

from pipeline.shared.config import CANDIDATE_DATES

RAW_IMERG_DIR = Path("pipeline/data/RAW/imerg")
LOG_FILE = RAW_IMERG_DIR / "download_log.jsonl"


def get_downloaded_files(target_dir: Path):
    """Return dict of filename -> size for files with size > 0."""
    if not target_dir.exists():
        return {}
    return {
        f.name: f.stat().st_size
        for f in target_dir.glob("*.HDF5")
        if f.is_file() and f.stat().st_size > 0
    }


def download_imerg_for_date(date_str: str, force: bool = False):
    """
    Search and download GPM_3IMERGHHE (V07) granules for a single UTC day.
    Saves to pipeline/data/RAW/imerg/<date_str>/.
    """
    print(f"\n==================================================")
    print(f"[INGEST] NASA GPM IMERG: {date_str} (UTC)")
    print(f"==================================================")

    # Ensure output directory exists
    date_dir = RAW_IMERG_DIR / date_str
    date_dir.mkdir(parents=True, exist_ok=True)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

    # 1. Earthdata Login
    print("[AUTH] Authenticating with NASA Earthdata...")
    auth = earthaccess.login(strategy="environment")
    if not auth.authenticated:
        raise RuntimeError("Earthdata authentication failed. Check credentials in root .env.")

    # 2. Search Granules
    temporal_range = (f"{date_str} 00:00:00", f"{date_str} 23:59:59")
    print(f"[SEARCH] Querying GPM_3IMERGHHE (V07) for {temporal_range}...")
    granules = earthaccess.search_data(
        short_name="GPM_3IMERGHHE",
        version="07",
        temporal=temporal_range
    )
    print(f"[SEARCH] Found {len(granules)} granules for {date_str}.")

    if not granules:
        print(f"[WARN] Zero granules found for {date_str}!")
        return 0, 0, []

    # 3. Check already existing files
    existing_files = get_downloaded_files(date_dir)
    print(f"[LOCAL] Existing valid granules in {date_dir}: {len(existing_files)}")

    to_download = []
    for g in granules:
        granule_ur = g.get("umm", {}).get("GranuleUR", "")
        filename = granule_ur.split(":")[-1] if ":" in granule_ur else granule_ur
        if not filename.endswith(".HDF5"):
            filename = f"{filename}.HDF5"

        if not force and filename in existing_files and existing_files[filename] > 0:
            continue
        to_download.append(g)

    downloaded_paths = []
    if to_download:
        print(f"[DOWNLOAD] Downloading {len(to_download)} new granules to {date_dir}...")
        downloaded = earthaccess.download(to_download, str(date_dir))
        downloaded_paths = [str(p) for p in downloaded]
    else:
        print(f"[OK] All {len(existing_files)} granules already exist. Skipping download.")

    # 4. Inventory total files and sizes
    all_files = get_downloaded_files(date_dir)
    total_bytes = sum(all_files.values())
    total_mb = total_bytes / (1024 * 1024)

    print(f"\n[SUMMARY] Ingest for {date_str}:")
    print(f"   - Total files present: {len(all_files)}")
    print(f"   - Total size: {total_mb:.2f} MB")

    # 5. Log to download_log.jsonl
    log_entry = {
        "date": date_str,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "granules_found": len(granules),
        "granules_present": len(all_files),
        "total_bytes": total_bytes,
        "total_mb": round(total_mb, 2),
        "files": sorted(list(all_files.keys()))
    }
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(log_entry) + "\n")

    return len(granules), len(all_files), all_files


def main():
    parser = argparse.ArgumentParser(description="Download NASA GPM IMERG Half-Hourly Precipitation Data.")
    parser.add_argument("--date", type=str, help="Specific date to download (YYYY-MM-DD)")
    parser.add_argument("--all", action="store_true", help="Download all candidate dates from config.py")
    parser.add_argument("--force", action="store_true", help="Force re-download even if files exist")
    args = parser.parse_args()

    if args.date:
        download_imerg_for_date(args.date, force=args.force)
    elif args.all:
        for item in CANDIDATE_DATES:
            download_imerg_for_date(item["date"], force=args.force)
    else:
        # Default: PRD_A Phase A3 requires testing with exactly ONE date first
        first_date = CANDIDATE_DATES[0]["date"]
        print(f"Running single-date test for initial validation: {first_date}")
        download_imerg_for_date(first_date, force=args.force)


if __name__ == "__main__":
    main()
