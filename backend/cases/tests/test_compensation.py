from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from cases.models import Case, CaseStatus, FlightSegment, Passenger
from cases.services.airportgap import AirportLookupError
from cases.services.compensation import calculate_compensation


class CompensationThresholdTests(TestCase):
    """Test EC261/2004 compensation threshold logic."""

    def test_short_distance_below_1500(self):
        self.assertEqual(calculate_compensation(0), 250)
        self.assertEqual(calculate_compensation(500), 250)
        self.assertEqual(calculate_compensation(1499.9), 250)

    def test_medium_distance_1500_to_3500(self):
        self.assertEqual(calculate_compensation(1500), 400)
        self.assertEqual(calculate_compensation(2500), 400)
        self.assertEqual(calculate_compensation(3500), 400)

    def test_long_distance_above_3500(self):
        self.assertEqual(calculate_compensation(3500.1), 600)
        self.assertEqual(calculate_compensation(5000), 600)
        self.assertEqual(calculate_compensation(10000), 600)


class CompensationCalculateEndpointTests(TestCase):
    """Test the POST /api/cases/<id>/calculate-compensation/ endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.case = Case.objects.create(
            status=CaseStatus.NEW,
            reservation_number='TEST123',
            gdpr_consent=True,
            updates_consent=True,
        )
        Passenger.objects.create(
            case=self.case,
            first_name='John',
            last_name='Doe',
            date_of_birth='1990-01-15',
            email='john@example.com',
            phone='+1234567890',
            address='123 Main St',
            postal_code='12345',
        )
        FlightSegment.objects.create(
            case=self.case,
            sequence=1,
            flight_date='2026-08-01',
            flight_number='LH100',
            airline='Lufthansa',
            departing_airport_code='FRA',
            destination_airport_code='CDG',
            planned_departure_time='2026-08-01T10:00:00Z',
            planned_arrival_time='2026-08-01T11:30:00Z',
            is_connection=False,
            is_problem_flight=True,
        )

    @patch('cases.views.calculate_distance')
    def test_calculate_compensation_short_flight(self, mock_distance):
        mock_distance.return_value = 450.0
        response = self.client.post(f'/api/cases/{self.case.id}/calculate-compensation/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['distance_km'], 450.0)
        self.assertEqual(data['compensation_amount'], 250)
        self.assertEqual(data['from_airport'], 'FRA')
        self.assertEqual(data['to_airport'], 'CDG')

        # Verify persisted
        self.case.refresh_from_db()
        self.assertEqual(self.case.distance_km, Decimal('450.00'))
        self.assertEqual(self.case.compensation_amount, Decimal('250.00'))

    @patch('cases.views.calculate_distance')
    def test_calculate_compensation_medium_flight(self, mock_distance):
        mock_distance.return_value = 2500.0
        response = self.client.post(f'/api/cases/{self.case.id}/calculate-compensation/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['compensation_amount'], 400)

    @patch('cases.views.calculate_distance')
    def test_calculate_compensation_long_flight(self, mock_distance):
        mock_distance.return_value = 5000.0
        response = self.client.post(f'/api/cases/{self.case.id}/calculate-compensation/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['compensation_amount'], 600)

    @patch('cases.views.calculate_distance')
    def test_api_unavailable_returns_503(self, mock_distance):
        mock_distance.side_effect = AirportLookupError('Distance calculation is temporarily unavailable.')
        response = self.client.post(f'/api/cases/{self.case.id}/calculate-compensation/')
        self.assertEqual(response.status_code, 503)

    def test_nonexistent_case_returns_404(self):
        response = self.client.post('/api/cases/99999/calculate-compensation/')
        self.assertEqual(response.status_code, 404)

    def test_case_without_segments_returns_400(self):
        case_no_segments = Case.objects.create(
            status=CaseStatus.NEW,
            reservation_number='EMPTY',
            gdpr_consent=True,
            updates_consent=True,
        )
        response = self.client.post(f'/api/cases/{case_no_segments.id}/calculate-compensation/')
        self.assertEqual(response.status_code, 400)

    @patch('cases.views.calculate_distance')
    def test_connecting_flights_uses_first_departure_last_destination(self, mock_distance):
        """Distance is calculated from the first departure to the last destination (connecting flights not considered)."""
        # Add a connecting segment
        FlightSegment.objects.create(
            case=self.case,
            sequence=2,
            flight_date='2026-08-01',
            flight_number='AF200',
            airline='Air France',
            departing_airport_code='CDG',
            destination_airport_code='JFK',
            planned_departure_time='2026-08-01T14:00:00Z',
            planned_arrival_time='2026-08-01T17:00:00Z',
            is_connection=True,
            is_problem_flight=False,
        )
        mock_distance.return_value = 6200.0
        response = self.client.post(f'/api/cases/{self.case.id}/calculate-compensation/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Should use FRA (first departure) -> JFK (last destination)
        self.assertEqual(data['from_airport'], 'FRA')
        self.assertEqual(data['to_airport'], 'JFK')
        self.assertEqual(data['compensation_amount'], 600)
        mock_distance.assert_called_once_with('FRA', 'JFK')


class DistanceServiceTests(TestCase):
    """Test the distance calculation service."""

    @patch('cases.services.airportgap.requests.post')
    def test_calculate_distance_success(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.raise_for_status = lambda: None
        mock_post.return_value.json.return_value = {
            'data': {
                'attributes': {
                    'kilometers': 478.18,
                    'miles': 297.12,
                    'nautical_miles': 258.2,
                }
            }
        }
        from cases.services.airportgap import calculate_distance
        result = calculate_distance('FRA', 'CDG')
        self.assertAlmostEqual(result, 478.18, places=2)

    @patch('cases.services.airportgap.requests.post')
    def test_calculate_distance_api_error(self, mock_post):
        import requests
        mock_post.side_effect = requests.RequestException('Connection error')
        from cases.services.airportgap import calculate_distance
        with self.assertRaises(AirportLookupError):
            calculate_distance('FRA', 'CDG')
