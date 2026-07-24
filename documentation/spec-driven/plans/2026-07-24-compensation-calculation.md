# Compensation Calculation Implementation Plan

> **Execution:** Use subagent-driven development to implement this plan task-by-task.

**Goal:** Calculate flight distance and determine EC261/2004 compensation level for passenger claims.

**Architecture:** Add distance calculation via AirportGap API, store results on Case model, expose via REST endpoint, display in React frontend.

**Tech Stack:** Django, Django REST Framework, requests, React, TypeScript, axios

**Design Spec:** `documentation/spec-driven/specs/2026-07-24-compensation-calculation-design.md`

---

### Task 1: Add distance calculation to airport service

**Files:**
- Modify: `backend/cases/services/airportgap.py`

**Requirements:**
- Add `calculate_distance(from_code: str, to_code: str) -> float` function
- POST to `{AIRPORTGAP_API_BASE_URL}/airports/distance` with form data `from` and `to`
- Return distance in kilometers from response `data.attributes.kilometers`
- Raise `AirportLookupError` on failure

**Implementation:**

```python
def calculate_distance(from_code: str, to_code: str) -> float:
    url = f"{settings.AIRPORTGAP_API_BASE_URL}/airports/distance"
    headers: dict[str, str] = {}
    if settings.AIRPORTGAP_API_TOKEN:
        headers['Authorization'] = f"Bearer token={settings.AIRPORTGAP_API_TOKEN}"
    try:
        response = requests.post(url, data={'from': from_code, 'to': to_code}, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        return float(data['data']['attributes']['kilometers'])
    except (requests.RequestException, KeyError, ValueError, TypeError) as exc:
        raise AirportLookupError('Distance calculation is temporarily unavailable.') from exc
```

**Verification:**
- Unit test with mocked API response

---

### Task 2: Add compensation threshold logic

**Files:**
- Create: `backend/cases/services/compensation.py`

**Requirements:**
- Pure function `calculate_compensation(distance_km: float) -> int`
- Thresholds: <1500 → 250, 1500-3500 → 400, >3500 → 600
- Returns integer euros

**Implementation:**

```python
def calculate_compensation(distance_km: float) -> int:
    if distance_km < 1500:
        return 250
    elif distance_km <= 3500:
        return 400
    else:
        return 600
```

**Verification:**
- Test boundary values: 0, 1499.9, 1500, 3500, 3500.1, 5000

---

### Task 3: Add database fields to Case model + migration

**Files:**
- Modify: `backend/cases/models.py`
- Create: migration via `python manage.py makemigrations`

**Requirements:**
- Add `distance_km = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)`
- Add `compensation_amount = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)`

**Verification:**
- Run `python manage.py makemigrations` and `python manage.py migrate`

---

### Task 4: Add compensation calculation endpoint

**Files:**
- Modify: `backend/cases/views.py`
- Modify: `backend/cases/urls.py`
- Modify: `backend/cases/serializers.py`

**Requirements:**
- New view `CompensationCalculateView` at `POST /api/cases/<id>/calculate-compensation/`
- Reads case, determines first segment departing airport and last segment destination airport
- Calls `calculate_distance`, then `calculate_compensation`
- Saves results to case, returns JSON response
- Also auto-calculate in CaseCreateView after case creation

**Implementation:**

```python
class CompensationCalculateView(APIView):
    def post(self, request, case_id):
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response({'detail': 'Case not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        segments = case.flight_segments.all()
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
            'distance_km': distance_km,
            'compensation_amount': compensation,
            'from_airport': from_airport,
            'to_airport': to_airport,
        })
```

**Verification:**
- Run tests, hit endpoint with curl

---

### Task 5: Update CaseDetailSerializer to include compensation fields

**Files:**
- Modify: `backend/cases/serializers.py`

**Requirements:**
- Add `distance_km` and `compensation_amount` to CaseDetailSerializer fields

**Verification:**
- GET /api/cases/{id}/ returns the new fields

---

### Task 6: Write backend tests

**Files:**
- Modify: `backend/cases/tests/test_api.py` or create `backend/cases/tests/test_compensation.py`

**Requirements:**
- Test `calculate_compensation` boundary values
- Test `calculate_distance` with mocked response
- Test the calculate-compensation endpoint

**Verification:**
- `python manage.py test`

---

### Task 7: Frontend — display compensation result

**Files:**
- Modify: `frontend/src/features/case-entry/api.ts`
- Modify: `frontend/src/features/case-entry/CaseEntryForm.tsx`
- Modify: `frontend/src/features/case-entry/types.ts`

**Requirements:**
- Add `calculateCompensation(caseId: number)` API function
- After successful case creation, call compensation calculation
- Display distance and compensation amount in success state

**Verification:**
- Submit a case, see distance and compensation displayed
