import json
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APITestCase

from cases.models import Case, CaseStatus, Disruption, DisruptionType


class DisruptionModelTest(TestCase):
    def test_create_cancellation_disruption(self):
        case = Case.objects.create(
            status=CaseStatus.NEW,
            reservation_number='TEST123',
            gdpr_consent=True,
            updates_consent=False,
        )
        disruption = Disruption.objects.create(
            case=case,
            disruption_type=DisruptionType.CANCELLATION,
            cancellation_notice='less_than_14_days',
            airline_mentioned_motive='yes',
            airline_motive='technical',
            incident_description='Flight was cancelled 5 days before departure.',
        )
        self.assertEqual(disruption.disruption_type, 'cancellation')
        self.assertEqual(disruption.cancellation_notice, 'less_than_14_days')
        self.assertEqual(disruption.airline_motive, 'technical')
        self.assertEqual(disruption.case, case)

    def test_create_delay_disruption(self):
        case = Case.objects.create(
            status=CaseStatus.NEW,
            reservation_number='TEST456',
            gdpr_consent=True,
            updates_consent=False,
        )
        disruption = Disruption.objects.create(
            case=case,
            disruption_type=DisruptionType.DELAY,
            delay_arrival='more_than_3h',
            airline_mentioned_motive='no',
            incident_description='Arrived 4 hours late.',
        )
        self.assertEqual(disruption.disruption_type, 'delay')
        self.assertEqual(disruption.delay_arrival, 'more_than_3h')
        self.assertIsNone(disruption.cancellation_notice)

    def test_create_denied_boarding_disruption(self):
        case = Case.objects.create(
            status=CaseStatus.NEW,
            reservation_number='TEST789',
            gdpr_consent=True,
            updates_consent=False,
        )
        disruption = Disruption.objects.create(
            case=case,
            disruption_type=DisruptionType.DENIED_BOARDING,
            voluntary_give_up='no',
            denial_reason='overbooked',
            incident_description='Was denied boarding due to overbooking.',
        )
        self.assertEqual(disruption.disruption_type, 'denied_boarding')
        self.assertEqual(disruption.voluntary_give_up, 'no')
        self.assertEqual(disruption.denial_reason, 'overbooked')

    def test_disruption_without_optional_fields(self):
        case = Case.objects.create(
            status=CaseStatus.NEW,
            reservation_number='TEST000',
            gdpr_consent=True,
            updates_consent=False,
        )
        disruption = Disruption.objects.create(
            case=case,
            disruption_type=DisruptionType.CANCELLATION,
        )
        self.assertEqual(disruption.disruption_type, 'cancellation')
        self.assertIsNone(disruption.cancellation_notice)
        self.assertEqual(disruption.incident_description, '')


def _make_case_payload(disruption=None):
    payload = {
        'reservation_number': 'ABC123',
        'gdpr_consent': True,
        'updates_consent': False,
        'passenger': {
            'first_name': 'John',
            'last_name': 'Doe',
            'date_of_birth': '1990-01-01',
            'email': 'john@example.com',
            'phone': '+1234567890',
            'address': '123 Street',
            'postal_code': '12345',
        },
        'flight_segments': [{
            'sequence': 1,
            'flight_date': '2026-08-01',
            'flight_number': 'AB123',
            'airline': 'Test Air',
            'departing_airport_code': 'JFK',
            'destination_airport_code': 'LAX',
            'planned_departure_time': '2026-08-01T10:00:00Z',
            'planned_arrival_time': '2026-08-01T14:00:00Z',
            'is_connection': False,
            'is_problem_flight': True,
        }],
    }
    if disruption is not None:
        payload['disruption'] = disruption
    return payload


class DisruptionAPITest(APITestCase):
    @patch('cases.serializers.validate_airport_code_from_lookup', side_effect=lambda field, code: code.strip().upper())
    def test_case_creation_without_disruption_fails(self, _mock):
        payload = _make_case_payload()

        boarding_pass = SimpleUploadedFile('bp.pdf', b'%PDF-content', content_type='application/pdf')
        identity_doc = SimpleUploadedFile('id.pdf', b'%PDF-content', content_type='application/pdf')

        response = self.client.post(
            '/api/cases/',
            data={
                'payload': json.dumps(payload),
                'boarding_pass': boarding_pass,
                'identity_document': identity_doc,
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, 400)

    @patch('cases.serializers.validate_airport_code_from_lookup', side_effect=lambda field, code: code.strip().upper())
    def test_case_creation_with_cancellation_disruption(self, _mock):
        disruption = {
            'disruption_type': 'cancellation',
            'cancellation_notice': 'less_than_14_days',
            'airline_mentioned_motive': 'yes',
            'airline_motive': 'technical',
            'incident_description': 'Flight cancelled 5 days before.',
        }
        payload = _make_case_payload(disruption)

        boarding_pass = SimpleUploadedFile('bp.pdf', b'%PDF-content', content_type='application/pdf')
        identity_doc = SimpleUploadedFile('id.pdf', b'%PDF-content', content_type='application/pdf')

        response = self.client.post(
            '/api/cases/',
            data={
                'payload': json.dumps(payload),
                'boarding_pass': boarding_pass,
                'identity_document': identity_doc,
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data['disruption']['disruption_type'], 'cancellation')
        self.assertEqual(data['disruption']['cancellation_notice'], 'less_than_14_days')
        self.assertEqual(data['disruption']['airline_motive'], 'technical')

    @patch('cases.serializers.validate_airport_code_from_lookup', side_effect=lambda field, code: code.strip().upper())
    def test_case_creation_with_delay_disruption(self, _mock):
        disruption = {
            'disruption_type': 'delay',
            'delay_arrival': 'more_than_3h',
            'airline_mentioned_motive': 'no',
            'incident_description': 'Arrived 4 hours late.',
        }
        payload = _make_case_payload(disruption)

        boarding_pass = SimpleUploadedFile('bp.pdf', b'%PDF-content', content_type='application/pdf')
        identity_doc = SimpleUploadedFile('id.pdf', b'%PDF-content', content_type='application/pdf')

        response = self.client.post(
            '/api/cases/',
            data={
                'payload': json.dumps(payload),
                'boarding_pass': boarding_pass,
                'identity_document': identity_doc,
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data['disruption']['disruption_type'], 'delay')
        self.assertEqual(data['disruption']['delay_arrival'], 'more_than_3h')

    @patch('cases.serializers.validate_airport_code_from_lookup', side_effect=lambda field, code: code.strip().upper())
    def test_case_creation_with_denied_boarding_disruption(self, _mock):
        disruption = {
            'disruption_type': 'denied_boarding',
            'voluntary_give_up': 'no',
            'denial_reason': 'overbooked',
            'incident_description': 'Denied boarding due to overbooking.',
        }
        payload = _make_case_payload(disruption)

        boarding_pass = SimpleUploadedFile('bp.pdf', b'%PDF-content', content_type='application/pdf')
        identity_doc = SimpleUploadedFile('id.pdf', b'%PDF-content', content_type='application/pdf')

        response = self.client.post(
            '/api/cases/',
            data={
                'payload': json.dumps(payload),
                'boarding_pass': boarding_pass,
                'identity_document': identity_doc,
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data['disruption']['disruption_type'], 'denied_boarding')
        self.assertEqual(data['disruption']['voluntary_give_up'], 'no')
        self.assertEqual(data['disruption']['denial_reason'], 'overbooked')

    @patch('cases.serializers.validate_airport_code_from_lookup', side_effect=lambda field, code: code.strip().upper())
    def test_case_creation_with_minimal_disruption(self, _mock):
        """Only disruption_type is required, no validation on other answers."""
        disruption = {
            'disruption_type': 'delay',
        }
        payload = _make_case_payload(disruption)

        boarding_pass = SimpleUploadedFile('bp.pdf', b'%PDF-content', content_type='application/pdf')
        identity_doc = SimpleUploadedFile('id.pdf', b'%PDF-content', content_type='application/pdf')

        response = self.client.post(
            '/api/cases/',
            data={
                'payload': json.dumps(payload),
                'boarding_pass': boarding_pass,
                'identity_document': identity_doc,
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, 201)
