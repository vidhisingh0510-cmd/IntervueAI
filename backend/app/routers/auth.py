from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post("/register")
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "Account created successfully",
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
    }


@router.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if not user or not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
        }
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
    }
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
    }