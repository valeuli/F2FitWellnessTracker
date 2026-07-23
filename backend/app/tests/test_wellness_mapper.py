from datetime import datetime, timezone
from unittest import TestCase

from app.models import WellnessEntry
from app.services.wellness_mapper import to_wellness_response


class WellnessMapperTests(TestCase):
    def test_serializes_naive_datetimes_as_utc_aware(self):
        entry = WellnessEntry(
            id="entry-1",
            user_id="test_user_123",
            local_date=datetime(2026, 7, 23).date(),
            timezone="America/Bogota",
            idempotency_key="idem-123",
            created_at=datetime(2026, 7, 23, 6, 21, 1, 785126),
            updated_at=datetime(2026, 7, 23, 6, 21, 1, 785126),
        )

        response = to_wellness_response(entry)

        self.assertEqual(response.created_at.tzinfo, timezone.utc)
        self.assertEqual(response.updated_at.tzinfo, timezone.utc)
        self.assertEqual(
            response.updated_at.isoformat(),
            "2026-07-23T06:21:01.785126+00:00",
        )
