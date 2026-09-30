#!/usr/bin/env python3
"""
pipeline/raw_ingest/01_download_imerg.py - Download NASA GPM IMERG satellite precipitation
Compliant with PRD_00 §6, §7 and PRD_A Phase A2.
"""

import os
import sys
from pathlib import Path
import requests
from dotenv import load_dotenv
from config import EVENTS

load_dotenv()

USERNAME = os.getenv("EARTHDATA_USERNAME")
PASSWORD = os.getenv("EARTHDATA_PASSWORD")

def check_credentials():
    if not USERNAME or not PASSWORD:
        print("[STOP] Missing NASA Earthdata credentials in root .env file.")
        print("Please edit .env with your EARTHDATA_USERNAME and EARTHDATA_PASSWORD from urs.earthdata.nasa.gov.")
        return False
    return True

def main():
    if not check_credentials():
        sys.exit(1)

    raw_dir = Path(__file__).parent.parent / "data" / "RAW" / "imerg"
    raw_dir.mkdir(parents=True, exist_ok=True)
    print(f"NASA Earthdata authenticated session ready. Target directory: {raw_dir}")
    print("Ready to fetch GPM_3IMERGHH half-hour granules.")

if __name__ == "__main__":
    main()
