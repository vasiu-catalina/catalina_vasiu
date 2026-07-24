from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient


class UserListViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin@test.com',
            email='admin@test.com',
            password='adminpass123',
        )
        self.admin_token = Token.objects.create(user=self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')

        # Create regular users
        self.user1 = User.objects.create_user(
            username='user1@test.com',
            email='user1@test.com',
            password='pass1234',
            first_name='Alice',
            last_name='Smith',
        )
        self.user2 = User.objects.create_user(
            username='user2@test.com',
            email='user2@test.com',
            password='pass1234',
            first_name='Bob',
            last_name='Jones',
        )

    def test_list_users_returns_non_superusers(self):
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = [u['email'] for u in response.data]
        self.assertIn('user1@test.com', emails)
        self.assertIn('user2@test.com', emails)
        self.assertNotIn('admin@test.com', emails)

    def test_list_users_returns_expected_fields(self):
        response = self.client.get('/api/users/')
        user_data = response.data[0]
        self.assertIn('id', user_data)
        self.assertIn('email', user_data)
        self.assertIn('first_name', user_data)
        self.assertIn('last_name', user_data)
        self.assertIn('is_active', user_data)
        self.assertIn('date_joined', user_data)

    def test_list_users_requires_admin(self):
        regular_token = Token.objects.create(user=self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {regular_token.key}')
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_users_requires_authentication(self):
        self.client.credentials()
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserDeleteViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username='admin@test.com',
            email='admin@test.com',
            password='adminpass123',
        )
        self.admin_token = Token.objects.create(user=self.admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')

        self.user1 = User.objects.create_user(
            username='user1@test.com',
            email='user1@test.com',
            password='pass1234',
            first_name='Alice',
            last_name='Smith',
        )
        Token.objects.create(user=self.user1)

    def test_delete_user_deactivates_account(self):
        response = self.client.delete(f'/api/users/{self.user1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'User account deleted successfully.')

        self.user1.refresh_from_db()
        self.assertFalse(self.user1.is_active)

    def test_delete_user_revokes_tokens(self):
        self.client.delete(f'/api/users/{self.user1.id}/')
        self.assertFalse(Token.objects.filter(user=self.user1).exists())

    def test_delete_nonexistent_user_returns_404(self):
        response = self.client.delete('/api/users/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_delete_superuser(self):
        other_admin = User.objects.create_superuser(
            username='admin2@test.com',
            email='admin2@test.com',
            password='adminpass123',
        )
        response = self.client.delete(f'/api/users/{other_admin.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        other_admin.refresh_from_db()
        self.assertTrue(other_admin.is_active)

    def test_delete_requires_admin(self):
        regular_token = Token.objects.get(user=self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {regular_token.key}')
        response = self.client.delete(f'/api/users/{self.user1.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_requires_authentication(self):
        self.client.credentials()
        response = self.client.delete(f'/api/users/{self.user1.id}/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_deleted_user_not_in_list(self):
        self.client.delete(f'/api/users/{self.user1.id}/')
        response = self.client.get('/api/users/')
        # User still appears but is_active is False
        user_data = [u for u in response.data if u['id'] == self.user1.id]
        self.assertEqual(len(user_data), 1)
        self.assertFalse(user_data[0]['is_active'])
