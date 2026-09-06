from typing import List

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.domain.controllers.auth_controller import AuthController
from app.domain.models import UserAccount, UserRole
from app.domain.schemas import UserCreateRequest, UserPublic, UserUpdateRequest
from app.technical_services.auth.dependencies import require_roles
from app.technical_services.persistence.database import get_session

router = APIRouter(prefix="/api/users", tags=["users"])

# User management is Administrator-only per README Section 7.
_admin_only = require_roles(UserRole.ADMIN)


@router.get("", response_model=List[UserPublic])
def list_users(
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(_admin_only),
):
    controller = AuthController(session)
    return controller.list_users()


@router.post("", response_model=UserPublic, status_code=201)
def create_user(
    payload: UserCreateRequest,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(_admin_only),
):
    """Manage User Accounts use case: create (FR8)."""
    controller = AuthController(session)
    return controller.create_user_account(payload, actor=current_user.username)


@router.put("/{user_id}", response_model=UserPublic)
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(_admin_only),
):
    """Manage User Accounts use case: edit / assign role / disable."""
    controller = AuthController(session)
    return controller.update_user_account(user_id, payload, actor=current_user.username)


@router.post("/{user_id}/disable", response_model=UserPublic)
def disable_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: UserAccount = Depends(_admin_only),
):
    controller = AuthController(session)
    return controller.disable_user_account(user_id, actor=current_user.username)
