# Role 01 – Create Colleague User Accounts: Design Specification

## Summary

A System Admin can create user accounts for colleagues via a dedicated form. Each colleague account requires first name, last name, email, and initial password. The initial password is emailed to the colleague who must change it on first login.

## Current State

The codebase already has:
- Django `auth` app with Token authentication
- `PassengerUser` model for passenger accounts
- Login and change-password endpoints
- `must_change_password` flow implemented
- Email backend configured (console for dev)

## Gaps Identified (vs. Role 01 Requirements)

1. **No Colleague model** – need a model to represent colleague user accounts with role
2. **No admin-only endpoint** – need a protected endpoint for creating colleagues
3. **No colleague creation serializer** – need validation for the new-user form data
4. **No frontend admin page** – need a form for creating colleagues
5. **No role differentiation** – need to distinguish admin vs colleague users

## Implementation Plan

### Database

Create `ColleagueProfile` model:
- `user` (OneToOneField → auth.User)
- `role` (CharField: 'colleague', 'admin')
- `must_change_password` (BooleanField, default=True)
- `created_by` (ForeignKey → auth.User, nullable)
- `created_at` (DateTimeField)

### Backend

1. Add `ColleagueProfile` model to `cases/models.py`
2. Create migration
3. Create `ColleagueCreateSerializer` with validation
4. Create admin view `ColleagueCreateView` (admin-only)
5. Add URL: `POST /api/admin/colleagues/`
6. Update login to check ColleagueProfile.must_change_password
7. Send welcome email with initial password

### Frontend

1. Create "Create Colleague" form (first_name, last_name, email, password)
2. Add admin navigation/route
3. Show success confirmation after creation

### API Endpoint

```
POST /api/admin/colleagues/
  Headers: Authorization: Token <admin-token>
  Body: { "first_name": "...", "last_name": "...", "email": "...", "password": "..." }
  Response 201: { "id": ..., "email": "...", "first_name": "...", "last_name": "...", "message": "Colleague account created successfully." }
  Response 400: { "email": ["..."], ... }
  Response 403: { "detail": "Only admins can create colleague accounts." }
```
