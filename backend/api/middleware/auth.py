"""
JWT Authentication middleware.
Owner: Member 1 — Backend & RAG Lead
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from loguru import logger

from backend.config.settings import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# ---------------------------------------------------------------------------
# Demo users (replace with DB lookup in production)
# ---------------------------------------------------------------------------
DEMO_USERS = {
    "admin": {
        "username": "admin",
        "full_name": "Plant Manager",
        "email": "admin@industrialbrain.com",
        "hashed_password": pwd_context.hash("admin123"),
        "role": "admin",
        "disabled": False,
    },
    "engineer": {
        "username": "engineer",
        "full_name": "Maintenance Engineer",
        "email": "engineer@industrialbrain.com",
        "hashed_password": pwd_context.hash("eng123"),
        "role": "engineer",
        "disabled": False,
    },
    "technician": {
        "username": "technician",
        "full_name": "Field Technician",
        "email": "tech@industrialbrain.com",
        "hashed_password": pwd_context.hash("tech123"),
        "role": "technician",
        "disabled": False,
    },
}


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: dict


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class User(BaseModel):
    username: str
    full_name: str
    email: str
    role: str
    disabled: bool


# ---------------------------------------------------------------------------
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def authenticate_user(username: str, password: str) -> dict | None:
    user = DEMO_USERS.get(username)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.JWT_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User | None:
    """
    Validate JWT token and return current user.
    Returns None if no token (allows unauthenticated access to some routes).
    """
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            return None
        user_dict = DEMO_USERS.get(username)
        if not user_dict:
            return None
        return User(**{k: v for k, v in user_dict.items() if k != "hashed_password"})
    except JWTError:
        return None


async def require_auth(token: str = Depends(oauth2_scheme)) -> User:
    """Require valid JWT — raises 401 if missing or invalid."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise credentials_exception
        user_dict = DEMO_USERS.get(username)
        if not user_dict:
            raise credentials_exception
        return User(**{k: v for k, v in user_dict.items() if k != "hashed_password"})
    except JWTError:
        raise credentials_exception


async def require_admin(current_user: User = Depends(require_auth)) -> User:
    """Require admin role."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
