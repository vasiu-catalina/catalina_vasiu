from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs['email']
        password = attrs['password']
        user = authenticate(username=email, password=password)
        if user is None:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        attrs['user'] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    assigned_cases = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'is_active', 'date_joined', 'role', 'assigned_cases']
        read_only_fields = fields

    def get_role(self, obj):
        if hasattr(obj, 'colleague_profile'):
            return obj.colleague_profile.role
        if hasattr(obj, 'passenger_profile'):
            return 'passenger'
        return None

    def get_assigned_cases(self, obj):
        from .models import Case, PassengerUser
        count = 0
        # Passenger cases
        count += PassengerUser.objects.filter(user=obj).count()
        # Colleague assigned cases
        full_name = obj.get_full_name()
        if full_name:
            count += Case.objects.filter(colleague=full_name).count()
        return count


class ColleagueCreateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=128)
    last_name = serializers.CharField(max_length=128)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value
