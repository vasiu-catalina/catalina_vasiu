import pytest
from django.contrib.auth.models import User
from django.core import mail
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from cases.models import ColleagueProfile, ColleagueRole


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(
        username='admin@airassist.com',
        email='admin@airassist.com',
        password='Admin1234!',
        first_name='System',
        last_name='Admin',
    )
    ColleagueProfile.objects.create(user=user, role=ColleagueRole.ADMIN, must_change_password=False)
    return user


@pytest.fixture
def admin_token(admin_user):
    token, _ = Token.objects.get_or_create(user=admin_user)
    return token.key


@pytest.fixture
def colleague_user(db):
    user = User.objects.create_user(
        username='colleague@airassist.com',
        email='colleague@airassist.com',
        password='Colleague1!',
        first_name='John',
        last_name='Doe',
    )
    ColleagueProfile.objects.create(user=user, role=ColleagueRole.COLLEAGUE, must_change_password=False)
    return user


@pytest.fixture
def colleague_token(colleague_user):
    token, _ = Token.objects.get_or_create(user=colleague_user)
    return token.key


@pytest.mark.django_db
class TestColleagueCreation:

    def test_admin_can_create_colleague(self, api_client, admin_token):
        """Admin can successfully create a colleague account."""
        response = api_client.post(
            '/api/admin/colleagues/',
            {
                'first_name': 'Jane',
                'last_name': 'Smith',
                'email': 'jane.smith@airassist.com',
                'password': 'Initial123!',
            },
            format='json',
            HTTP_AUTHORIZATION=f'Token {admin_token}',
        )
        assert response.status_code == 201
        data = response.json()
        assert data['email'] == 'jane.smith@airassist.com'
        assert data['first_name'] == 'Jane'
        assert data['last_name'] == 'Smith'
        assert data['message'] == 'Colleague account created successfully.'

        # Verify user was created in DB
        user = User.objects.get(email='jane.smith@airassist.com')
        assert user.first_name == 'Jane'
        assert user.last_name == 'Smith'

        # Verify colleague profile was created
        profile = ColleagueProfile.objects.get(user=user)
        assert profile.role == ColleagueRole.COLLEAGUE
        assert profile.must_change_password is True

    def test_colleague_cannot_create_colleague(self, api_client, colleague_token):
        """Non-admin colleague cannot create accounts."""
        response = api_client.post(
            '/api/admin/colleagues/',
            {
                'first_name': 'Jane',
                'last_name': 'Smith',
                'email': 'jane.smith@airassist.com',
                'password': 'Initial123!',
            },
            format='json',
            HTTP_AUTHORIZATION=f'Token {colleague_token}',
        )
        assert response.status_code == 403
        assert 'Only admins' in response.json()['detail']

    def test_unauthenticated_cannot_create_colleague(self, api_client):
        """Unauthenticated users cannot create accounts."""
        response = api_client.post(
            '/api/admin/colleagues/',
            {
                'first_name': 'Jane',
                'last_name': 'Smith',
                'email': 'jane.smith@airassist.com',
                'password': 'Initial123!',
            },
            format='json',
        )
        assert response.status_code == 401

    def test_duplicate_email_rejected(self, api_client, admin_token, admin_user):
        """Cannot create colleague with existing email."""
        response = api_client.post(
            '/api/admin/colleagues/',
            {
                'first_name': 'Another',
                'last_name': 'Admin',
                'email': 'admin@airassist.com',
                'password': 'Initial123!',
            },
            format='json',
            HTTP_AUTHORIZATION=f'Token {admin_token}',
        )
        assert response.status_code == 400
        assert 'email' in response.json()

    def test_invalid_email_rejected(self, api_client, admin_token):
        """Invalid email format is rejected."""
        response = api_client.post(
            '/api/admin/colleagues/',
            {
                'first_name': 'Jane',
                'last_name': 'Smith',
                'email': 'not-an-email',
                'password': 'Initial123!',
            },
            format='json',
            HTTP_AUTHORIZATION=f'Token {admin_token}',
        )
        assert response.status_code == 400
        assert 'email' in response.json()

    def test_short_password_rejected(self, api_client, admin_token):
        """Password shorter than 8 chars is rejected."""
        response = api_client.post(
            '/api/admin/colleagues/',
            {
                'first_name': 'Jane',
                'last_name': 'Smith',
                'email': 'jane@airassist.com',
                'password': 'short',
            },
            format='json',
            HTTP_AUTHORIZATION=f'Token {admin_token}',
        )
        assert response.status_code == 400
        assert 'password' in response.json()

    def test_missing_fields_rejected(self, api_client, admin_token):
        """Missing required fields are rejected."""
        response = api_client.post(
            '/api/admin/colleagues/',
            {'email': 'jane@airassist.com'},
            format='json',
            HTTP_AUTHORIZATION=f'Token {admin_token}',
        )
        assert response.status_code == 400

    def test_welcome_email_sent(self, api_client, admin_token, settings):
        """Welcome email is sent after colleague creation."""
        settings.EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
        response = api_client.post(
            '/api/admin/colleagues/',
            {
                'first_name': 'Jane',
                'last_name': 'Smith',
                'email': 'jane.smith@airassist.com',
                'password': 'Initial123!',
            },
            format='json',
            HTTP_AUTHORIZATION=f'Token {admin_token}',
        )
        assert response.status_code == 201
        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == ['jane.smith@airassist.com']
        assert 'Initial123!' in mail.outbox[0].body
        assert 'Jane' in mail.outbox[0].body

    def test_new_colleague_must_change_password_on_login(self, api_client, admin_token):
        """New colleague gets must_change_password=True on login."""
        # Create colleague
        api_client.post(
            '/api/admin/colleagues/',
            {
                'first_name': 'Jane',
                'last_name': 'Smith',
                'email': 'jane.smith@airassist.com',
                'password': 'Initial123!',
            },
            format='json',
            HTTP_AUTHORIZATION=f'Token {admin_token}',
        )

        # Login as new colleague
        response = api_client.post(
            '/api/auth/login/',
            {'email': 'jane.smith@airassist.com', 'password': 'Initial123!'},
            format='json',
        )
        assert response.status_code == 200
        data = response.json()
        assert data['must_change_password'] is True
        assert data['user']['role'] == 'colleague'

    def test_colleague_can_change_password(self, api_client, admin_token):
        """New colleague can change password and flag is cleared."""
        # Create colleague
        api_client.post(
            '/api/admin/colleagues/',
            {
                'first_name': 'Jane',
                'last_name': 'Smith',
                'email': 'jane.smith@airassist.com',
                'password': 'Initial123!',
            },
            format='json',
            HTTP_AUTHORIZATION=f'Token {admin_token}',
        )

        # Login
        login_resp = api_client.post(
            '/api/auth/login/',
            {'email': 'jane.smith@airassist.com', 'password': 'Initial123!'},
            format='json',
        )
        token = login_resp.json()['token']

        # Change password
        change_resp = api_client.post(
            '/api/auth/change-password/',
            {'new_password': 'NewSecure123!', 'confirm_password': 'NewSecure123!'},
            format='json',
            HTTP_AUTHORIZATION=f'Token {token}',
        )
        assert change_resp.status_code == 200
        new_token = change_resp.json()['token']

        # Login with new password
        login_resp2 = api_client.post(
            '/api/auth/login/',
            {'email': 'jane.smith@airassist.com', 'password': 'NewSecure123!'},
            format='json',
        )
        assert login_resp2.status_code == 200
        assert login_resp2.json()['must_change_password'] is False
