from app.models import WellnessEntry
from app.schemas import HabitsSchema, WellnessEntryResponse


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
            exercise=entry.exercise,
            hydration=entry.hydration,
            sleep=entry.sleep,
            nutrition=entry.nutrition,
        ),
        created_at=entry.created_at,
        updated_at=entry.updated_at,
    )
