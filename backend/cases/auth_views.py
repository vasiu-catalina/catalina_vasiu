from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth_serializers import ChangePasswordSerializer, LoginSerializer, UserSerializer
from .models import PassengerUser


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)

        # Check if user must change password
        must_change_password = PassengerUser.objects.filter(
            user=user, must_change_password=True
        ).exists()

        return Response({
            'token': token.key,
            'must_change_password': must_change_password,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
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

        # Clear must_change_password flag
        PassengerUser.objects.filter(user=user).update(must_change_password=False)

        # Regenerate token after password change
        Token.objects.filter(user=user).delete()
        new_token = Token.objects.create(user=user)

        return Response({
            'detail': 'Password changed successfully.',
            'token': new_token.key,
        })


class UserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.filter(is_superuser=False).order_by('date_joined')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


class UserDeleteView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.is_superuser:
            return Response(
                {'detail': 'Cannot delete superuser accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Soft delete: deactivate user to preserve referential integrity
        user.is_active = False
        user.save(update_fields=['is_active'])

        # Revoke auth tokens
        Token.objects.filter(user=user).delete()

        return Response({'detail': 'User account deleted successfully.'})
