# User List – Design Specification

## Overview
As a System Admin, I want to see a list of all users in the system with their roles and assigned case counts.

## Backend

### API Endpoint
`GET /api/users/` — Returns all non-superuser accounts.

**Authorization:** Admin only (Token auth + `is_staff=True`)

### Response Schema
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_active": true,
    "date_joined": "2026-07-24T10:00:00Z",
    "role": "colleague",
    "assigned_cases": 3
  }
]
```

### Role Resolution
- User has `ColleagueProfile` → use `colleague_profile.role` (`"admin"` or `"colleague"`)
- User has `PassengerUser` → `"passenger"`
- Otherwise → `null`

### Assigned Cases Count
- Passengers: count of `PassengerUser` records linked to user
- Colleagues/Admins: count of `Case` objects where `colleague` field matches user's full name
- Falls back to 0

## Frontend

### User List Table Columns
| Column | Source |
|--------|--------|
| Name | `first_name` + `last_name` |
| Email | `email` |
| Role | `role` (formatted) |
| Assigned Cases | `assigned_cases` |
| Actions | Delete, Edit buttons |

## Acceptance Criteria
- Admin can see all users in the system
- Each user shows: Name, Email, Role, Assigned Cases count, Actions
- Non-admins get 403 Forbidden
- Unauthenticated requests get 401 Unauthorized
