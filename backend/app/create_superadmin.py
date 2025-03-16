import sys
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.db.base import Base
from app.db.models import User, UserRole
from app.db.session import SessionLocal, engine

# Create tables
Base.metadata.create_all(bind=engine)


def init_db(db: Session) -> None:
    # Create superadmin user
    user = db.query(User).filter(User.email == "admin@example.com").first()
    if not user:
        user = User(
            email="admin@example.com",
            name="Admin",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        print("Superadmin user created successfully")
    else:
        print("Superadmin user already exists")


def main() -> None:
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()


if __name__ == "__main__":
    main() 