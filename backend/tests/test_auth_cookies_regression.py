"""Regression tests for auth cookie changes (_cookie_kwargs + /auth/refresh).

Env preview: FRONTEND_URL is HTTPS preview URL → cookies must remain
Secure + SameSite=None (production behavior unchanged after the change).
"""
import os
import uuid
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL", "https://prayer-wall-4.preview.emergentagent.com"
).rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "felicianosrodrigues@gmail.com"
ADMIN_PASSWORD = "Igreja@2026"


def _cookie_attrs(resp, name):
    """Parse Set-Cookie header for a given cookie name and return raw string."""
    # requests exposes raw headers with getlist on urllib3 response
    raw = resp.raw.headers.getlist("Set-Cookie") if hasattr(resp.raw.headers, "getlist") else []
    for c in raw:
        if c.startswith(f"{name}="):
            return c
    return ""


def test_login_sets_secure_samesite_none_cookies():
    """Preview HTTPS → cookies must be Secure and SameSite=None (unchanged prod behavior)."""
    r = requests.post(f"{API}/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, r.text
    access = _cookie_attrs(r, "access_token")
    refresh = _cookie_attrs(r, "refresh_token")
    assert access, f"access_token cookie not set; headers={r.headers}"
    assert refresh, "refresh_token cookie not set"
    # Production cookies must be Secure + SameSite=None + HttpOnly
    for raw in (access, refresh):
        low = raw.lower()
        assert "httponly" in low, f"HttpOnly missing: {raw}"
        assert "secure" in low, f"Secure missing (preview must be secure=True): {raw}"
        assert "samesite=none" in low, f"SameSite=None missing: {raw}"
        assert "path=/" in low, f"Path=/ missing: {raw}"


def test_me_with_cookies_after_login():
    s = requests.Session()
    r = s.post(f"{API}/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200
    assert "access_token" in s.cookies
    assert "refresh_token" in s.cookies
    r = s.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == ADMIN_EMAIL
    assert body["role"] == "admin"


def test_refresh_endpoint_with_refresh_cookie():
    """POST /api/auth/refresh should renew access_token given refresh cookie only."""
    s = requests.Session()
    r = s.post(f"{API}/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200
    old_access = s.cookies.get("access_token")
    refresh_cookie = s.cookies.get("refresh_token")
    assert refresh_cookie

    # Simulate expired/missing access token: keep only refresh_token
    s2 = requests.Session()
    s2.cookies.set("refresh_token", refresh_cookie,
                   domain=BASE_URL.replace("https://", "").replace("http://", ""))
    r = s2.post(f"{API}/auth/refresh", timeout=15)
    assert r.status_code == 200, f"refresh failed: {r.status_code} {r.text}"
    # New access_token cookie must be set with correct attrs
    raw = _cookie_attrs(r, "access_token")
    assert raw, "refresh did not set access_token"
    low = raw.lower()
    assert "httponly" in low
    assert "secure" in low
    assert "samesite=none" in low
    # And the returned user should be admin
    assert r.json()["email"] == ADMIN_EMAIL

    # After refresh, /auth/me should work
    new_access = None
    for c in r.raw.headers.getlist("Set-Cookie"):
        if c.startswith("access_token="):
            new_access = c.split(";")[0].split("=", 1)[1]
    assert new_access
    s2.cookies.set("access_token", new_access,
                   domain=BASE_URL.replace("https://", "").replace("http://", ""))
    r = s2.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 200


def test_refresh_without_cookie_returns_401():
    r = requests.post(f"{API}/auth/refresh", timeout=10)
    assert r.status_code == 401


def test_register_sets_cookies_and_me_works():
    tag = uuid.uuid4().hex[:8]
    payload = {"name": f"TEST Reg {tag}",
               "email": f"test_reg_{tag}@example.com", "password": "senha123"}
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    assert "access_token" in s.cookies
    assert "refresh_token" in s.cookies
    raw = _cookie_attrs(r, "access_token")
    low = raw.lower()
    assert "secure" in low and "samesite=none" in low and "httponly" in low
    r = s.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 200
    assert r.json()["role"] == "member"


def test_logout_clears_and_me_401():
    s = requests.Session()
    r = s.post(f"{API}/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200
    r = s.post(f"{API}/auth/logout", timeout=10)
    assert r.status_code == 200
    s.cookies.clear()
    r = s.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 401
