import secrets
import string

from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings

from cases.models import PassengerUser


def generate_password(length=12):
    """Generate a secure random password."""
    alphabet = string.ascii_letters + string.digits + '!@#$%&*'
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password


def create_passenger_account(case):
    """Create a user account for the passenger after case creation."""
    passenger = case.passenger
    email = passenger.email

    # If user with this email already exists, link to existing user
    user = User.objects.filter(email=email).first()
    if user:
        # Already has an account, just link to this case
        if not PassengerUser.objects.filter(user=user, case=case).exists():
            PassengerUser.objects.create(user=user, case=case, must_change_password=False)
        return user, None

    # Generate password and create user
    password = generate_password()
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=passenger.first_name,
        last_name=passenger.last_name,
    )

    PassengerUser.objects.create(user=user, case=case, must_change_password=True)

    # Send welcome email with credentials
    _send_welcome_email(email, password, passenger.first_name)

    return user, password


def _send_welcome_email(email, password, first_name):
    """Send the welcome email with login credentials."""
    subject = 'Your AirAssist Account'
    message = (
        f'Dear {first_name},\n\n'
        f'Your AirAssist account has been created successfully.\n\n'
        f'You can log in using the following credentials:\n'
        f'  Email: {email}\n'
        f'  Password: {password}\n\n'
        f'Please change your password on first login.\n\n'
        f'Best regards,\n'
        f'The AirAssist Team'
    )
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=True,
    )
