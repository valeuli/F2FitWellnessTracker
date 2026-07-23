from datetime import date

from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import WellnessEntry


class WellnessRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_and_date(
        self,
        user_id: str,
        local_date: date,
    ) -> WellnessEntry | None:
        query = select(WellnessEntry).where(
            WellnessEntry.user_id == user_id,
            WellnessEntry.local_date == local_date,
        )

        return self.db.scalar(query)

    def get_by_idempotency_key(
        self,
        user_id: str,
        idempotency_key: str,
    ) -> WellnessEntry | None:
        query = select(WellnessEntry).where(
            WellnessEntry.user_id == user_id,
            WellnessEntry.idempotency_key == idempotency_key,
        )

        return self.db.scalar(query)

    def get_history(
        self,
        user_id: str,
        start_date: date,
    ) -> list[WellnessEntry]:
        query = (
            select(WellnessEntry)
            .where(
                WellnessEntry.user_id == user_id,
                WellnessEntry.local_date >= start_date,
            )
            .order_by(WellnessEntry.local_date.asc())
        )

        return list(self.db.scalars(query).all())

    def create(self, entry: WellnessEntry) -> WellnessEntry:
        self.db.add(entry)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            existing = self.get_by_idempotency_key(
                user_id=entry.user_id,
                idempotency_key=entry.idempotency_key,
            )
            if existing is not None:
                return existing

            existing = self.get_by_user_and_date(
                user_id=entry.user_id,
                local_date=entry.local_date,
            )
            if existing is not None:
                return existing

            raise

        self.db.refresh(entry)

        return entry

    def update(self, entry: WellnessEntry) -> WellnessEntry:
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            existing = self.get_by_idempotency_key(
                user_id=entry.user_id,
                idempotency_key=entry.idempotency_key,
            )
            if existing is not None:
                return existing

            existing = self.get_by_user_and_date(
                user_id=entry.user_id,
                local_date=entry.local_date,
            )
            if existing is not None:
                return existing

            raise

        self.db.refresh(entry)

        return entry
