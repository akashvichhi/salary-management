from datetime import datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base_model import AppDateTime, Base, TimestampMixin
from app.models.user_model import UserModel

SHA256_HEX_LENGTH = 64


class SessionModel(TimestampMixin, Base):
    """A login session. The cookie holds the token; this row holds only its SHA-256 hash."""

    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    token_hash: Mapped[str] = mapped_column(
        String(SHA256_HEX_LENGTH), nullable=False, unique=True, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(AppDateTime, nullable=False)

    # Joined, because every authenticated request needs the user with the session.
    user: Mapped[UserModel] = relationship(lazy="joined")
