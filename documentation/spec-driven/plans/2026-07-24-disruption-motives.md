# Disruption Motives Implementation Plan

> **Execution:** Use subagent-driven development to implement this plan task-by-task.

**Goal:** Add disruption type selection, conditional detail fields, airline motive capture, and incident description to the case entry form.

**Architecture:** New `Disruption` model (one-to-one with Case), updated serializers and API view, new React frontend section with conditional rendering.

**Tech Stack:** Django, Django REST Framework, React, TypeScript, react-hook-form, zod

**Design Spec:** `documentation/spec-driven/specs/2026-07-24-disruption-motives-design.md`

---

### Task 1: Database Model and Migration

**Files:**
- Modify: `backend/cases/models.py`
- Create: `backend/cases/migrations/0003_disruption.py` (auto-generated)

**Requirements:**
- Add Disruption model with one-to-one relation to Case
- Include all disruption fields with proper choice classes
- No strict validation on conditional field answers

**Implementation:**

Add to `backend/cases/models.py` after the Document model:

```python
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
```

**Verification:**
```bash
cd backend
python manage.py makemigrations cases
python manage.py migrate
```

---

### Task 2: Backend Serializer Updates

**Files:**
- Modify: `backend/cases/serializers.py`

**Requirements:**
- Add DisruptionSerializer for read/write
- Add disruption field to CaseCreateSerializer (required)
- Add disruption to CaseDetailSerializer
- Validate that disruption_type is present
- No validation on conditional answers

**Implementation:**

Add DisruptionSerializer:

```python
class DisruptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disruption
        fields = [
            'disruption_type',
            'cancellation_notice',
            'delay_arrival',
            'voluntary_give_up',
            'denial_reason',
            'airline_mentioned_motive',
            'airline_motive',
            'incident_description',
        ]
```

Add `disruption = DisruptionSerializer()` to CaseCreateSerializer.

Update CaseCreateSerializer.validate to check disruption is present:
```python
if 'disruption' not in attrs or not attrs['disruption']:
    raise serializers.ValidationError({'disruption': 'Disruption information is required.'})
```

Update CaseCreateSerializer.create to save disruption:
```python
disruption_data = validated_data.pop('disruption')
# ... create case ...
Disruption.objects.create(case=case, **disruption_data)
```

Add disruption to CaseDetailSerializer:
```python
disruption = DisruptionSerializer(read_only=True)
```

**Verification:**
```bash
cd backend
python manage.py shell -c "from cases.serializers import CaseCreateSerializer; print('OK')"
```

---

### Task 3: Backend Tests

**Files:**
- Create: `backend/cases/tests/test_disruption.py`

**Requirements:**
- Test Disruption model creation
- Test serializer requires disruption
- Test API accepts disruption data
- Test case creation without disruption fails

**Implementation:**

```python
from django.test import TestCase
from rest_framework.test import APITestCase

from cases.models import Case, CaseStatus, Disruption, DisruptionType


class DisruptionModelTest(TestCase):
    def test_create_disruption(self):
        case = Case.objects.create(
            status=CaseStatus.NEW,
            reservation_number='TEST123',
            gdpr_consent=True,
            updates_consent=False,
        )
        disruption = Disruption.objects.create(
            case=case,
            disruption_type=DisruptionType.CANCELLATION,
            cancellation_notice='less_than_14_days',
            airline_mentioned_motive='yes',
            airline_motive='technical',
            incident_description='Flight was cancelled.',
        )
        assert disruption.disruption_type == 'cancellation'
        assert disruption.case == case


class DisruptionAPITest(APITestCase):
    def test_case_creation_without_disruption_fails(self):
        # Minimal payload without disruption
        import json
        from io import BytesIO
        from django.core.files.uploadedfile import SimpleUploadedFile

        payload = {
            'reservation_number': 'ABC123',
            'gdpr_consent': True,
            'updates_consent': False,
            'passenger': {
                'first_name': 'John',
                'last_name': 'Doe',
                'date_of_birth': '1990-01-01',
                'email': 'john@example.com',
                'phone': '+1234567890',
                'address': '123 Street',
                'postal_code': '12345',
            },
            'flight_segments': [{
                'sequence': 1,
                'flight_date': '2026-08-01',
                'flight_number': 'AB123',
                'airline': 'Test Air',
                'departing_airport_code': 'JFK',
                'destination_airport_code': 'LAX',
                'planned_departure_time': '2026-08-01T10:00:00Z',
                'planned_arrival_time': '2026-08-01T14:00:00Z',
                'is_connection': False,
                'is_problem_flight': True,
            }],
        }

        boarding_pass = SimpleUploadedFile('bp.pdf', b'%PDF-content', content_type='application/pdf')
        identity_doc = SimpleUploadedFile('id.pdf', b'%PDF-content', content_type='application/pdf')

        response = self.client.post(
            '/api/cases/',
            data={
                'payload': json.dumps(payload),
                'boarding_pass': boarding_pass,
                'identity_document': identity_doc,
            },
            format='multipart',
        )
        assert response.status_code == 400
```

**Verification:**
```bash
cd backend
DATABASE_ENGINE=sqlite python manage.py test cases.tests.test_disruption
```

---

### Task 4: Frontend Disruption Section Component

**Files:**
- Create: `frontend/src/features/case-entry/components/DisruptionSection.tsx`

**Requirements:**
- Disruption type dropdown (cancellation, delay, denied boarding)
- Conditional fields based on selection
- Airline motive question for delay/cancellation
- Incident description textarea for all types
- No validation on answers (only disruption_type required)

**Implementation:**

Full React component using react-hook-form register/watch pattern, matching existing component style.

**Verification:**
```bash
cd frontend
npx tsc --noEmit
```

---

### Task 5: Frontend Schema and Form Integration

**Files:**
- Modify: `frontend/src/features/case-entry/schema.ts`
- Modify: `frontend/src/features/case-entry/CaseEntryForm.tsx`

**Requirements:**
- Add disruption fields to zod schema (disruption_type required, rest optional)
- Replace placeholder sections with DisruptionSection component
- Include disruption data in submission payload

**Verification:**
```bash
cd frontend
npx tsc --noEmit
npm run test
```

---

### Task 6: Frontend Tests

**Files:**
- Create: `frontend/src/features/case-entry/components/DisruptionSection.test.tsx`

**Requirements:**
- Test conditional rendering based on disruption type
- Test all disruption type paths render correct fields

**Verification:**
```bash
cd frontend
npm run test
```
