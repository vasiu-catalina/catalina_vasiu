from pathlib import Path

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import RegexValidator
from django.utils import timezone
from rest_framework import serializers

from .models import Case, CaseStatus, Document, DocumentType, FlightSegment, Passenger, validate_file_size


phone_validator = RegexValidator(regex=r'^\+?[0-9\-\s]{7,20}$', message='Enter a valid phone number.')


class PassengerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Passenger
        fields = [
            'first_name',
            'last_name',
            'date_of_birth',
            'email',
            'phone',
            'address',
            'postal_code',
        ]

    def validate_date_of_birth(self, value):
        if value >= timezone.localdate():
            raise serializers.ValidationError('Date of birth must be earlier than today.')
        return value

    def validate_phone(self, value):
        phone_validator(value)
        return value


class FlightSegmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlightSegment
        fields = [
            'sequence',
            'flight_date',
            'flight_number',
            'airline',
            'departing_airport_code',
            'destination_airport_code',
            'planned_departure_time',
            'planned_arrival_time',
            'is_connection',
            'is_problem_flight',
        ]

    def validate(self, attrs):
        if attrs['planned_arrival_time'] <= attrs['planned_departure_time']:
            raise serializers.ValidationError('Planned arrival time must be after planned departure time.')
        attrs['departing_airport_code'] = attrs['departing_airport_code'].upper()
        attrs['destination_airport_code'] = attrs['destination_airport_code'].upper()
        return attrs


class DocumentSerializer(serializers.ModelSerializer):
    filename = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['document_type', 'filename', 'file']
        read_only_fields = ['document_type', 'filename', 'file']

    def get_filename(self, obj):
        return obj.filename


class CaseDetailSerializer(serializers.ModelSerializer):
    passenger = PassengerSerializer(read_only=True)
    flight_segments = FlightSegmentSerializer(many=True, read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Case
        fields = [
            'id',
            'status',
            'reservation_number',
            'gdpr_consent',
            'updates_consent',
            'created_at',
            'passenger',
            'flight_segments',
            'documents',
        ]
        read_only_fields = fields


class CaseCreateSerializer(serializers.Serializer):
    reservation_number = serializers.CharField(max_length=64)
    gdpr_consent = serializers.BooleanField()
    updates_consent = serializers.BooleanField()
    passenger = PassengerSerializer()
    flight_segments = FlightSegmentSerializer(many=True)

    def validate(self, attrs):
        flight_segments = attrs['flight_segments']
        connections = [segment for segment in flight_segments if segment['is_connection']]
        problem_flights = [segment for segment in flight_segments if segment['is_problem_flight']]
        if len(connections) > 4:
            raise serializers.ValidationError({'flight_segments': 'A case can include at most 4 connecting flights.'})
        if len(problem_flights) != 1:
            raise serializers.ValidationError({'flight_segments': 'Exactly one problem flight must be selected.'})
        if not attrs['gdpr_consent']:
            raise serializers.ValidationError({'gdpr_consent': 'GDPR consent is required to submit the case.'})
        for field_name in ('boarding_pass', 'identity_document'):
            if self.context['documents'].get(field_name) is None:
                raise serializers.ValidationError({field_name: 'This document is required.'})
        self._validate_documents()
        return attrs

    def create(self, validated_data):
        passenger_data = validated_data.pop('passenger')
        flight_segments_data = validated_data.pop('flight_segments')
        case = Case.objects.create(status=CaseStatus.NEW, **validated_data)
        Passenger.objects.create(case=case, **passenger_data)
        FlightSegment.objects.bulk_create([FlightSegment(case=case, **segment_data) for segment_data in flight_segments_data])
        documents = self.context['documents']
        Document.objects.create(
            case=case,
            document_type=DocumentType.BOARDING_PASS,
            file=documents['boarding_pass'],
        )
        Document.objects.create(
            case=case,
            document_type=DocumentType.IDENTITY_DOCUMENT,
            file=documents['identity_document'],
        )
        return case

    def _validate_documents(self):
        for field_name in ('boarding_pass', 'identity_document'):
            uploaded_file = self.context['documents'][field_name]
            extension = Path(uploaded_file.name).suffix.lower().lstrip('.')
            if extension not in {'pdf', 'jpg', 'jpeg'}:
                raise serializers.ValidationError({field_name: 'Allowed file types are PDF, JPG, and JPEG.'})
            try:
                validate_file_size(uploaded_file)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({field_name: exc.messages[0]}) from exc