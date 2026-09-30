from dotenv import load_dotenv
load_dotenv()
import earthaccess

try:
    auth = earthaccess.login(strategy="environment")  # reads EARTHDATA_USERNAME/PASSWORD from env
    assert auth.authenticated, "Earthdata login failed: authentication flag is false"
    print("Earthdata login OK")
except Exception as e:
    # Print error reason without exposing sensitive values
    err_msg = str(e)
    print(f"Earthdata login failed: {err_msg}")
    raise SystemExit(1)
