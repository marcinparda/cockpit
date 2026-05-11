"""Role models for role-based access control."""

from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import String, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.common.models import BaseModel

if TYPE_CHECKING:
    from src.services.users.models import User


class UserRole(BaseModel):
    """User role model for role-based access control."""

    __tablename__ = "user_roles"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True,
                                     server_default=text('uuid_generate_v4()'), init=False)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default=None)

    # Relationship with users
    users = relationship("User", back_populates="role")
