from django.urls import path

from .auth_views import ChangePasswordView, ColleagueCreateView, LoginView
from .views import AirportLookupView, CaseCreateView, CaseDetailView, CaseListView, CompensationCalculateView, HealthCheckView

urlpatterns = [
    path('cases/', CaseCreateView.as_view(), name='case-create'),
    path('cases/list/', CaseListView.as_view(), name='case-list'),
    path('cases/<int:case_id>/', CaseDetailView.as_view(), name='case-detail'),
    path('cases/<int:case_id>/calculate-compensation/', CompensationCalculateView.as_view(), name='compensation-calculate'),
    path('airports/', AirportLookupView.as_view(), name='airport-lookup'),
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('admin/colleagues/', ColleagueCreateView.as_view(), name='colleague-create'),
]