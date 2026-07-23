import json
from datetime import timedelta
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from cases.models import Case, CaseStatus
from cases.services.airportgap import AirportLookupError


def build_payload():
    departure_time = timezone.now() + timedelta(days=5)
    arrival_time = departure_time + timedelta(hours=3)
    return {
        'reservation_number': 'PNR123',
        'gdpr_consent': True,
        'updates_consent': False,
        'passenger': {
            'first_name': 'Ana',
            'last_name': 'Ionescu',
            'date_of_birth': '1990-05-12',
            'email': 'ana@example.com',
            'phone': '+40123456789',
            'address': '123 Main Street',
            'postal_code': '400001',
        },
        'flight_segments': [
            {
                'sequence': 1,
                'flight_date': departure_time.date().isoformat(),
                'flight_number': 'RO101',
                'airline': 'Tarom',
                'departing_airport_code': 'CLJ',
                'destination_airport_code': 'OTP',
                'planned_departure_time': departure_time.isoformat(),
                'planned_arrival_time': arrival_time.isoformat(),
                'is_connection': False,
                'is_problem_flight': True,
            }
        ],
    }


class CaseApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_create_case_persists_nested_records(self):
        response = self.client.post(
            reverse('case-create'),
            data={
                'payload': json.dumps(build_payload()),
                'boarding_pass': SimpleUploadedFile('boarding-pass.pdf', b'pdf-content', content_type='application/pdf'),
                'identity_document': SimpleUploadedFile('passport.jpg', b'jpg-content', content_type='image/jpeg'),
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['status'], CaseStatus.NEW)
        self.assertEqual(Case.objects.count(), 1)
        self.assertEqual(Case.objects.get().flight_segments.count(), 1)
        self.assertEqual(Case.objects.get().documents.count(), 2)

    def test_create_case_rejects_invalid_json_payload(self):
        response = self.client.post(reverse('case-create'), data={'payload': '{not-json'}, format='multipart')

        self.assertEqual(response.status_code, 400)
        self.assertIn('payload', response.data)

    @patch('cases.views.search_airports')
    def test_airport_lookup_returns_normalized_results(self, mock_search_airports):
        mock_search_airports.return_value = [
            {
                'code': 'OTP',
                'name': 'Henri Coanda International Airport',
                'city': 'Bucharest',
                'country': 'Romania',
                'label': 'OTP - Henri Coanda International Airport / Bucharest / Romania',
            }
        ]

        response = self.client.get(reverse('airport-lookup'), {'query': 'OTP'})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['results'][0]['code'], 'OTP')

    @patch('cases.views.search_airports', side_effect=AirportLookupError('Airport lookup is temporarily unavailable.'))
    def test_airport_lookup_returns_service_unavailable_on_failure(self, _mock_search_airports):
        response = self.client.get(reverse('airport-lookup'), {'query': 'OTP'})

        self.assertEqual(response.status_code, 503)