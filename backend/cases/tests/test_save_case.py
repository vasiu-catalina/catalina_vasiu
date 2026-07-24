"""Tests for Case 04 – Save Case requirements."""
import json
from datetime import timedelta
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from cases.models import Case, CaseStatus, Disruption, FlightSegment, Passenger


def airport_lookup_side_effect(query):
    code = query.strip().upper()
    if code in {'CLJ', 'OTP', 'FRA'}:
        return [{'code': code, 'name': f'{code} Airport', 'city': 'City', 'country': 'Country', 'label': f'{code} - Airport'}]
    return []


def build_full_payload():
    departure_time = timezone.now() + timedelta(days=5)
    arrival_time = departure_time + timedelta(hours=3)
    return {
        'reservation_number': 'CASE04TEST',
        'gdpr_consent': True,
        'updates_consent': True,
        'passenger': {
            'first_name': 'Maria',
            'last_name': 'Popescu',
            'date_of_birth': '1985-03-15',
            'email': 'maria@example.com',
            'phone': '+40700111222',
            'address': '456 Test Boulevard',
            'postal_code': '500001',
        },
        'flight_segments': [
            {
                'sequence': 1,
                'flight_date': departure_time.date().isoformat(),
                'flight_number': 'W6 3101',
                'airline': 'Wizz Air',
                'departing_airport_code': 'CLJ',
                'destination_airport_code': 'OTP',
                'planned_departure_time': departure_time.isoformat(),
                'planned_arrival_time': arrival_time.isoformat(),
                'is_connection': False,
                'is_problem_flight': True,
            }
        ],
        'disruption': {
            'disruption_type': 'delay',
            'delay_arrival': 'more_than_3h',
            'airline_mentioned_motive': 'yes',
            'airline_motive': 'technical',
            'incident_description': 'Flight delayed by 4 hours due to technical issue.',
        },
    }


def create_case_request(client, payload=None):
    if payload is None:
        payload = build_full_payload()
    return client.post(
        reverse('case-create'),
        data={
            'payload': json.dumps(payload),
            'boarding_pass': SimpleUploadedFile('bp.pdf', b'pdf-content', content_type='application/pdf'),
            'identity_document': SimpleUploadedFile('id.png', b'png-content', content_type='image/png'),
        },
        format='multipart',
    )


class SaveCaseTests(TestCase):
    """Case 04: Verify case creation saves all details transactionally."""

    def setUp(self):
        self.client = APIClient()

    @patch('cases.serializers.search_airports', side_effect=airport_lookup_side_effect)
    def test_case_created_with_unique_id_and_date(self, _mock):
        response = create_case_request(self.client)

        self.assertEqual(response.status_code, 201)
        case = Case.objects.get()
        self.assertIsNotNone(case.id)
        self.assertIsNotNone(case.created_at)

    @patch('cases.serializers.search_airports', side_effect=airport_lookup_side_effect)
    def test_colleague_field_initially_empty(self, _mock):
        response = create_case_request(self.client)

        self.assertEqual(response.status_code, 201)
        case = Case.objects.get()
        self.assertIsNone(case.colleague)
        # Also check serialized output includes colleague
        self.assertIn('colleague', response.data)
        self.assertIsNone(response.data['colleague'])

    @patch('cases.serializers.search_airports', side_effect=airport_lookup_side_effect)
    def test_all_passenger_details_saved(self, _mock):
        response = create_case_request(self.client)

        self.assertEqual(response.status_code, 201)
        passenger = Passenger.objects.get()
        self.assertEqual(passenger.first_name, 'Maria')
        self.assertEqual(passenger.last_name, 'Popescu')
        self.assertEqual(str(passenger.date_of_birth), '1985-03-15')
        self.assertEqual(passenger.email, 'maria@example.com')
        self.assertEqual(passenger.phone, '+40700111222')
        self.assertEqual(passenger.address, '456 Test Boulevard')
        self.assertEqual(passenger.postal_code, '500001')

    @patch('cases.serializers.search_airports', side_effect=airport_lookup_side_effect)
    def test_all_flight_details_saved(self, _mock):
        response = create_case_request(self.client)

        self.assertEqual(response.status_code, 201)
        segment = FlightSegment.objects.get()
        self.assertEqual(segment.flight_number, 'W6 3101')
        self.assertEqual(segment.airline, 'Wizz Air')
        self.assertEqual(segment.departing_airport_code, 'CLJ')
        self.assertEqual(segment.destination_airport_code, 'OTP')
        self.assertTrue(segment.is_problem_flight)
        self.assertFalse(segment.is_connection)

    @patch('cases.serializers.search_airports', side_effect=airport_lookup_side_effect)
    def test_all_disruption_details_saved(self, _mock):
        response = create_case_request(self.client)

        self.assertEqual(response.status_code, 201)
        disruption = Disruption.objects.get()
        self.assertEqual(disruption.disruption_type, 'delay')
        self.assertEqual(disruption.delay_arrival, 'more_than_3h')
        self.assertEqual(disruption.airline_mentioned_motive, 'yes')
        self.assertEqual(disruption.airline_motive, 'technical')
        self.assertIn('technical issue', disruption.incident_description)

    @patch('cases.serializers.search_airports', side_effect=airport_lookup_side_effect)
    def test_transactional_save_no_partial_data_on_failure(self, _mock):
        """If saving disruption fails, no case/passenger/flight should remain."""
        with patch('cases.serializers.Disruption.objects.create', side_effect=IntegrityError('simulated failure')):
            response = create_case_request(self.client)

        self.assertEqual(response.status_code, 503)
        self.assertEqual(Case.objects.count(), 0)
        self.assertEqual(Passenger.objects.count(), 0)
        self.assertEqual(FlightSegment.objects.count(), 0)

    @patch('cases.serializers.search_airports', side_effect=airport_lookup_side_effect)
    def test_database_failure_returns_error_message(self, _mock):
        with patch('cases.serializers.Case.objects.create', side_effect=IntegrityError('db error')):
            response = create_case_request(self.client)

        self.assertEqual(response.status_code, 503)
        self.assertIn('detail', response.data)
        self.assertIn('Failed to save case', response.data['detail'])

    @patch('cases.serializers.search_airports', side_effect=airport_lookup_side_effect)
    def test_case_list_returns_created_cases(self, _mock):
        create_case_request(self.client)
        create_case_request(self.client)

        response = self.client.get(reverse('case-list'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    @patch('cases.serializers.search_airports', side_effect=airport_lookup_side_effect)
    def test_case_detail_returns_full_case(self, _mock):
        create_response = create_case_request(self.client)
        case_id = create_response.data['id']

        response = self.client.get(reverse('case-detail', kwargs={'case_id': case_id}))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['id'], case_id)
        self.assertEqual(response.data['reservation_number'], 'CASE04TEST')
        self.assertIsNotNone(response.data['passenger'])
        self.assertEqual(len(response.data['flight_segments']), 1)
        self.assertIsNotNone(response.data['disruption'])

    def test_case_detail_returns_404_for_nonexistent_case(self):
        response = self.client.get(reverse('case-detail', kwargs={'case_id': 9999}))

        self.assertEqual(response.status_code, 404)

    @patch('cases.serializers.search_airports', side_effect=airport_lookup_side_effect)
    def test_multiple_cases_have_unique_ids(self, _mock):
        r1 = create_case_request(self.client)
        r2 = create_case_request(self.client)

        self.assertNotEqual(r1.data['id'], r2.data['id'])

    @patch('cases.serializers.search_airports', side_effect=airport_lookup_side_effect)
    def test_case_includes_reservation_number(self, _mock):
        response = create_case_request(self.client)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['reservation_number'], 'CASE04TEST')
