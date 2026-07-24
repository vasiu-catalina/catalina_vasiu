# Case 05 – Create User Account: Design Specification

## Summary

After a case is successfully created, the system automatically creates a user account for the passenger, generates an initial password, sends it via email, and enforces a password change on first login.

## Current State

The codebase already has:
- Django's built-in `auth` app (`django.contrib.auth`) installed
- `Passenger` model with `email` field (unique per case)
- `CaseCreateSerializer` that creates cases transactionally
- Email settings not yet configured (will use console backend for dev)

## Gaps Identified (vs. Case 05 Requirements)

1. **No user account creation** – no link between Passenger and Django User
2. **No password generation** – need secure random password generation
3. **No email sending** – need email configuration and template
4. **No `must_change_password` flag** – need to track first-login state
5. **No login endpoint** – need token-based authentication
6. **No password change endpoint** – need authenticated endpoint for password update
7. **No frontend login flow** – need login page and password change prompt

## Implementation Plan

### Database

1. Create `PassengerUser` model linking Django User to Passenger/Case
   - `user` (OneToOneField → auth.User)
   - `case` (ForeignKey → Case)
   - `must_change_password` (BooleanField, default=True)
   - `created_at` (DateTimeField)

### Backend

1. Add `PassengerUser` model to `cases/models.py`
2. Create migration `0005_passengeruser.py`
3. Create `accounts/` app with:
   - Login view (returns token + must_change_password flag)
   - Password change view (authenticated, clears must_change_password)
   - Service: user creation + password generation
   - Service: email sending (console backend for dev)
4. Hook user creation into `CaseCreateView.post()` after case save
5. Add `djangorestframework` token auth or session auth
6. Configure email backend (console for dev)

### Frontend

1. Login page with email/password form
2. Password change page (shown when must_change_password is true)
3. Route protection: redirect to password change if flag is set
4. Store auth token in state

### Testing

- Unit test: user account created after case creation
- Unit test: generated password is sent via email
- Unit test: login returns token + must_change_password flag
- Unit test: password change clears flag
- Integration test: full flow from case creation to login to password change

## Database Schema (additions)

```
cases_passengeruser:
  id (PK, auto-increment)
  user_id (FK → auth_user, OneToOne)
  case_id (FK → cases_case)
  must_change_password (BooleanField, default=True)
  created_at (DateTimeField)

auth_user (Django built-in):
  id, username (=email), email, password (hashed), is_active, etc.
```

## API Endpoints (new)

```
POST /api/auth/login/
  Body: { "email": "...", "password": "..." }
  Response: { "token": "...", "must_change_password": true/false, "user": {...} }

POST /api/auth/change-password/
  Headers: Authorization: Token <token>
  Body: { "new_password": "...", "confirm_password": "..." }
  Response: { "detail": "Password changed successfully." }
```

## Email Template

Subject: Your AirAssist Account
Body: Welcome! Your account has been created. Login with:
  Email: {email}
  Password: {generated_password}
  Please change your password on first login.
