import asyncio

import server


class FakeUsersCollection:
    def __init__(self, user):
        self.user = user
        self.updated = None

    async def find_one(self, query, projection=None):
        if "email" in query:
            return self.user if query["email"] == self.user["email"] else None
        if "id" in query:
            return self.user if query["id"] == self.user["id"] else None
        return None

    async def update_one(self, query, update):
        self.updated = {"query": query, "update": update}
        return None


def test_forgot_password_updates_existing_user(monkeypatch):
    user = {"id": "u-1", "email": "membro@example.com", "password_hash": "old-hash"}
    fake_users = FakeUsersCollection(user)

    class FakeDB:
        users = fake_users

    monkeypatch.setattr(server, "db", FakeDB())

    result = asyncio.run(
        server.forgot_password(
            server.ForgotPasswordIn(email="membro@example.com", new_password="novaSenha123", confirm_password="novaSenha123")
        )
    )

    assert result == {"ok": True}
    assert fake_users.updated is not None
    assert server.verify_password("novaSenha123", fake_users.updated["update"]["$set"]["password_hash"])
