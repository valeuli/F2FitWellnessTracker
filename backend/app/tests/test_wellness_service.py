from datetime import date
from unittest import TestCase
from unittest.mock import Mock

from pydantic import ValidationError

from app.models import WellnessEntry
from app.schemas import HabitsSchema, WellnessEntryUpsert
from app.services.wellness_service import WellnessService


class WellnessServiceTests(TestCase):
    def test_updates_existing_daily_entry_without_creating_duplicate(self):
        repository = Mock()

        existing_entry = WellnessEntry(
            id="entry-1",
            user_id="test_user_123",
            local_date=date(2026, 5, 1),
            physical_energy=2,
            exercise=False,
            timezone="America/Bogota",
            idempotency_key="idem-old",
        )

        repository.get_by_idempotency_key.return_value = None
        repository.get_by_user_and_date.return_value = existing_entry
        repository.update.return_value = existing_entry

        service = WellnessService(repository)

        payload = WellnessEntryUpsert(
            date=date(2026, 5, 1),
            physical_energy=4,
            habits=HabitsSchema(exercise=True),
            timezone="America/Bogota",
        )

        result = service.upsert_entry(
            user_id="test_user_123",
            idempotency_key="idem-123",
            payload=payload,
        )

        self.assertEqual(result.physical_energy, 4)
        self.assertTrue(result.exercise)
        repository.create.assert_not_called()
        repository.update.assert_called_once_with(existing_entry)

    def test_creates_new_entry_when_day_is_empty(self):
        repository = Mock()
        repository.get_by_idempotency_key.return_value = None
        repository.get_by_user_and_date.return_value = None
        repository.create.side_effect = lambda entry: entry

        service = WellnessService(repository)

        payload = WellnessEntryUpsert(
            date=date(2026, 5, 1),
            physical_energy=4,
            emotional_state=3,
            notes="Día muy productivo",
            habits=HabitsSchema(
                exercise=True,
                hydration=True,
                sleep=False,
                nutrition=True,
            ),
            timezone="America/Bogota",
        )

        result = service.upsert_entry(
            user_id="test_user_123",
            idempotency_key="idem-new",
            payload=payload,
        )

        self.assertEqual(result.user_id, "test_user_123")
        self.assertEqual(result.local_date, date(2026, 5, 1))
        self.assertEqual(result.timezone, "America/Bogota")
        self.assertEqual(result.idempotency_key, "idem-new")
        self.assertEqual(result.physical_energy, 4)
        self.assertEqual(result.emotional_state, 3)
        self.assertEqual(result.notes, "Día muy productivo")
        self.assertTrue(result.exercise)
        self.assertTrue(result.hydration)
        self.assertFalse(result.sleep)
        self.assertTrue(result.nutrition)
        repository.create.assert_called_once()
        repository.update.assert_not_called()

    def test_rejects_invalid_timezone(self):
        with self.assertRaises(ValidationError) as exc_info:
            WellnessEntryUpsert(
                date=date(2026, 5, 1),
                timezone="Bogota/Invalid",
            )

        self.assertIn(
            "timezone must be a valid IANA timezone",
            str(exc_info.exception),
        )

    def test_rejects_notes_longer_than_100_chars(self):
        long_notes = "a" * 101

        with self.assertRaises(ValidationError):
            WellnessEntryUpsert(
                date=date(2026, 5, 1),
                notes=long_notes,
                timezone="America/Bogota",
            )
