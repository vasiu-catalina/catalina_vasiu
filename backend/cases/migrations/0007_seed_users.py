from django.contrib.auth.hashers import make_password
from django.db import migrations


def create_seed_users(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    ColleagueProfile = apps.get_model('cases', 'ColleagueProfile')

    # Admin user
    if not User.objects.filter(username='admin@airassist.com').exists():
        admin = User.objects.create(
            username='admin@airassist.com',
            email='admin@airassist.com',
            first_name='System',
            last_name='Admin',
            is_staff=True,
            is_superuser=True,
            password=make_password('Admin1234!'),
        )

        ColleagueProfile.objects.create(
            user=admin,
            role='admin',
            must_change_password=False,
        )

    # Test user
    if not User.objects.filter(username='testuser@air.com').exists():
        User.objects.create(
            username='testuser@air.com',
            email='testuser@air.com',
            first_name='Test',
            last_name='User',
            is_staff=False,
            is_superuser=False,
            password=make_password('newpass1234'),
        )


def remove_seed_users(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    User.objects.filter(username__in=['admin@airassist.com', 'testuser@air.com']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('cases', '0006_colleague_profile'),
    ]

    operations = [
        migrations.RunPython(create_seed_users, remove_seed_users),
    ]
