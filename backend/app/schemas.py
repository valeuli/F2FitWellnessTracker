from datetime import date, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, Field, field_validator


class HabitsSchema(BaseModel):
    exercise: bool = False
    hydration: bool = False
    sleep: bool = False
    nutrition: bool = False


class WellnessEntryUpsert(BaseModel):
    physical_energy: int | None = Field(
        default=None,
        ge=1,
        le=5,
    )

    emotional_state: int | None = Field(
        default=None,
        ge=1,
        le=5,
    )

    notes: str | None = Field(
        default=None,
        max_length=100,
    )

    habits: HabitsSchema | None = None
    timezone: str = Field(min_length=1)

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as exc:
            raise ValueError("timezone must be a valid IANA timezone") from exc

        return value


class WellnessEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    date: date
    physical_energy: int | None
    emotional_state: int | None
    notes: str | None
    habits: HabitsSchema
    timezone: str
    created_at: datetime
    updated_at: datetime


class WellnessHistoryResponse(BaseModel):
    entries: list[WellnessEntryResponse]
