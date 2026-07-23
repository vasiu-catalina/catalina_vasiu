from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, RegexValidator
from django.db import models


def validate_file_size(uploaded_file):
	if uploaded_file.size > 5 * 1024 * 1024:
		raise ValidationError('Each uploaded document must be 5 MB or smaller.')


class CaseStatus(models.TextChoices):
	NEW = 'NEW', 'New'
	VALID = 'VALID', 'Valid'
	ASSIGNED = 'ASSIGNED', 'Assigned'
	INVALID = 'INVALID', 'Invalid'


class DocumentType(models.TextChoices):
	BOARDING_PASS = 'BOARDING_PASS', 'Boarding pass'
	IDENTITY_DOCUMENT = 'IDENTITY_DOCUMENT', 'Identity document'


class Case(models.Model):
	status = models.CharField(max_length=16, choices=CaseStatus.choices, default=CaseStatus.NEW)
	reservation_number = models.CharField(max_length=64)
	gdpr_consent = models.BooleanField()
	updates_consent = models.BooleanField()
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-created_at']


class Passenger(models.Model):
	case = models.OneToOneField(Case, on_delete=models.CASCADE, related_name='passenger')
	first_name = models.CharField(max_length=128)
	last_name = models.CharField(max_length=128)
	date_of_birth = models.DateField()
	email = models.EmailField()
	phone = models.CharField(
		max_length=32,
		validators=[RegexValidator(regex=r'^\+?[0-9\-\s]{7,20}$', message='Enter a valid phone number.')],
	)
	address = models.CharField(max_length=255)
	postal_code = models.CharField(max_length=32)


class FlightSegment(models.Model):
	case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='flight_segments')
	sequence = models.PositiveSmallIntegerField()
	flight_date = models.DateField()
	flight_number = models.CharField(max_length=32)
	airline = models.CharField(max_length=128)
	departing_airport_code = models.CharField(max_length=8)
	destination_airport_code = models.CharField(max_length=8)
	planned_departure_time = models.DateTimeField()
	planned_arrival_time = models.DateTimeField()
	is_connection = models.BooleanField(default=False)
	is_problem_flight = models.BooleanField(default=False)

	class Meta:
		ordering = ['sequence']
		constraints = [
			models.UniqueConstraint(fields=['case', 'sequence'], name='unique_case_segment_sequence'),
		]


class Document(models.Model):
	case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='documents')
	document_type = models.CharField(max_length=32, choices=DocumentType.choices)
	file = models.FileField(
		upload_to='case_documents/',
		validators=[
			FileExtensionValidator(['pdf', 'jpg', 'jpeg']),
			validate_file_size,
		],
	)
	uploaded_at = models.DateTimeField(auto_now_add=True)

	@property
	def filename(self) -> str:
		return Path(self.file.name).name
