from django.core.validators import FileExtensionValidator, RegexValidator
from django.db import migrations, models

import cases.models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Case',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('NEW', 'New'), ('VALID', 'Valid'), ('ASSIGNED', 'Assigned'), ('INVALID', 'Invalid')], default='NEW', max_length=16)),
                ('reservation_number', models.CharField(max_length=64)),
                ('gdpr_consent', models.BooleanField()),
                ('updates_consent', models.BooleanField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='Document',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('document_type', models.CharField(choices=[('BOARDING_PASS', 'Boarding pass'), ('IDENTITY_DOCUMENT', 'Identity document')], max_length=32)),
                ('file', models.FileField(upload_to='case_documents/', validators=[FileExtensionValidator(['pdf', 'png', 'jpg', 'jpeg']), cases.models.validate_file_size])),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('case', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='documents', to='cases.case')),
            ],
        ),
        migrations.CreateModel(
            name='Passenger',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('first_name', models.CharField(max_length=128)),
                ('last_name', models.CharField(max_length=128)),
                ('date_of_birth', models.DateField()),
                ('email', models.EmailField(max_length=254)),
                ('phone', models.CharField(max_length=32, validators=[RegexValidator(message='Enter a valid phone number.', regex='^\\+?[0-9\\-\\s]{7,20}$')])),
                ('address', models.CharField(max_length=255)),
                ('postal_code', models.CharField(max_length=32)),
                ('case', models.OneToOneField(on_delete=models.deletion.CASCADE, related_name='passenger', to='cases.case')),
            ],
        ),
        migrations.CreateModel(
            name='FlightSegment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sequence', models.PositiveSmallIntegerField()),
                ('flight_date', models.DateField()),
                ('flight_number', models.CharField(max_length=32)),
                ('airline', models.CharField(max_length=128)),
                ('departing_airport_code', models.CharField(max_length=8)),
                ('destination_airport_code', models.CharField(max_length=8)),
                ('planned_departure_time', models.DateTimeField()),
                ('planned_arrival_time', models.DateTimeField()),
                ('is_connection', models.BooleanField(default=False)),
                ('is_problem_flight', models.BooleanField(default=False)),
                ('case', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='flight_segments', to='cases.case')),
            ],
            options={'ordering': ['sequence']},
        ),
        migrations.AddConstraint(
            model_name='flightsegment',
            constraint=models.UniqueConstraint(fields=('case', 'sequence'), name='unique_case_segment_sequence'),
        ),
    ]