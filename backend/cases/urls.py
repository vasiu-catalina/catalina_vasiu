from django.urls import path

from .views import AirportLookupView, CaseCreateView

urlpatterns = [
    path('cases/', CaseCreateView.as_view(), name='case-create'),
    path('airports/', AirportLookupView.as_view(), name='airport-lookup'),
]