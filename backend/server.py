from dotenv import load_dotenv
load_dotenv()

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Literal, List

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
logger = logging.getLogger(__name__)


def utcnow():
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": utcnow() + timedelta(hours=8), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": utcnow() + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def _is_local() -> bool:
    return "localhost" in os.environ.get("FRONTEND_URL", "") or "127.0.0.1" in os.environ.get("FRONTEND_URL", "")


def _cookie_kwargs() -> dict:
    if _is_local():
        return {"httponly": True, "secure": False, "samesite": "lax", "path": "/"}
    return {"httponly": True, "secure": True, "samesite": "none", "path": "/"}


def set_auth_cookies(response: Response, user_id: str):
    response.set_cookie("access_token", create_access_token(user_id), max_age=8 * 3600, **_cookie_kwargs())
    response.set_cookie("refresh_token", create_refresh_token(user_id), max_age=7 * 86400, **_cookie_kwargs())


def public_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "created_at": user["created_at"],
        "address": user.get("address", ""),
        "birthday": user.get("birthday", ""),
    }


# ---------- Schemas ----------
class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class PostIn(BaseModel):
    type: Literal["prayer", "testimony"]
    title: str = Field(min_length=3, max_length=120)
    content: str = Field(min_length=5, max_length=2000)


class ContributionIn(BaseModel):
    type: Literal["dizimo", "oferta", "missoes", "outro"]
    amount: float = Field(gt=0, le=1000000)
    note: Optional[str] = Field(default="", max_length=500)
    contributed_at: Optional[str] = None


class EventIn(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: Optional[str] = Field(default="", max_length=1000)
    date: str
    time: str
    location: Optional[str] = Field(default="", max_length=200)


class SuggestionIn(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: Optional[str] = Field(default="", max_length=1000)
    proposed_date: str
    proposed_time: Optional[str] = ""
    location: Optional[str] = Field(default="", max_length=200)


class ChurchInfoIn(BaseModel):
    church_name: str = Field(max_length=120)
    pix_key: str = Field(max_length=200)
    bank_name: str = Field(max_length=120)
    agency: str = Field(max_length=30)
    account: str = Field(max_length=30)
    holder: str = Field(max_length=120)
    cnpj: str = Field(max_length=30)
    addresses: List[str] = Field(default_factory=list)
    instructions: Optional[str] = Field(default="", max_length=1000)
    videos: List[dict] = Field(default_factory=list)


class ProfileUpdateIn(BaseModel):
    address: Optional[str] = Field(default="", max_length=200)
    birthday: Optional[str] = Field(default="", max_length=20)


class AdminUserUpdateIn(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    email: Optional[EmailStr] = None
    role: Optional[Literal["member", "admin"]] = None
    address: Optional[str] = Field(default=None, max_length=200)
    birthday: Optional[str] = Field(default=None, max_length=20)


class AdminUserCreateIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    role: Literal["member", "admin"] = "member"
    address: Optional[str] = Field(default="", max_length=200)
    birthday: Optional[str] = Field(default="", max_length=20)


# ---------- Auth ----------
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(401, "Não autenticado")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token inválido")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "Usuário não encontrado")
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "admin":
        raise HTTPException(403, "Acesso restrito a administradores")
    return user


@api_router.post("/auth/register")
async def register(data: RegisterIn, response: Response):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Este email já está cadastrado")
    user = {"id": str(uuid.uuid4()), "name": data.name.strip(), "email": email,
            "password_hash": hash_password(data.password), "role": "member",
            "created_at": utcnow().isoformat()}
    await db.users.insert_one(user)
    set_auth_cookies(response, user["id"])
    return public_user(user)


@api_router.post("/auth/login")
async def login(data: LoginIn, request: Request, response: Response):
    email = data.email.lower()
    identifier = f"{request.client.host}:{email}"
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        locked_until = attempts.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > utcnow():
            raise HTTPException(429, "Muitas tentativas. Tente novamente em 15 minutos.")
        await db.login_attempts.delete_one({"identifier": identifier})
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": (utcnow() + timedelta(minutes=15)).isoformat()}},
            upsert=True)
        raise HTTPException(401, "Email ou senha incorretos")
    await db.login_attempts.delete_one({"identifier": identifier})
    set_auth_cookies(response, user["id"])
    return public_user(user)


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


@api_router.put("/auth/profile")
async def update_profile(data: ProfileUpdateIn, user: dict = Depends(get_current_user)):
    update_data = {}
    if data.address is not None:
        update_data["address"] = data.address.strip()
    if data.birthday is not None:
        update_data["birthday"] = data.birthday

    if update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})

    refreshed = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return public_user(refreshed)


@api_router.get("/admin/users")
async def admin_users(admin: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return [public_user(user) for user in users]


@api_router.post("/admin/users")
async def create_user_by_admin(data: AdminUserCreateIn, admin: dict = Depends(require_admin)):
    email = str(data.email).lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Este email já está cadastrado")

    user = {
        "id": str(uuid.uuid4()),
        "name": data.name.strip(),
        "email": email,
        "password_hash": hash_password(data.password),
        "role": data.role,
        "created_at": utcnow().isoformat(),
        "address": data.address.strip() if data.address else "",
        "birthday": data.birthday or "",
    }
    await db.users.insert_one(user)
    return public_user(user)


@api_router.put("/admin/users/{user_id}")
async def update_user_by_admin(user_id: str, data: AdminUserUpdateIn, admin: dict = Depends(require_admin)):
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name.strip()
    if data.email is not None:
        email = str(data.email).lower()
        existing = await db.users.find_one({"email": email, "id": {"$ne": user_id}})
        if existing:
            raise HTTPException(400, "Este email já está cadastrado")
        update_data["email"] = email
    if data.role is not None:
        update_data["role"] = data.role
    if data.address is not None:
        update_data["address"] = data.address.strip()
    if data.birthday is not None:
        update_data["birthday"] = data.birthday

    if not update_data:
        existing = await db.users.find_one({"id": user_id}, {"_id": 0})
        return public_user(existing)

    await db.users.update_one({"id": user_id}, {"$set": update_data})
    refreshed = await db.users.find_one({"id": user_id}, {"_id": 0})
    return public_user(refreshed)


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(401, "Sem refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Token inválido")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Token inválido")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "Usuário não encontrado")
    response.set_cookie("access_token", create_access_token(user["id"]), max_age=8 * 3600, **_cookie_kwargs())
    return public_user(user)


# ---------- Murais (posts) ----------
@api_router.post("/posts")
async def create_post(data: PostIn, user: dict = Depends(get_current_user)):
    post = {"id": str(uuid.uuid4()), "type": data.type, "title": data.title.strip(),
            "content": data.content.strip(), "author_id": user["id"], "author_name": user["name"],
            "status": "pending", "prayed_by": [], "created_at": utcnow().isoformat()}
    await db.posts.insert_one(post)
    post.pop("_id", None)
    return post


@api_router.get("/posts")
async def list_posts(type: Literal["prayer", "testimony"]):
    posts = await db.posts.find({"type": type, "status": "approved"}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for p in posts:
        p["pray_count"] = len(p.get("prayed_by", []))
    return posts


@api_router.post("/posts/{post_id}/pray")
async def toggle_pray(post_id: str, user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post or post["type"] != "prayer" or post["status"] != "approved":
        raise HTTPException(404, "Pedido de oração não encontrado")
    if user["id"] in post.get("prayed_by", []):
        await db.posts.update_one({"id": post_id}, {"$pull": {"prayed_by": user["id"]}})
        praying = False
    else:
        await db.posts.update_one({"id": post_id}, {"$addToSet": {"prayed_by": user["id"]}})
        praying = True
    updated = await db.posts.find_one({"id": post_id}, {"_id": 0})
    return {"praying": praying, "count": len(updated.get("prayed_by", []))}


# ---------- Agenda ----------
@api_router.get("/events")
async def list_events():
    return await db.events.find({}, {"_id": 0}).sort("date", 1).to_list(500)


@api_router.post("/suggestions")
async def create_suggestion(data: SuggestionIn, user: dict = Depends(get_current_user)):
    sug = {"id": str(uuid.uuid4()), "title": data.title.strip(), "description": data.description or "",
           "proposed_date": data.proposed_date, "proposed_time": data.proposed_time or "",
           "location": data.location or "", "proposed_by": user["id"], "proposed_by_name": user["name"],
           "status": "pending", "created_at": utcnow().isoformat()}
    await db.suggestions.insert_one(sug)
    sug.pop("_id", None)
    return sug


# ---------- Contribuições ----------
@api_router.post("/contributions")
async def create_contribution(data: ContributionIn, user: dict = Depends(get_current_user)):
    c = {"id": str(uuid.uuid4()), "user_id": user["id"], "user_name": user["name"],
         "type": data.type, "amount": round(data.amount, 2), "note": data.note or "",
         "contributed_at": data.contributed_at or utcnow().date().isoformat(),
         "status": "registrada", "created_at": utcnow().isoformat()}
    await db.contributions.insert_one(c)
    c.pop("_id", None)
    return c


@api_router.get("/contributions")
async def my_contributions(user: dict = Depends(get_current_user)):
    return await db.contributions.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api_router.get("/church-info")
async def church_info():
    info = await db.settings.find_one({"id": "church_info"}, {"_id": 0})
    return info or {}


# ---------- Admin ----------
@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    members = await db.users.count_documents({"role": "member"})
    pending_posts = await db.posts.count_documents({"status": "pending"})
    events = await db.events.count_documents({})
    contribs = await db.contributions.find({}, {"_id": 0, "amount": 1}).to_list(10000)
    return {"members": members, "pending_posts": pending_posts, "events": events,
            "contributions_total": round(sum(c.get("amount", 0) for c in contribs), 2)}


@api_router.get("/admin/posts")
async def admin_posts(status: str = "pending", admin: dict = Depends(require_admin)):
    query = {} if status == "all" else {"status": status}
    return await db.posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.post("/admin/posts/{post_id}/approve")
async def approve_post(post_id: str, admin: dict = Depends(require_admin)):
    res = await db.posts.update_one({"id": post_id}, {"$set": {"status": "approved"}})
    if res.matched_count == 0:
        raise HTTPException(404, "Publicação não encontrada")
    return {"ok": True}


@api_router.post("/admin/posts/{post_id}/reject")
async def reject_post(post_id: str, admin: dict = Depends(require_admin)):
    res = await db.posts.update_one({"id": post_id}, {"$set": {"status": "rejected"}})
    if res.matched_count == 0:
        raise HTTPException(404, "Publicação não encontrada")
    return {"ok": True}


@api_router.delete("/admin/posts/{post_id}")
async def delete_post(post_id: str, admin: dict = Depends(require_admin)):
    await db.posts.delete_one({"id": post_id})
    return {"ok": True}


@api_router.post("/admin/events")
async def create_event(data: EventIn, admin: dict = Depends(require_admin)):
    ev = {"id": str(uuid.uuid4()), "title": data.title.strip(), "description": data.description or "",
          "date": data.date, "time": data.time, "location": data.location or "",
          "created_by": admin["id"], "created_at": utcnow().isoformat()}
    await db.events.insert_one(ev)
    ev.pop("_id", None)
    return ev


@api_router.put("/admin/events/{event_id}")
async def update_event(event_id: str, data: EventIn, admin: dict = Depends(require_admin)):
    res = await db.events.update_one({"id": event_id}, {"$set": {
        "title": data.title.strip(), "description": data.description or "",
        "date": data.date, "time": data.time, "location": data.location or ""}})
    if res.matched_count == 0:
        raise HTTPException(404, "Evento não encontrado")
    return {"ok": True}


@api_router.delete("/admin/events/{event_id}")
async def delete_event(event_id: str, admin: dict = Depends(require_admin)):
    await db.events.delete_one({"id": event_id})
    return {"ok": True}


@api_router.get("/admin/suggestions")
async def admin_suggestions(admin: dict = Depends(require_admin)):
    return await db.suggestions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.post("/admin/suggestions/{sug_id}/approve")
async def approve_suggestion(sug_id: str, admin: dict = Depends(require_admin)):
    sug = await db.suggestions.find_one({"id": sug_id}, {"_id": 0})
    if not sug:
        raise HTTPException(404, "Sugestão não encontrada")
    ev = {"id": str(uuid.uuid4()), "title": sug["title"], "description": sug.get("description", ""),
          "date": sug["proposed_date"], "time": sug.get("proposed_time") or "19:30",
          "location": sug.get("location", ""), "created_by": admin["id"],
          "created_at": utcnow().isoformat()}
    await db.events.insert_one(ev)
    await db.suggestions.update_one({"id": sug_id}, {"$set": {"status": "approved"}})
    return {"ok": True}


@api_router.post("/admin/suggestions/{sug_id}/reject")
async def reject_suggestion(sug_id: str, admin: dict = Depends(require_admin)):
    await db.suggestions.update_one({"id": sug_id}, {"$set": {"status": "rejected"}})
    return {"ok": True}


@api_router.get("/admin/contributions")
async def admin_contributions(admin: dict = Depends(require_admin)):
    return await db.contributions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.post("/admin/contributions/{c_id}/confirm")
async def confirm_contribution(c_id: str, admin: dict = Depends(require_admin)):
    await db.contributions.update_one({"id": c_id}, {"$set": {"status": "confirmada"}})
    return {"ok": True}


@api_router.delete("/admin/contributions/{c_id}")
async def delete_contribution(c_id: str, admin: dict = Depends(require_admin)):
    await db.contributions.delete_one({"id": c_id})
    return {"ok": True}


@api_router.put("/admin/church-info")
async def update_church_info(data: ChurchInfoIn, admin: dict = Depends(require_admin)):
    doc = data.model_dump()
    doc["id"] = "church_info"
    await db.settings.update_one({"id": "church_info"}, {"$set": doc}, upsert=True)
    return doc


# ---------- Startup seed ----------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")

    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "name": "Feliciano Rodrigues", "email": admin_email,
            "password_hash": hash_password(admin_password), "role": "admin",
            "created_at": utcnow().isoformat()})
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email},
                                  {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}})

    info = await db.settings.find_one({"id": "church_info"})
    default_addresses = [
        "Templo Principal — Rua da Fé, 123, Centro",
        "Congregação Jardim Esperança — Av. das Palmeiras, 456, Jardim Esperança",
    ]
    if not info:
        await db.settings.insert_one({
            "id": "church_info", "church_name": "Comunidade da Fé",
            "pix_key": "contribuir@comunidadedafe.com.br", "bank_name": "Banco do Brasil",
            "agency": "0001-X", "account": "12345-6", "holder": "Igreja Comunidade da Fé",
            "cnpj": "00.000.000/0001-00", "addresses": default_addresses,
            "instructions": "Após a transferência, registre sua contribuição no formulário ao lado para que a tesouraria confirme o recebimento.",
            "videos": []})
    elif "addresses" not in info:
        await db.settings.update_one({"id": "church_info"}, {"$set": {"addresses": default_addresses}})
    elif "videos" not in info:
        await db.settings.update_one({"id": "church_info"}, {"$set": {"videos": []}})

    if await db.events.count_documents({}) == 0:
        today = utcnow().date()
        seeds = [
            {"title": "Culto de Celebração", "description": "Culto dominical com louvor e palavra.", "date": _next_weekday(today, 6).isoformat(), "time": "18:30", "location": "Templo Principal"},
            {"title": "Estudo Bíblico", "description": "Estudo no livro de Salmos, traga sua Bíblia.", "date": _next_weekday(today, 2).isoformat(), "time": "19:30", "location": "Salão de Estudos"},
            {"title": "Vigília de Oração", "description": "Noite de intercessão pela igreja e famílias.", "date": _next_weekday(today, 4).isoformat(), "time": "22:00", "location": "Templo Principal"},
        ]
        for s in seeds:
            s.update({"id": str(uuid.uuid4()), "created_by": "seed", "created_at": utcnow().isoformat()})
        await db.events.insert_many(seeds)

    if await db.posts.count_documents({}) == 0:
        samples = [
            {"type": "prayer", "title": "Pela saúde da minha mãe", "content": "Peço oração pela recuperação da minha mãe que passará por uma cirurgia nesta semana.", "author_name": "Irmã Maria"},
            {"type": "prayer", "title": "Novo emprego", "content": "Estou em busca de recolocação profissional. Orem para que Deus abra portas.", "author_name": "Irmão José"},
            {"type": "testimony", "title": "Deus proveu no tempo certo", "content": "Estava desempregado há 6 meses e, após a campanha de oração, recebi uma proposta de trabalho. Deus é fiel!", "author_name": "Irmão Carlos"},
            {"type": "testimony", "title": "Cura recebida", "content": "Fui curada de uma enfermidade que os médicos não tinham explicação. Glória a Deus!", "author_name": "Irmã Ana"},
        ]
        for s in samples:
            s.update({"id": str(uuid.uuid4()), "author_id": "seed", "status": "approved",
                      "prayed_by": [], "created_at": utcnow().isoformat()})
        await db.posts.insert_many(samples)

    logger.info("Startup seed concluído")


def _next_weekday(from_date, weekday):
    days_ahead = (weekday - from_date.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    return from_date + timedelta(days=days_ahead)


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000"), "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
