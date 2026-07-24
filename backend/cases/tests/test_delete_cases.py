from datetime import timedelta

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from cases.models import (
    Case,
    CaseStatus,
    Disruption,
    DisruptionType,
    Document,
    DocumentType,
    FlightSegment,
    Passenger,
)


def create_case_with_relations():
    """Create a case with all related objects for testing."""
    case = Case.objects.create(
        status=CaseStatus.NEW,
        reservation_number='PNR-TEST-001',
        gdpr_consent=True,
        updates_consent=False,
    )
    Passenger.objects.create(
        case=case,
        first_name='Ana',
        last_name='Ionescu',
        date_of_birth='1990-05-12',
        email='ana@example.com',
        phone='+40123456789',
        address='123 Main Street',
        postal_code='400001',
    )
    departure_time = timezone.now() + timedelta(days=5)
    arrival_time = departure_time + timedelta(hours=3)
    FlightSegment.objects.create(
        case=case,
        sequence=1,
        flight_date=departure_time.date(),
        flight_number='RO101',
        airline='Tarom',
        departing_airport_code='CLJ',
        destination_airport_code='OTP',
        planned_departure_time=departure_time,
        planned_arrival_time=arrival_time,
        is_connection=False,
        is_problem_flight=True,
    )
    Disruption.objects.create(
        case=case,
        disruption_type=DisruptionType.DELAY,
    )
    return case


class CaseListViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin@test.com',
            email='admin@test.com',
            password='adminpass123',
        )
        self.admin_token = Token.objects.create(user=self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        self.case1 = create_case_with_relations()
        self.case2 = create_case_with_relations()

    def test_list_cases_returns_all_cases(self):
        response = self.client.get('/api/cases/list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_list_cases_returns_expected_fields(self):
        response = self.client.get('/api/cases/list/')
        case_data = response.data[0]
        self.assertIn('id', case_data)
        self.assertIn('status', case_data)
        self.assertIn('created_at', case_data)
        self.assertIn('flight_number', case_data)
        self.assertIn('flight_date', case_data)

    def test_list_cases_returns_flight_info(self):
        response = self.client.get('/api/cases/list/')
        case_data = response.data[0]
        self.assertEqual(case_data['flight_number'], 'RO101')
        self.assertIsNotNone(case_data['flight_date'])

    def test_list_cases_requires_admin(self):
        regular_user = User.objects.create_user(
            username='user@test.com',
            email='user@test.com',
            password='pass1234',
        )
        regular_token = Token.objects.create(user=regular_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {regular_token.key}')
        response = self.client.get('/api/cases/list/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_cases_requires_authentication(self):
        self.client.credentials()
        response = self.client.get('/api/cases/list/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CaseDeleteViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin@test.com',
            email='admin@test.com',
            password='adminpass123',
        )
        self.admin_token = Token.objects.create(user=self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        self.case = create_case_with_relations()

    def test_delete_case_succeeds(self):
        response = self.client.delete(f'/api/cases/{self.case.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'Case deleted successfully.')
        self.assertFalse(Case.objects.filter(id=self.case.id).exists())

    def test_delete_case_removes_related_data(self):
        case_id = self.case.id
        self.client.delete(f'/api/cases/{case_id}/')
        self.assertFalse(Passenger.objects.filter(case_id=case_id).exists())
        self.assertFalse(FlightSegment.objects.filter(case_id=case_id).exists())
        self.assertFalse(Disruption.objects.filter(case_id=case_id).exists())

    def test_delete_nonexistent_case_returns_404(self):
        response = self.client.delete('/api/cases/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['detail'], 'Case not found.')

    def test_delete_case_requires_admin(self):
        regular_user = User.objects.create_user(
            username='user@test.com',
            email='user@test.com',
            password='pass1234',
        )
        regular_token = Token.objects.create(user=regular_user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {regular_token.key}')
        response = self.client.delete(f'/api/cases/{self.case.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # Case should still exist
        self.assertTrue(Case.objects.filter(id=self.case.id).exists())

    def test_delete_case_requires_authentication(self):
        self.client.credentials()
        response = self.client.delete(f'/api/cases/{self.case.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(Case.objects.filter(id=self.case.id).exists())

    def test_get_case_still_works_without_auth(self):
        """GET on CaseDetailView should still work without admin permissions."""
        self.client.credentials()
        response = self.client.get(f'/api/cases/{self.case.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_does_not_affect_other_cases(self):
        other_case = create_case_with_relations()
        self.client.delete(f'/api/cases/{self.case.id}/')
        self.assertTrue(Case.objects.filter(id=other_case.id).exists())
