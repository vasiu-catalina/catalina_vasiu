from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings as django_settings
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth_serializers import ChangePasswordSerializer, ColleagueCreateSerializer, LoginSerializer
from .models import ColleagueProfile, ColleagueRole, PassengerUser


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)

        # Check if user must change password (either passenger or colleague)
        must_change_password = False
        if PassengerUser.objects.filter(user=user, must_change_password=True).exists():
            must_change_password = True
        elif ColleagueProfile.objects.filter(user=user, must_change_password=True).exists():
            must_change_password = True

        # Get role info
        role = None
        if hasattr(user, 'colleague_profile'):
            role = user.colleague_profile.role

        return Response({
            'token': token.key,
            'must_change_password': must_change_password,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': role,
            },
        })


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        # Clear must_change_password flag for both profile types
        PassengerUser.objects.filter(user=user).update(must_change_password=False)
        ColleagueProfile.objects.filter(user=user).update(must_change_password=False)

        # Regenerate token after password change
        Token.objects.filter(user=user).delete()
        new_token = Token.objects.create(user=user)

        return Response({
            'detail': 'Password changed successfully.',
            'token': new_token.key,
        })


class ColleagueCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Only admins can create colleague accounts
        if not hasattr(request.user, 'colleague_profile') or request.user.colleague_profile.role != ColleagueRole.ADMIN:
            return Response(
                {'detail': 'Only admins can create colleague accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ColleagueCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        email = data['email']
        password = data['password']

        # Create the Django user
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=data['first_name'],
            last_name=data['last_name'],
        )

        # Create colleague profile
        ColleagueProfile.objects.create(
            user=user,
            role=ColleagueRole.COLLEAGUE,
            must_change_password=True,
            created_by=request.user,
        )

        # Send welcome email with credentials
        _send_colleague_welcome_email(email, password, data['first_name'])

        return Response(
            {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'message': 'Colleague account created successfully.',
            },
            status=status.HTTP_201_CREATED,
        )


def _send_colleague_welcome_email(email, password, first_name):
    """Send welcome email with login credentials to the new colleague."""
    subject = 'Your AirAssist Colleague Account'
    message = (
        f'Hello {first_name},\n\n'
        f'Your colleague account has been created for AirAssist.\n\n'
        f'Login credentials:\n'
        f'  Email: {email}\n'
        f'  Password: {password}\n\n'
        f'Please change your password on your first login.\n\n'
        f'Best regards,\nAirAssist Team'
    )
    send_mail(
        subject,
        message,
        django_settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=True,
    )
