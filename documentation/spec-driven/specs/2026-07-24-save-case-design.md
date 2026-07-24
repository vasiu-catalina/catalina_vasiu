# Case 04 – Save Case: Design Specification

## Summary

Ensure the case creation flow saves all passenger, flight, and disruption details transactionally with a unique case ID, date, and an initially empty colleague assignment field. Handle database save failures without partial data.

## Current State

The codebase already has:
- `Case` model with auto-increment PK, `created_at`, `status`, and related fields
- `Passenger`, `FlightSegment`, `Disruption`, `Document` models with FK relationships
- `CaseCreateSerializer` that creates all related objects
- `CaseCreateView` (POST /api/cases/) that accepts multipart form data

## Gaps Identified (vs. Case 04 Requirements)

1. **Missing `colleague` field** on `Case` model – needs to be nullable/blank CharField
2. **No transactional guarantee** – `CaseCreateSerializer.create()` does not use `transaction.atomic()`; a failure mid-save could leave partial data
3. **No explicit database error handling** in the view – unhandled `OperationalError` or `IntegrityError` would return a 500 instead of a user-friendly error
4. **Case detail endpoint** – `CaseCreateView` only has POST; need GET for listing and retrieval to confirm saved data
5. **Frontend success/error messaging** – partially exists but should be verified end-to-end

## Implementation Plan

### Backend

1. Add `colleague` field (CharField, max_length=128, null=True, blank=True) to `Case` model
2. Create migration `0004_case_colleague.py`
3. Wrap `CaseCreateSerializer.create()` in `transaction.atomic()`
4. Add explicit database error handling in `CaseCreateView.post()` (catch `IntegrityError`, `OperationalError`)
5. Add GET method to `CaseCreateView` for case listing
6. Add `CaseDetailView` with GET for single case retrieval
7. Include `colleague` in `CaseDetailSerializer`

### Frontend

1. Display success message with case ID on successful submission (already exists)
2. Display user-friendly error message on failure (already exists)
3. Verify end-to-end flow works

### Testing

- Unit test: case creation saves all fields transactionally
- Unit test: `colleague` field defaults to null/empty
- Unit test: database failure returns proper error response
- Integration test: frontend submits and receives success response

## Database Schema (final state)

```
cases_case:
  id (PK, auto-increment)
  status (CharField)
  reservation_number (CharField)
  colleague (CharField, nullable)  ← NEW
  gdpr_consent (BooleanField)
  updates_consent (BooleanField)
  distance_km (DecimalField, nullable)
  compensation_amount (DecimalField, nullable)
  created_at (DateTimeField)
  updated_at (DateTimeField)

cases_passenger:
  id (PK)
  case_id (FK → cases_case, OneToOne)
  first_name, last_name, date_of_birth, email, phone, address, postal_code

cases_flightsegment:
  id (PK)
  case_id (FK → cases_case)
  sequence, flight_date, flight_number, airline, departing/destination_airport_code, times, is_connection, is_problem_flight

cases_disruption:
  id (PK)
  case_id (FK → cases_case, OneToOne)
  disruption_type, cancellation_notice, delay_arrival, voluntary_give_up, denial_reason, airline_mentioned_motive, airline_motive, incident_description

cases_document:
  id (PK)
  case_id (FK → cases_case)
  document_type, file, uploaded_at
```

## Acceptance Criteria Mapping

| Criterion | Implementation |
|-----------|---------------|
| Unique case ID | Auto-increment PK (existing) |
| Case date | `created_at` auto_now_add (existing) |
| Empty colleague field | New nullable CharField |
| All details saved | Transactional create with `atomic()` |
| No partial data on failure | `transaction.atomic()` + error handler |
| Error message on failure | View catches DB errors, returns 503 |
| Foreign key constraints | Django FK relationships (existing) |
