"""
Domain Layer -- AuthController (GRASP Controller).

Handles: Login to System, Manage User Accounts (create/disable), per
design_class_diagram.md's Controller table. The UI/API layer talks only to
this controller, not directly to UserAccount persistence.
"""
from typing import List, Optional

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.domain.models import UserAccount, UserRole, UserStatus
from app.domain.schemas import UserCreateRequest, UserUpdateRequest
from app.technical_services.auth.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.technical_services.logging.logger import log_action, log_error


class AuthController:
    def __init__(self, session: Session):
        self.session = session

    def login(self, username: str, password: str) -> tuple[str, UserAccount]:
        """login(username, password) per design_class_diagram.md. Raises
        HTTPException on invalid credentials or a disabled account (Section
        11: exception conditions from detailed_use_cases_iteration2.md)."""
        user = self.session.exec(
            select(UserAccount).where(UserAccount.username == username)
        ).first()

        if not user or not verify_password(password, user.hashed_password):
            log_error("login_failed", detail=f"username={username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password.",
            )

        if user.status != UserStatus.ACTIVE:
            log_error("login_disabled_account", detail=f"username={username}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been disabled. Contact an administrator.",
            )

        token = create_access_token({"sub": str(user.id), "role": user.role})
        log_action("login_success", actor=username)
        return token, user

    def create_user_account(self, req: UserCreateRequest, actor: str) -> UserAccount:
        existing = self.session.exec(
            select(UserAccount).where(UserAccount.username == req.username)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken.")

        user = UserAccount(
            username=req.username,
            hashed_password=hash_password(req.password),
            full_name=req.full_name,
            email=req.email,
            phone=req.phone,
            role=req.role,
            status=UserStatus.ACTIVE,
        )
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        log_action("user_created", actor=actor, detail=f"new_user={req.username} role={req.role}")
        return user

    def update_user_account(self, user_id: int, req: UserUpdateRequest, actor: str) -> UserAccount:
        user = self.session.get(UserAccount, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        # Guard: cannot disable/demote the last remaining active administrator
        # (exception condition from detailed_use_cases_iteration2.md: "Manage User Accounts").
        if user.role == UserRole.ADMIN and (
            req.status == UserStatus.DISABLED or (req.role and req.role != UserRole.ADMIN)
        ):
            other_admins = self.session.exec(
                select(UserAccount).where(
                    UserAccount.role == UserRole.ADMIN,
                    UserAccount.status == UserStatus.ACTIVE,
                    UserAccount.id != user_id,
                )
            ).all()
            if not other_admins:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot disable or demote the last remaining administrator account.",
                )

        if req.full_name is not None:
            user.full_name = req.full_name
        if req.email is not None:
            user.email = req.email
        if req.phone is not None:
            user.phone = req.phone
        if req.role is not None:
            user.role = req.role
        if req.status is not None:
            user.status = req.status
        if req.password:
            user.hashed_password = hash_password(req.password)

        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        log_action("user_updated", actor=actor, detail=f"user_id={user_id}")
        return user

    def list_users(self) -> List[UserAccount]:
        return list(self.session.exec(select(UserAccount)).all())

    def disable_user_account(self, user_id: int, actor: str) -> UserAccount:
        return self.update_user_account(user_id, UserUpdateRequest(status=UserStatus.DISABLED), actor)
