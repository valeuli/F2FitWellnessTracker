from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.wellness_repository import WellnessRepository
from app.schemas import (
    WellnessEntryResponse,
    WellnessEntryUpsert,
    WellnessHistoryResponse,
)
from app.services.wellness_mapper import to_wellness_response
from app.services.wellness_service import WellnessService


router = APIRouter(
    prefix="/api/wellness",
    tags=["Wellness"],
)

TEST_USER_ID = "test_user_123"


def get_service(
    db: Annotated[Session, Depends(get_db)],
) -> WellnessService:
    repository = WellnessRepository(db)
    return WellnessService(repository)


@router.get(
    "/today",
    response_model=WellnessEntryResponse,
)
def get_today_entry(
    local_date: Annotated[date, Query(alias="date")],
    service: Annotated[WellnessService, Depends(get_service)],
) -> WellnessEntryResponse:
    entry = service.get_entry(
        user_id=TEST_USER_ID,
        local_date=local_date,
    )

    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wellness entry not found",
        )

    return to_wellness_response(entry)


@router.put(
    "/today",
    response_model=WellnessEntryResponse,
)
def upsert_today_entry(
    payload: WellnessEntryUpsert,
    idempotency_key: Annotated[
        str | None,
        Header(default=None, alias="Idempotency-Key"),
    ],
    service: Annotated[WellnessService, Depends(get_service)],
) -> WellnessEntryResponse:
    if not idempotency_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Idempotency-Key is required",
        )

    entry = service.upsert_entry(
        user_id=TEST_USER_ID,
        idempotency_key=idempotency_key,
        payload=payload,
    )

    return to_wellness_response(entry)


@router.get(
    "/history",
    response_model=WellnessHistoryResponse,
)
def get_history(
    end_date: Annotated[date | None, Query(default=None, alias="date")],
    days: Annotated[int, Query(default=7, ge=1, le=30)],
    timezone_name: Annotated[
        str | None,
        Query(default=None, alias="timezone"),
    ],
    service: Annotated[WellnessService, Depends(get_service)],
) -> WellnessHistoryResponse:
    entries = service.get_history(
        user_id=TEST_USER_ID,
        days=days,
        end_date=end_date,
        timezone_name=timezone_name,
    )

    return WellnessHistoryResponse(
        entries=[
            to_wellness_response(entry)
            for entry in entries
        ]
    )
