from django.urls import path

from .views import AirportLookupView, CaseCreateView, HealthCheckView

urlpatterns = [
    path('cases/', CaseCreateView.as_view(), name='case-create'),
    path('airports/', AirportLookupView.as_view(), name='airport-lookup'),
    path('health/', HealthCheckView.as_view(), name='health-check'),
]