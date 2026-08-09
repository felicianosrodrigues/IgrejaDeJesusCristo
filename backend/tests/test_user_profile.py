import os
import sys
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "church_test")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("ADMIN_EMAIL", "admin@example.com")
os.environ.setdefault("ADMIN_PASSWORD", "senha123")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")

import server


def test_public_user_includes_profile_fields():
    user = {
        "id": "u1",
        "name": "Maria",
        "email": "maria@example.com",
        "role": "member",
        "created_at": "2024-01-01T00:00:00",
        "address": "Rua das Flores, 123",
        "birthday": "1990-05-20",
    }

    result = server.public_user(user)

    assert result["address"] == "Rua das Flores, 123"
    assert result["birthday"] == "1990-05-20"
