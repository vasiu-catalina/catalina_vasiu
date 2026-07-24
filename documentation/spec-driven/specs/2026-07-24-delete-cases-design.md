# Role 03 – Delete Cases: Design Specification

## Summary

As a System Admin, I want to delete cases to manage data effectively. All cases are displayed in a list containing ID (link), Case Date, Flight Number, Flight Date, Status, together with a button for deletion. A confirmation message is shown upon successful deletion.

## Current State

The codebase already has:
- `Case` model with related `Passenger`, `FlightSegment`, `Document`, `Disruption`, `PassengerUser` models (all with CASCADE delete)
- `CaseListView` (GET `/api/cases/list/`) returning all cases
- `CaseDetailView` (GET `/api/cases/{id}/`) returning a single case
- `CaseCreateView` (POST `/api/cases/`) for creating cases
- `CaseDetailSerializer` returning full case data including nested relations
- Token-based authentication and `IsAdminUser` permission class already used in user management
- No case deletion endpoint
- No frontend case list/management page (only the case entry form)

## Gaps Identified (vs. Role 03 Requirements)

1. **No case deletion endpoint** – need DELETE `/api/cases/{id}/` to delete a case
2. **No admin permission check on cases** – need to restrict deletion to admin users
3. **No case list serializer** – need a lightweight serializer for the list view (ID, date, flight number, flight date, status)
4. **No frontend case list page** – need a page listing all cases in a table with delete button
5. **No confirmation flow** – need confirmation dialog and success message on deletion

## Implementation Plan

### Backend

1. Add `CaseListSerializer` – lightweight serializer returning id, status, created_at, first flight_number, first flight_date
2. Update `CaseListView` to require admin authentication
3. Add DELETE method to `CaseDetailView` – deletes the case and all dependent data (CASCADE handles Passenger, FlightSegment, Document, Disruption, PassengerUser)
4. Add admin permission to delete endpoint
5. Register URL route (already exists: `/api/cases/{id}/`)

### Database

- No new models or migrations needed
- CASCADE delete on all related models already configured
- Documents' physical files cleaned up on case deletion

### Frontend

1. Create `CaseManagement` page component with case list table
2. Add API functions for listing and deleting cases
3. Add delete confirmation dialog
4. Show success/error message after deletion
5. Add route `/cases` in App.tsx (admin-only) and update navigation

## API Endpoints

### Existing (updated)

```
GET /api/cases/list/
  Headers: Authorization: Token <token>
  Permission: Admin only (IsAdminUser)
  Response: [
    {
      "id": 1,
      "status": "NEW",
      "created_at": "2026-07-24T10:00:00Z",
      "flight_number": "LH123",
      "flight_date": "2026-07-20"
    }
  ]
```

### New

```
DELETE /api/cases/{id}/
  Headers: Authorization: Token <token>
  Permission: Admin only (IsAdminUser)
  Response 200: { "detail": "Case deleted successfully." }
  Response 404: { "detail": "Case not found." }
  Response 403: { "detail": "Authentication credentials were not provided." }
```

## Data Handling on Deletion

When a case is deleted, Django's CASCADE ensures:
- `Passenger` record deleted
- `FlightSegment` records deleted
- `Document` records deleted (file cleanup via signal/manual)
- `Disruption` record deleted
- `PassengerUser` records deleted
- Associated `User` accounts remain (only the link is removed)
