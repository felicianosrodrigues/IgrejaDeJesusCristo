"""Backend API tests for Church app (posts, events, contribuições, admin flows)."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://prayer-wall-4.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "felicianosrodrigues@gmail.com"
ADMIN_PASSWORD = "Igreja@2026"


def _new_member():
    tag = uuid.uuid4().hex[:8]
    return {
        "name": f"TEST Membro {tag}",
        "email": f"test_member_{tag}@example.com",
        "password": "senha123",
    }


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    body = r.json()
    assert body["role"] == "admin"
    return s


@pytest.fixture(scope="module")
def member_session():
    s = requests.Session()
    payload = _new_member()
    r = s.post(f"{API}/auth/register", json=payload, timeout=15)
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    body = r.json()
    assert body["email"] == payload["email"].lower()
    assert body["role"] == "member"
    s.member_email = payload["email"]
    return s


# ---------- Auth ----------
class TestAuth:
    def test_me_admin(self, admin_session):
        r = admin_session.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_login_wrong_password(self):
        # Use unique email to avoid brute-force lockout on admin
        tag = uuid.uuid4().hex[:6]
        # Register a throwaway user first
        u = {"name": f"TEST Wrong {tag}", "email": f"test_wrong_{tag}@ex.com", "password": "senha123"}
        r = requests.post(f"{API}/auth/register", json=u, timeout=10)
        assert r.status_code == 200
        r = requests.post(f"{API}/auth/login", json={"email": u["email"], "password": "errada!"}, timeout=10)
        assert r.status_code == 401

    def test_unauthenticated_me(self):
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401


# ---------- Posts ----------
class TestPosts:
    def test_prayer_flow(self, member_session, admin_session):
        # member submits prayer
        r = member_session.post(f"{API}/posts", json={
            "type": "prayer", "title": "TEST Oracao Titulo", "content": "Peço oração pelo meu trabalho urgente."})
        assert r.status_code == 200, r.text
        post = r.json()
        assert post["status"] == "pending"
        pid = post["id"]

        # not visible in feed
        r = requests.get(f"{API}/posts", params={"type": "prayer"}, timeout=10)
        assert r.status_code == 200
        assert not any(p["id"] == pid for p in r.json())

        # admin approves
        r = admin_session.post(f"{API}/admin/posts/{pid}/approve")
        assert r.status_code == 200

        # visible now
        r = requests.get(f"{API}/posts", params={"type": "prayer"}, timeout=10)
        assert any(p["id"] == pid for p in r.json())

        # pray toggle
        r = member_session.post(f"{API}/posts/{pid}/pray")
        assert r.status_code == 200
        assert r.json()["praying"] is True and r.json()["count"] == 1
        r = member_session.post(f"{API}/posts/{pid}/pray")
        assert r.json()["praying"] is False and r.json()["count"] == 0

    def test_testimony_flow(self, member_session, admin_session):
        r = member_session.post(f"{API}/posts", json={
            "type": "testimony", "title": "TEST Testemunho", "content": "Deus me abençoou grandemente esta semana."})
        assert r.status_code == 200
        tid = r.json()["id"]
        r = admin_session.post(f"{API}/admin/posts/{tid}/approve")
        assert r.status_code == 200
        r = requests.get(f"{API}/posts", params={"type": "testimony"}, timeout=10)
        assert any(p["id"] == tid for p in r.json())


# ---------- Events / Suggestions ----------
class TestEvents:
    def test_admin_create_event(self, admin_session):
        r = admin_session.post(f"{API}/admin/events", json={
            "title": "TEST Culto Especial", "description": "Descrição",
            "date": "2026-06-15", "time": "19:00", "location": "Templo Principal"})
        assert r.status_code == 200
        eid = r.json()["id"]
        r = requests.get(f"{API}/events", timeout=10)
        assert any(e["id"] == eid for e in r.json())

    def test_suggestion_flow(self, member_session, admin_session):
        r = member_session.post(f"{API}/suggestions", json={
            "title": "TEST Sugestao Retiro", "description": "Retiro espiritual",
            "proposed_date": "2026-07-20", "proposed_time": "08:00", "location": "Chácara"})
        assert r.status_code == 200
        sid = r.json()["id"]
        r = admin_session.post(f"{API}/admin/suggestions/{sid}/approve")
        assert r.status_code == 200
        r = requests.get(f"{API}/events", timeout=10)
        assert any(e["title"] == "TEST Sugestao Retiro" for e in r.json())


# ---------- Contributions ----------
class TestContributions:
    def test_contribution_flow(self, member_session, admin_session):
        r = member_session.post(f"{API}/contributions", json={
            "type": "dizimo", "amount": 150.5, "note": "TEST dízimo do mês", "contributed_at": "2026-01-10"})
        assert r.status_code == 200, r.text
        c = r.json()
        assert c["status"] == "registrada"
        cid = c["id"]

        r = member_session.get(f"{API}/contributions")
        assert r.status_code == 200
        assert any(x["id"] == cid for x in r.json())

        # admin confirm
        r = admin_session.post(f"{API}/admin/contributions/{cid}/confirm")
        assert r.status_code == 200

        r = member_session.get(f"{API}/contributions")
        found = next(x for x in r.json() if x["id"] == cid)
        assert found["status"] == "confirmada"


# ---------- Church info ----------
class TestChurchInfo:
    def test_update_church_info(self, admin_session, member_session):
        new_pix = f"test_pix_{uuid.uuid4().hex[:6]}@igreja.com"
        r = admin_session.put(f"{API}/admin/church-info", json={
            "church_name": "TEST Comunidade da Fé", "pix_key": new_pix,
            "bank_name": "Banco X", "agency": "0001", "account": "12345-6",
            "holder": "Igreja", "cnpj": "00.000.000/0001-00", "instructions": "TEST"})
        assert r.status_code == 200

        r = member_session.get(f"{API}/church-info")
        assert r.status_code == 200
        assert r.json()["pix_key"] == new_pix


# ---------- Access control ----------
class TestAccessControl:
    def test_member_cant_access_admin(self, member_session):
        r = member_session.get(f"{API}/admin/stats")
        assert r.status_code == 403

    def test_admin_stats(self, admin_session):
        r = admin_session.get(f"{API}/admin/stats")
        assert r.status_code == 200
        for k in ["members", "pending_posts", "events", "contributions_total"]:
            assert k in r.json()


# ---------- Logout ----------
class TestLogout:
    def test_logout_clears_cookie(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=10)
        assert r.status_code == 200
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 200
        r = s.post(f"{API}/auth/logout")
        assert r.status_code == 200
        s.cookies.clear()
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 401
