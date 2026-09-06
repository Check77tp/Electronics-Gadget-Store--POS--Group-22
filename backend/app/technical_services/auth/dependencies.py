"""
FastAPI dependencies that enforce authentication and role-based authorization
SERVER-SIDE, per README Section 12: "enforce role-based authorization
server-side (never rely on frontend restrictions alone)."

Every protected route depends on `get_current_user` (or `require_roles(...)`)
rather than trusting anything the client claims about its own role.
"""
from typing import Iterable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from app.domain.models import UserAccount, UserStatus
from app.technical_services.auth.security import decode_access_token
from app.technical_services.persistence.database import get_session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> UserAccount:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = session.get(UserAccount, int(user_id))
    if user is None:
        raise credentials_exception
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Contact an administrator.",
        )
    return user


def require_roles(*allowed_roles: Iterable[str]):
    """Dependency factory: raises 403 unless the current user's role is allowed.

    Usage: Depends(require_roles("admin", "manager"))
    """

    def _checker(current_user: UserAccount = Depends(get_current_user)) -> UserAccount:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' is not authorized for this action.",
            )
        return current_user

    return _checker
