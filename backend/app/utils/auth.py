from typing import Optional
import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..config import get_settings
from ..database import get_db
from ..models.user import User

settings = get_settings()
security = HTTPBearer()


async def verify_clerk_token(token: str) -> Optional[dict]:
    """Verify a Clerk JWT token and return the payload."""
    try:
        # Clerk tokens can be verified using their JWKS
        # First, get the JWKS from Clerk
        async with httpx.AsyncClient() as client:
            # Extract the issuer from the token to get the right JWKS URL
            unverified = jwt.decode(token, options={"verify_signature": False})
            issuer = unverified.get("iss", "")

            if not issuer:
                return None

            jwks_url = f"{issuer}/.well-known/jwks.json"
            response = await client.get(jwks_url)

            if response.status_code != 200:
                return None

            jwks = response.json()

        # Get the key ID from the token header
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        if not kid:
            return None

        # Find the matching key
        key = None
        for k in jwks.get("keys", []):
            if k.get("kid") == kid:
                key = jwt.algorithms.RSAAlgorithm.from_jwk(k)
                break

        if not key:
            return None

        # Verify and decode the token
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            options={"verify_aud": False}  # Clerk doesn't always set aud
        )

        return payload

    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    except Exception:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get the current user from a Clerk JWT token."""
    token = credentials.credentials
    payload = await verify_clerk_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get Clerk user ID from the token
    clerk_user_id = payload.get("sub")
    if not clerk_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    # Find or create user in our database
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()

    if not user:
        # Create user from Clerk data
        # Get email and name from token claims
        email = payload.get("email") or payload.get("primary_email_address") or f"{clerk_user_id}@clerk.user"
        name = payload.get("name") or payload.get("first_name") or "User"

        user = User(
            clerk_id=clerk_user_id,
            email=email,
            name=name,
            is_admin=False,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is disabled",
        )

    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get the current user if authenticated, otherwise return None."""
    if credentials is None:
        return None

    token = credentials.credentials
    payload = await verify_clerk_token(token)

    if payload is None:
        return None

    clerk_user_id = payload.get("sub")
    if not clerk_user_id:
        return None

    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()
    return user if user and user.is_active else None


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Require the current user to be an admin."""
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user
