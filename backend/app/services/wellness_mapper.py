from datetime import timezone

from app.models import WellnessEntry
from app.schemas import HabitsSchema, WellnessEntryResponse


def _to_utc_datetime(value):
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def to_wellness_response(
    entry: WellnessEntry,
) -> WellnessEntryResponse:
    return WellnessEntryResponse(
        id=entry.id,
        user_id=entry.user_id,
        date=entry.local_date,
        physical_energy=entry.physical_energy,
        emotional_state=entry.emotional_state,
        notes=entry.notes,
        timezone=entry.timezone,
        habits=HabitsSchema(
            exercise=bool(entry.exercise),
            hydration=bool(entry.hydration),
            sleep=bool(entry.sleep),
            nutrition=bool(entry.nutrition),
        ),
        created_at=_to_utc_datetime(entry.created_at),
        updated_at=_to_utc_datetime(entry.updated_at),
    )
