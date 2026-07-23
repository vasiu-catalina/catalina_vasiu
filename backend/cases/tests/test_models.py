from datetime import date, datetime, timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone

from cases.models import Case, CaseStatus, Document, DocumentType, FlightSegment, Passenger


class CaseModelTests(TestCase):
    def test_case_defaults_to_new_status(self):
        case = Case.objects.create(
            reservation_number='PNR123',
            gdpr_consent=True,
            updates_consent=False,
        )

        self.assertEqual(case.status, CaseStatus.NEW)

    def test_flight_segments_are_ordered_by_sequence(self):
        case = Case.objects.create(reservation_number='PNR123', gdpr_consent=True, updates_consent=True)
        later = timezone.now() + timedelta(hours=3)
        FlightSegment.objects.create(
            case=case,
            sequence=2,
            flight_date=date.today(),
            flight_number='RO102',
            airline='Tarom',
            departing_airport_code='OTP',
            destination_airport_code='FRA',
            planned_departure_time=timezone.now(),
            planned_arrival_time=later,
            is_connection=True,
            is_problem_flight=True,
        )
        FlightSegment.objects.create(
            case=case,
            sequence=1,
            flight_date=date.today(),
            flight_number='RO101',
            airline='Tarom',
            departing_airport_code='CLJ',
            destination_airport_code='OTP',
            planned_departure_time=timezone.now(),
            planned_arrival_time=later,
            is_connection=False,
            is_problem_flight=False,
        )

        self.assertEqual(list(case.flight_segments.values_list('sequence', flat=True)), [1, 2])

    def test_document_filename_returns_uploaded_name(self):
        case = Case.objects.create(reservation_number='PNR123', gdpr_consent=True, updates_consent=True)
        document = Document.objects.create(
            case=case,
            document_type=DocumentType.BOARDING_PASS,
            file=SimpleUploadedFile('boarding-pass.pdf', b'file-content', content_type='application/pdf'),
        )

        self.assertTrue(document.filename.startswith('boarding-pass'))
        self.assertTrue(document.filename.endswith('.pdf'))