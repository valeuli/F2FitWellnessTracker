import uuid
from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WellnessEntry(Base):
    __tablename__ = "wellness_entries"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "local_date",
            name="uq_wellness_user_date",
        ),
        UniqueConstraint(
            "user_id",
            "idempotency_key",
            name="uq_wellness_user_idempotency_key",
        ),
        CheckConstraint(
            "physical_energy IS NULL OR "
            "(physical_energy BETWEEN 1 AND 5)",
            name="ck_physical_energy_range",
        ),
        CheckConstraint(
            "emotional_state IS NULL OR "
            "(emotional_state BETWEEN 1 AND 5)",
            name="ck_emotional_state_range",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    local_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    timezone: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    idempotency_key: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    physical_energy: Mapped[int | None] = mapped_column(nullable=True)
    emotional_state: Mapped[int | None] = mapped_column(nullable=True)

    notes: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    exercise: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    hydration: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    sleep: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    nutrition: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
