"""
pipeline/raw_ingest/approve_gesdisc.py - Authorize GES DISC Application & EULA on NASA Earthdata Login.
"""
import os
import re
import requests
from dotenv import load_dotenv

load_dotenv()

username = os.getenv("EARTHDATA_USERNAME")
password = os.getenv("EARTHDATA_PASSWORD")
assert username and password, "Earthdata credentials missing in .env"

app_url = "https://urs.earthdata.nasa.gov/approve_app?client_id=e2WVk8Pw6weeLUKZYOxvTQ"

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
})

print(f"1. Fetching login / approve page: {app_url}...")
res1 = session.get(app_url, allow_redirects=True)
print(f"   Current URL: {res1.url} (Status: {res1.status_code})")

# Look for authenticity_token
token_match = re.search(r'name=["\']authenticity_token["\']\s+value=["\']([^"\']+)["\']', res1.text)
assert token_match, "Could not find authenticity token in response"
csrf_token = token_match.group(1)

# If at login page, submit login form
if "/login" in res1.url or 'action="/login"' in res1.text:
    print(f"2. Submitting login credentials for {username}...")
    login_payload = {
        "authenticity_token": csrf_token,
        "username": username,
        "password": password,
        "client_id": "e2WVk8Pw6weeLUKZYOxvTQ",
        "redirect_uri": app_url,
        "commit": "Log in",
        "stay_in": "1"
    }
    res2 = session.post("https://urs.earthdata.nasa.gov/login", data=login_payload, allow_redirects=True)
    print(f"   Post-login URL: {res2.url} (Status: {res2.status_code})")
    content = res2.text
else:
    content = res1.text
    res2 = res1

# Check for approval form
print("3. Submitting EULA & Application Approval...")
form_match = re.search(r'<form[^>]*action=["\']/approve_app["\'][^>]*>(.*?)</form>', content, re.DOTALL)
if form_match:
    form_html = form_match.group(1)
    new_token_match = re.search(r'name=["\']authenticity_token["\']\s+value=["\']([^"\']+)["\']', form_html)
    auth_token = new_token_match.group(1) if new_token_match else csrf_token

    approval_payload = {
        "authenticity_token": auth_token,
        "allow_auth_app_emails": "1",
        "agreement": "1",
        "app_uid": "nasa_gesdisc_data_archive",
        "redirect_uri": app_url,
        "eulas": "",
        "authorize": "Agree"
    }
    res3 = session.post("https://urs.earthdata.nasa.gov/approve_app", data=approval_payload, allow_redirects=True)
    print(f"   Approval response URL: {res3.url} (Status: {res3.status_code})")
    if "authorized" in res3.text.lower() or "success" in res3.text.lower() or res3.status_code == 200:
        print("🎉 Successfully submitted GES DISC authorization and EULA agreement!")
else:
    print("ℹ️ No approve_app form found — account may already be authorized.")

print("Done.")
