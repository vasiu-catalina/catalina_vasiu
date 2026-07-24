from pathlib import Path

from django.conf import settings
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
	colleague = models.CharField(max_length=128, null=True, blank=True)
	gdpr_consent = models.BooleanField()
	updates_consent = models.BooleanField()
	distance_km = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
	compensation_amount = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
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
			FileExtensionValidator(['pdf', 'png', 'jpg', 'jpeg']),
			validate_file_size,
		],
	)
	uploaded_at = models.DateTimeField(auto_now_add=True)

	@property
	def filename(self) -> str:
		return Path(self.file.name).name


class DisruptionType(models.TextChoices):
	CANCELLATION = 'cancellation', 'Cancellation'
	DELAY = 'delay', 'Delay'
	DENIED_BOARDING = 'denied_boarding', 'Denied Boarding'


class CancellationNotice(models.TextChoices):
	MORE_THAN_14_DAYS = 'more_than_14_days', 'More than 14 days'
	LESS_THAN_14_DAYS = 'less_than_14_days', 'Less than 14 days'
	ON_FLIGHT_DAY = 'on_flight_day', 'On flight day'


class DelayArrival(models.TextChoices):
	LESS_THAN_3H = 'less_than_3h', 'Less than 3 hours'
	MORE_THAN_3H = 'more_than_3h', 'More than 3 hours'
	CONNECTION_LOST = 'connection_lost', 'Connection flight lost'


class VoluntaryGiveUp(models.TextChoices):
	YES = 'yes', 'Yes'
	NO = 'no', 'No'


class DenialReason(models.TextChoices):
	OVERBOOKED = 'overbooked', 'Flight overbooked'
	AGGRESSIVE_BEHAVIOR = 'aggressive_behavior', 'Aggressive behavior with staff'
	INTOXICATION = 'intoxication', 'Intoxication'
	UNSPECIFIED = 'unspecified', 'Unspecified reason'


class AirlineMentionedMotive(models.TextChoices):
	YES = 'yes', 'Yes'
	NO = 'no', 'No'
	DONT_KNOW = 'dont_know', "I don't know"


class AirlineMotive(models.TextChoices):
	TECHNICAL = 'technical', 'Technical problem'
	METEOROLOGICAL = 'meteorological', 'Meteorological conditions'
	STRIKE = 'strike', 'Strike'
	AIRPORT_PROBLEMS = 'airport_problems', 'Problems with airport'
	CREW_PROBLEMS = 'crew_problems', 'Crew problems'
	OTHER = 'other', 'Other motives'


class Disruption(models.Model):
	case = models.OneToOneField(Case, on_delete=models.CASCADE, related_name='disruption')
	disruption_type = models.CharField(max_length=32, choices=DisruptionType.choices)
	cancellation_notice = models.CharField(max_length=32, choices=CancellationNotice.choices, null=True, blank=True)
	delay_arrival = models.CharField(max_length=32, choices=DelayArrival.choices, null=True, blank=True)
	voluntary_give_up = models.CharField(max_length=8, choices=VoluntaryGiveUp.choices, null=True, blank=True)
	denial_reason = models.CharField(max_length=32, choices=DenialReason.choices, null=True, blank=True)
	airline_mentioned_motive = models.CharField(max_length=16, choices=AirlineMentionedMotive.choices, null=True, blank=True)
	airline_motive = models.CharField(max_length=32, choices=AirlineMotive.choices, null=True, blank=True)
	incident_description = models.TextField(blank=True, default='')


class PassengerUser(models.Model):
	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='passenger_profile')
	case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='passenger_users')
	must_change_password = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ['-created_at']