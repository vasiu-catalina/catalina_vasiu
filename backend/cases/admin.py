from django.contrib import admin

from .models import Case, Document, FlightSegment, Passenger


class PassengerInline(admin.StackedInline):
	model = Passenger
	extra = 0


class FlightSegmentInline(admin.TabularInline):
	model = FlightSegment
	extra = 0


class DocumentInline(admin.TabularInline):
	model = Document
	extra = 0


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
	inlines = [PassengerInline, FlightSegmentInline, DocumentInline]
	list_display = ('id', 'status', 'reservation_number', 'created_at')
	list_filter = ('status', 'gdpr_consent', 'updates_consent')
	search_fields = ('reservation_number', 'passenger__email', 'passenger__last_name')

# Register your models here.
