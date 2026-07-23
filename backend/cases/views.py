import json

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import CaseCreateSerializer, CaseDetailSerializer
from .services.airportgap import AirportLookupError, search_airports


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
		case = serializer.save()
		return Response(CaseDetailSerializer(case).data, status=status.HTTP_201_CREATED)


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
