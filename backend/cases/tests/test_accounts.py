from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from cases.models import Case, CaseStatus, Passenger, PassengerUser
from cases.services.accounts import create_passenger_account, generate_password


class GeneratePasswordTest(TestCase):
    def test_generates_password_of_correct_length(self):
        password = generate_password(12)
        self.assertEqual(len(password), 12)

    def test_generates_different_passwords(self):
        p1 = generate_password()
        p2 = generate_password()
        self.assertNotEqual(p1, p2)

    def test_custom_length(self):
        password = generate_password(20)
        self.assertEqual(len(password), 20)


class CreatePassengerAccountTest(TestCase):
    def setUp(self):
        self.case = Case.objects.create(
            status=CaseStatus.NEW,
            reservation_number='TEST123',
            gdpr_consent=True,
            updates_consent=True,
        )
        self.passenger = Passenger.objects.create(
            case=self.case,
            first_name='John',
            last_name='Doe',
            date_of_birth='1990-01-15',
            email='john.doe@example.com',
            phone='+1234567890',
            address='123 Test St',
            postal_code='12345',
        )

    @patch('cases.services.accounts.send_mail')
    def test_creates_user_account(self, mock_send_mail):
        user, password = create_passenger_account(self.case)

        self.assertIsNotNone(user)
        self.assertIsNotNone(password)
        self.assertEqual(user.email, 'john.doe@example.com')
        self.assertEqual(user.username, 'john.doe@example.com')
        self.assertEqual(user.first_name, 'John')
        self.assertEqual(user.last_name, 'Doe')
        self.assertTrue(user.check_password(password))

    @patch('cases.services.accounts.send_mail')
    def test_creates_passenger_user_link(self, mock_send_mail):
        user, _ = create_passenger_account(self.case)

        passenger_user = PassengerUser.objects.get(user=user, case=self.case)
        self.assertTrue(passenger_user.must_change_password)

    @patch('cases.services.accounts.send_mail')
    def test_sends_welcome_email(self, mock_send_mail):
        user, password = create_passenger_account(self.case)

        mock_send_mail.assert_called_once()
        call_args = mock_send_mail.call_args
        self.assertIn('john.doe@example.com', call_args[0][3])  # recipient
        self.assertIn(password, call_args[0][1])  # password in message body

    @patch('cases.services.accounts.send_mail')
    def test_existing_user_no_new_account(self, mock_send_mail):
        # Create existing user
        User.objects.create_user(
            username='john.doe@example.com',
            email='john.doe@example.com',
            password='existingpass',
        )

        user, password = create_passenger_account(self.case)

        self.assertIsNone(password)  # No new password generated
        self.assertEqual(User.objects.filter(email='john.doe@example.com').count(), 1)
        mock_send_mail.assert_not_called()


class LoginViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.case = Case.objects.create(
            status=CaseStatus.NEW,
            reservation_number='TEST123',
            gdpr_consent=True,
            updates_consent=True,
        )
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='testpass123',
        )
        self.passenger_user = PassengerUser.objects.create(
            user=self.user,
            case=self.case,
            must_change_password=True,
        )

    def test_login_success(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'test@example.com',
            'password': 'testpass123',
        })

        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.data)
        self.assertTrue(response.data['must_change_password'])
        self.assertEqual(response.data['user']['email'], 'test@example.com')

    def test_login_invalid_credentials(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'test@example.com',
            'password': 'wrongpassword',
        })

        self.assertEqual(response.status_code, 400)

    def test_login_nonexistent_user(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'nonexistent@example.com',
            'password': 'testpass123',
        })

        self.assertEqual(response.status_code, 400)

    def test_login_must_change_password_false(self):
        self.passenger_user.must_change_password = False
        self.passenger_user.save()

        response = self.client.post('/api/auth/login/', {
            'email': 'test@example.com',
            'password': 'testpass123',
        })

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['must_change_password'])


class ChangePasswordViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.case = Case.objects.create(
            status=CaseStatus.NEW,
            reservation_number='TEST123',
            gdpr_consent=True,
            updates_consent=True,
        )
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='testpass123',
        )
        self.passenger_user = PassengerUser.objects.create(
            user=self.user,
            case=self.case,
            must_change_password=True,
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_change_password_success(self):
        response = self.client.post('/api/auth/change-password/', {
            'new_password': 'newpass1234',
            'confirm_password': 'newpass1234',
        })

        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.data)
        # New token should be different
        self.assertNotEqual(response.data['token'], self.token.key)

        # Password changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpass1234'))

        # must_change_password cleared
        self.passenger_user.refresh_from_db()
        self.assertFalse(self.passenger_user.must_change_password)

    def test_change_password_mismatch(self):
        response = self.client.post('/api/auth/change-password/', {
            'new_password': 'newpass1234',
            'confirm_password': 'different123',
        })

        self.assertEqual(response.status_code, 400)

    def test_change_password_too_short(self):
        response = self.client.post('/api/auth/change-password/', {
            'new_password': 'short',
            'confirm_password': 'short',
        })

        self.assertEqual(response.status_code, 400)

    def test_change_password_unauthenticated(self):
        self.client.credentials()  # Remove auth
        response = self.client.post('/api/auth/change-password/', {
            'new_password': 'newpass1234',
            'confirm_password': 'newpass1234',
        })

        self.assertEqual(response.status_code, 401)
