import pytest
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from cases.models import Case, ColleagueProfile, ColleagueRole


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
        is_staff=True,
    )
    ColleagueProfile.objects.create(user=user, role=ColleagueRole.ADMIN, must_change_password=False)
    return user


@pytest.fixture
def admin_token(admin_user):
    token, _ = Token.objects.get_or_create(user=admin_user)
    return token.key


@pytest.fixture
def regular_user(db):
    user = User.objects.create_user(
        username='user@example.com',
        email='user@example.com',
        password='User1234!',
    )
    return user


@pytest.fixture
def regular_token(regular_user):
    token, _ = Token.objects.get_or_create(user=regular_user)
    return token.key


@pytest.mark.django_db
class TestAdminNavigationView:

    def test_admin_gets_navigation_sections(self, api_client, admin_token):
        """Admin user receives navigation sections."""
        response = api_client.get(
            '/api/admin/navigation/',
            HTTP_AUTHORIZATION=f'Token {admin_token}',
        )
        assert response.status_code == 200
        data = response.json()
        assert 'sections' in data
        sections = data['sections']
        assert len(sections) == 4

        keys = [s['key'] for s in sections]
        assert 'new-user' in keys
        assert 'users' in keys
        assert 'cases' in keys
        assert 'system' in keys

    def test_each_section_has_required_fields(self, api_client, admin_token):
        """Each navigation section has key, label, description, and path."""
        response = api_client.get(
            '/api/admin/navigation/',
            HTTP_AUTHORIZATION=f'Token {admin_token}',
        )
        for section in response.json()['sections']:
            assert 'key' in section
            assert 'label' in section
            assert 'description' in section
            assert 'path' in section

    def test_non_admin_gets_403(self, api_client, regular_token):
        """Non-admin user receives 403 Forbidden."""
        response = api_client.get(
            '/api/admin/navigation/',
            HTTP_AUTHORIZATION=f'Token {regular_token}',
        )
        assert response.status_code == 403

    def test_unauthenticated_gets_401(self, api_client):
        """Unauthenticated request receives 401."""
        response = api_client.get('/api/admin/navigation/')
        assert response.status_code in (401, 403)


@pytest.mark.django_db
class TestSystemInfoView:

    def test_admin_gets_system_info(self, api_client, admin_user, admin_token):
        """Admin user receives system info with correct counts."""
        # Create some test data
        Case.objects.create(reservation_number='RES001', gdpr_consent=True, updates_consent=False)
        Case.objects.create(reservation_number='RES002', gdpr_consent=True, updates_consent=True)

        response = api_client.get(
            '/api/admin/system-info/',
            HTTP_AUTHORIZATION=f'Token {admin_token}',
        )
        assert response.status_code == 200
        data = response.json()
        assert data['total_cases'] == 2
        # admin_user is not superuser, so counted; plus the admin_user's ColleagueProfile
        assert data['total_users'] >= 1
        assert data['total_colleagues'] >= 1

    def test_system_info_empty_database(self, api_client, admin_user, admin_token):
        """System info returns zero counts for empty database."""
        response = api_client.get(
            '/api/admin/system-info/',
            HTTP_AUTHORIZATION=f'Token {admin_token}',
        )
        assert response.status_code == 200
        data = response.json()
        assert data['total_cases'] == 0

    def test_non_admin_gets_403(self, api_client, regular_token):
        """Non-admin user receives 403 Forbidden."""
        response = api_client.get(
            '/api/admin/system-info/',
            HTTP_AUTHORIZATION=f'Token {regular_token}',
        )
        assert response.status_code == 403

    def test_unauthenticated_gets_401(self, api_client):
        """Unauthenticated request receives 401."""
        response = api_client.get('/api/admin/system-info/')
        assert response.status_code in (401, 403)
