from datetime import date, timedelta

from app.models import WellnessEntry
from app.repositories.wellness_repository import WellnessRepository
from app.schemas import WellnessEntryUpsert


class WellnessService:
    def __init__(self, repository: WellnessRepository):
        self.repository = repository

    def upsert_entry(
        self,
        user_id: str,
        local_date: date,
        idempotency_key: str,
        payload: WellnessEntryUpsert,
    ) -> WellnessEntry:
        existing_by_key = self.repository.get_by_idempotency_key(
            user_id=user_id,
            idempotency_key=idempotency_key,
        )

        if existing_by_key is not None:
            return existing_by_key

        entry = self.repository.get_by_user_and_date(
            user_id=user_id,
            local_date=local_date,
        )

        if entry is None:
            entry = WellnessEntry(
                user_id=user_id,
                local_date=local_date,
                idempotency_key=idempotency_key,
            )
        else:
            entry.idempotency_key = idempotency_key

        update_data = payload.model_dump(exclude_unset=True)

        habits = update_data.pop("habits", None)

        for field, value in update_data.items():
            setattr(entry, field, value)

        if habits is not None:
            for field, value in habits.items():
                setattr(entry, field, value)

        if entry.id is None:
            return self.repository.create(entry)

        return self.repository.update(entry)

    def get_entry(
        self,
        user_id: str,
        local_date: date,
    ) -> WellnessEntry | None:
        return self.repository.get_by_user_and_date(
            user_id,
            local_date,
        )

    def get_history(
        self,
        user_id: str,
        days: int,
        end_date: date,
    ) -> list[WellnessEntry]:
        start_date = end_date - timedelta(days=days - 1)

        return self.repository.get_history(
            user_id=user_id,
            start_date=start_date,
        )
