import json

from django.db import connection, IntegrityError
from django.db.utils import OperationalError
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Case
from .serializers import CaseCreateSerializer, CaseDetailSerializer, CaseListSerializer
from .services.accounts import create_passenger_account
from .services.airportgap import AirportLookupError, calculate_distance, search_airports
from .services.compensation import calculate_compensation


class CaseListView(APIView):
	permission_classes = [IsAdminUser]

	def get(self, request):
		cases = Case.objects.all()
		serializer = CaseListSerializer(cases, many=True)
		return Response(serializer.data)


class CaseDetailView(APIView):
	def get(self, request, case_id):
		try:
			case = Case.objects.get(id=case_id)
		except Case.DoesNotExist:
			return Response({'detail': 'Case not found.'}, status=status.HTTP_404_NOT_FOUND)
		serializer = CaseDetailSerializer(case)
		return Response(serializer.data)

	def get_permissions(self):
		if self.request.method == 'DELETE':
			return [IsAdminUser()]
		return super().get_permissions()

	def delete(self, request, case_id):
		try:
			case = Case.objects.get(id=case_id)
		except Case.DoesNotExist:
			return Response({'detail': 'Case not found.'}, status=status.HTTP_404_NOT_FOUND)

		# Clean up document files before deleting case
		for doc in case.documents.all():
			if doc.file:
				doc.file.delete(save=False)

		case.delete()
		return Response({'detail': 'Case deleted successfully.'})


class CaseCreateView(APIView):
	def post(self, request):
		raw_payload = request.data.get('payload')
		if raw_payload is None:
			return Response({'payload': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)
		try:
			payload = json.loads(raw_payload)
		except json.JSONDecodeError:
			return Response({'payload': ['Payload must be valid JSON.']}, status=status.HTTP_400_BAD_REQUEST)

		serializer = CaseCreateSerializer(
			data=payload,
			context={
				'documents': {
					'boarding_pass': request.FILES.get('boarding_pass'),
					'identity_document': request.FILES.get('identity_document'),
				}
			},
		)
		serializer.is_valid(raise_exception=True)

		try:
			case = serializer.save()
		except (IntegrityError, OperationalError):
			return Response(
				{'detail': 'Failed to save case. Please try again.'},
				status=status.HTTP_503_SERVICE_UNAVAILABLE,
			)

		# Auto-calculate compensation after case creation
		_try_calculate_compensation(case)

		# Auto-create passenger user account
		_try_create_passenger_account(case)

		return Response(CaseDetailSerializer(case).data, status=status.HTTP_201_CREATED)


class CompensationCalculateView(APIView):
	def post(self, request, case_id):
		try:
			case = Case.objects.get(id=case_id)
		except Case.DoesNotExist:
			return Response({'detail': 'Case not found.'}, status=status.HTTP_404_NOT_FOUND)

		segments = case.flight_segments.order_by('sequence')
		if not segments.exists():
			return Response({'detail': 'No flight segments found.'}, status=status.HTTP_400_BAD_REQUEST)

		from_airport = segments.first().departing_airport_code
		to_airport = segments.last().destination_airport_code

		try:
			distance_km = calculate_distance(from_airport, to_airport)
		except AirportLookupError as exc:
			return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

		compensation = calculate_compensation(distance_km)
		case.distance_km = distance_km
		case.compensation_amount = compensation
		case.save(update_fields=['distance_km', 'compensation_amount'])

		return Response({
			'distance_km': float(distance_km),
			'compensation_amount': compensation,
			'from_airport': from_airport,
			'to_airport': to_airport,
		})


def _try_calculate_compensation(case):
	"""Attempt to calculate compensation; silently fail if API unavailable."""
	segments = case.flight_segments.order_by('sequence')
	if not segments.exists():
		return
	from_airport = segments.first().departing_airport_code
	to_airport = segments.last().destination_airport_code
	try:
		distance_km = calculate_distance(from_airport, to_airport)
		compensation = calculate_compensation(distance_km)
		case.distance_km = distance_km
		case.compensation_amount = compensation
		case.save(update_fields=['distance_km', 'compensation_amount'])
	except AirportLookupError:
		pass


class AirportLookupView(APIView):
	def get(self, request):
		query = request.query_params.get('query', '').strip()
		if len(query) < 2:
			return Response({'results': []})
		try:
			results = search_airports(query)
		except AirportLookupError as exc:
			return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
		return Response({'results': results})


class HealthCheckView(APIView):
	def get(self, request):
		try:
			with connection.cursor() as cursor:
				cursor.execute('SELECT 1')
		except OperationalError:
			return Response(
				{
					'status': 'error',
					'backend': 'ok',
					'database': 'error',
				},
				status=status.HTTP_503_SERVICE_UNAVAILABLE,
			)

		return Response(
			{
				'status': 'ok',
				'backend': 'ok',
				'database': 'ok',
			}
		)


def _try_create_passenger_account(case):
	"""Attempt to create passenger account; silently fail if error."""
	try:
		create_passenger_account(case)
	except Exception:
		pass
