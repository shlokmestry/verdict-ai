from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from loguru import logger
import jwt
from api.database import get_db
from api import models as db_models
from config.settings import settings

security = HTTPBearer()

def verify_token(token: str) -> dict:
    if not settings.clerk_frontend_api:
        logger.warning("CLERK_FRONTEND_API not set - using dev auth bypass")
        return {"sub": "dev_user_001", "email": "dev@Verdict.com", "name": "Dev User"}
    try:
        payload = jwt.decode(token, options={"verify_signature": False}, algorithms=["RS256"])
        return payload
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token", headers={"WWW-Authenticate": "Bearer"})

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> db_models.User:
    payload       = verify_token(credentials.credentials)
    clerk_user_id = payload.get("sub", "")
    email         = payload.get("email", "unknown@example.com")
    full_name     = payload.get("name", "")
    if not clerk_user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = db.query(db_models.User).filter(db_models.User.clerk_user_id == clerk_user_id).first()
    if not user:
        user = db_models.User(clerk_user_id=clerk_user_id, email=email, full_name=full_name)
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Auto-provisioned user: {email}")
    return user
