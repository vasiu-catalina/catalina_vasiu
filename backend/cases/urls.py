from django.urls import path

from .auth_views import ChangePasswordView, ColleagueCreateView, LoginView, UserDeleteView, UserListView
from .views import AdminNavigationView, AirportLookupView, CaseCreateView, CaseDetailView, CaseListView, CompensationCalculateView, HealthCheckView, SystemInfoView

urlpatterns = [
    path('cases/', CaseCreateView.as_view(), name='case-create'),
    path('cases/list/', CaseListView.as_view(), name='case-list'),
    path('cases/<int:case_id>/', CaseDetailView.as_view(), name='case-detail'),
    path('cases/<int:case_id>/calculate-compensation/', CompensationCalculateView.as_view(), name='compensation-calculate'),
    path('airports/', AirportLookupView.as_view(), name='airport-lookup'),
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:user_id>/', UserDeleteView.as_view(), name='user-delete'),
    path('admin/colleagues/', ColleagueCreateView.as_view(), name='colleague-create'),
    path('admin/navigation/', AdminNavigationView.as_view(), name='admin-navigation'),
    path('admin/system-info/', SystemInfoView.as_view(), name='system-info'),
]