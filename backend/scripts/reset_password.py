#!/usr/bin/env python3
"""
Reset a user's password from the command line.

Usage:
    docker compose exec backend python scripts/reset_password.py <email> <new_password>

Examples:
    docker compose exec backend python scripts/reset_password.py jbeaman@gmail.com MyNewPassword123
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.user import User
from app.utils.auth import get_password_hash


def reset_password(email: str, new_password: str):
    db = SessionLocal()

    try:
        user = db.query(User).filter(User.email == email).first()

        if not user:
            print(f"Error: No user found with email '{email}'")
            print("\nExisting users:")
            users = db.query(User).all()
            for u in users:
                print(f"  - {u.email} ({u.name})")
            return False

        user.hashed_password = get_password_hash(new_password)
        db.commit()

        print(f"Password reset successfully for {user.name} ({user.email})")
        return True

    finally:
        db.close()


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)

    email = sys.argv[1]
    new_password = sys.argv[2]

    if len(new_password) < 6:
        print("Error: Password must be at least 6 characters")
        sys.exit(1)

    success = reset_password(email, new_password)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
