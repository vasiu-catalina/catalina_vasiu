from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth_serializers import ChangePasswordSerializer, LoginSerializer
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
