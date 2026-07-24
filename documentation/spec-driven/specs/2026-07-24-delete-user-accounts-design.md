# Role 02 – Delete User Accounts: Design Specification

## Summary

As a System Admin, I want to delete user accounts (passengers, colleagues) to maintain the security and integrity of the system. All users are shown in a list with name, email, and a delete button. A confirmation message is shown upon successful deletion.

## Current State

The codebase already has:
- `PassengerUser` model linking Django `auth.User` to `Case`
- Token-based authentication via DRF `rest_framework.authtoken`
- Login/change-password auth endpoints
- No user listing endpoint
- No user deletion endpoint
- No admin/user management UI in the frontend

## Gaps Identified (vs. Role 02 Requirements)

1. **No user list endpoint** – need GET `/api/users/` returning all users (passengers + colleagues)
2. **No user deletion endpoint** – need DELETE `/api/users/{id}/` to delete/deactivate a user
3. **No admin permission check** – need to restrict user management to staff/superuser
4. **No frontend user management page** – need a page listing users with delete action
5. **No confirmation flow** – need confirmation dialog and success message on deletion

## Implementation Plan

### Backend

1. Create `UserListView` – GET `/api/users/` returns all non-superuser users with id, email, first_name, last_name, role (passenger/colleague), is_active
2. Create `UserDeleteView` – DELETE `/api/users/{id}/` deactivates the user account (soft delete by setting `is_active=False`) to preserve referential integrity for linked cases
3. Add permission class: only staff/superuser can list and delete users
4. Add serializer for user list response
5. Add URL routes

### Database

- No new models needed – use Django's built-in `User.is_active` for soft delete
- Referential integrity preserved: user record stays, just deactivated

### Frontend

1. Create `UserManagement` page component with user list table
2. Add API functions for listing and deleting users
3. Add delete confirmation dialog
4. Show success/error message after deletion
5. Add route `/users` in App.tsx (admin-only)

## API Endpoints (new)

```
GET /api/users/
  Headers: Authorization: Token <token>
  Permission: Staff/Superuser only
  Response: [
    {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_active": true,
      "date_joined": "2026-07-24T10:00:00Z"
    },
    ...
  ]

DELETE /api/users/{id}/
  Headers: Authorization: Token <token>
  Permission: Staff/Superuser only
  Response: { "detail": "User account deleted successfully." }
  Errors:
    - 404: User not found
    - 403: Cannot delete superuser accounts
```

## Acceptance Criteria

1. The system allows the deletion of user accounts for passengers and colleagues.
2. All users are shown in a list that contains the name, email address, and a button for deletion.
3. Confirmation message is shown upon successful account deletion.
