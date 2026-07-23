from unittest.mock import Mock, patch

from django.test import SimpleTestCase, override_settings
import requests

from cases.services.airportgap import AirportLookupError, search_airports


class AirportGapServiceTests(SimpleTestCase):
    @override_settings(AIRPORTGAP_API_TOKEN='token-123')
    @patch('cases.services.airportgap.requests.get')
    def test_exact_code_lookup_uses_airport_id_endpoint(self, mock_get):
        mock_response = Mock()
        mock_response.json.return_value = {
            'data': {
                'id': 'OTP',
                'attributes': {
                    'iata': 'OTP',
                    'name': 'Henri Coanda International Airport',
                    'city': 'Bucharest',
                    'country': 'Romania',
                },
            }
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        results = search_airports('otp')

        self.assertEqual(results[0]['code'], 'OTP')
        mock_get.assert_called_once()

    @patch('cases.services.airportgap.requests.get')
    def test_lookup_raises_domain_error_on_request_failure(self, mock_get):
        mock_get.side_effect = requests.RequestException('network')

        with self.assertRaises(AirportLookupError):
            search_airports('OTP')