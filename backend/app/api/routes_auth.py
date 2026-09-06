from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from app.domain.controllers.auth_controller import AuthController
from app.domain.schemas import LoginRequest, TokenResponse, UserPublic
from app.technical_services.auth.dependencies import get_current_user
from app.technical_services.persistence.database import get_session

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, session: Session = Depends(get_session)):
    controller = AuthController(session)
    token, user = controller.login(payload.username, payload.password)
    return TokenResponse(access_token=token, user=UserPublic.model_validate(user, from_attributes=True))


@router.post("/token", response_model=TokenResponse, include_in_schema=False)
def login_oauth2_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    """OAuth2-form-compatible login so /docs' 'Authorize' button works too."""
    controller = AuthController(session)
    token, user = controller.login(form_data.username, form_data.password)
    return TokenResponse(access_token=token, user=UserPublic.model_validate(user, from_attributes=True))


@router.get("/me", response_model=UserPublic)
def me(current_user=Depends(get_current_user)):
    return UserPublic.model_validate(current_user, from_attributes=True)
