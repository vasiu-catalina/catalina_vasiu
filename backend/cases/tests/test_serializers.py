from copy import deepcopy
from datetime import timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone

from cases.serializers import CaseCreateSerializer


def build_payload():
    departure_time = timezone.now() + timedelta(days=7)
    arrival_time = departure_time + timedelta(hours=2)
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
                'departing_airport_code': 'clj',
                'destination_airport_code': 'otp',
                'planned_departure_time': departure_time.isoformat(),
                'planned_arrival_time': arrival_time.isoformat(),
                'is_connection': False,
                'is_problem_flight': True,
            }
        ],
    }


def build_documents():
    return {
        'boarding_pass': SimpleUploadedFile('boarding-pass.pdf', b'pdf-content', content_type='application/pdf'),
        'identity_document': SimpleUploadedFile('passport.jpg', b'jpg-content', content_type='image/jpeg'),
    }


class CaseCreateSerializerTests(TestCase):
    def test_serializer_accepts_valid_payload(self):
        serializer = CaseCreateSerializer(data=build_payload(), context={'documents': build_documents()})

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_rejects_more_than_four_connections(self):
        payload = build_payload()
        base_segment = payload['flight_segments'][0]
        payload['flight_segments'] = [
            {**deepcopy(base_segment), 'sequence': index + 1, 'is_connection': index > 0, 'is_problem_flight': index == 0}
            for index in range(6)
        ]
        serializer = CaseCreateSerializer(data=payload, context={'documents': build_documents()})

        self.assertFalse(serializer.is_valid())
        self.assertIn('flight_segments', serializer.errors)

    def test_serializer_rejects_missing_problem_flight(self):
        payload = build_payload()
        payload['flight_segments'][0]['is_problem_flight'] = False
        serializer = CaseCreateSerializer(data=payload, context={'documents': build_documents()})

        self.assertFalse(serializer.is_valid())
        self.assertIn('flight_segments', serializer.errors)

    def test_serializer_rejects_missing_gdpr_consent(self):
        payload = build_payload()
        payload['gdpr_consent'] = False
        serializer = CaseCreateSerializer(data=payload, context={'documents': build_documents()})

        self.assertFalse(serializer.is_valid())
        self.assertIn('gdpr_consent', serializer.errors)

    def test_serializer_rejects_unsupported_document_type(self):
        documents = build_documents()
        documents['identity_document'] = SimpleUploadedFile('passport.png', b'png-content', content_type='image/png')
        serializer = CaseCreateSerializer(data=build_payload(), context={'documents': documents})

        self.assertFalse(serializer.is_valid())
        self.assertIn('identity_document', serializer.errors)