# Role 04 – Admin Landing Page: Implementation Plan

## Phase 1: Backend

### Step 1 – Admin Navigation View
- File: `backend/cases/views.py`
- Add `AdminNavigationView` (GET) returning navigation sections metadata
- Permission: `IsAdminUser`

### Step 2 – System Info View
- File: `backend/cases/views.py`
- Add `SystemInfoView` (GET) returning system stats (case count, user count, colleague count)
- Permission: `IsAdminUser`

### Step 3 – URL Registration
- File: `backend/cases/urls.py`
- Add `path('admin/navigation/', AdminNavigationView.as_view())`
- Add `path('admin/system-info/', SystemInfoView.as_view())`

### Step 4 – Backend Tests
- File: `backend/cases/tests/test_admin_landing.py`
- Test navigation endpoint returns sections for admin user
- Test navigation endpoint returns 403 for non-admin
- Test system info returns correct counts
- Test system info returns 403 for non-admin

## Phase 2: Frontend

### Step 5 – Admin Landing Page Component
- File: `frontend/src/features/admin/AdminLandingPage.tsx`
- Card-based layout with 4 navigation cards
- Each card: icon/title, description, link to target page

### Step 6 – System Page Component
- File: `frontend/src/features/admin/SystemPage.tsx`
- Fetches and displays system stats from `/api/admin/system-info/`

### Step 7 – API Integration
- File: `frontend/src/features/admin/api.ts`
- Functions: `fetchAdminNavigation()`, `fetchSystemInfo()`

### Step 8 – Routing Updates
- File: `frontend/src/App.tsx`
- Add `/admin-dashboard` route for AdminLandingPage
- Add `/admin/system` route for SystemPage
- Redirect admin users from `/` to `/admin-dashboard`

### Step 9 – Frontend Tests
- Test AdminLandingPage renders 4 navigation cards
- Test cards link to correct pages
- Test SystemPage displays system info
- Test non-admin users cannot access admin dashboard

## Verification

- Admin login → redirected to admin landing page
- Landing page shows 4 cards: New User, Users, Cases, System
- Each card navigates to the correct page
- Non-admin users do not see or access admin dashboard
- System view shows basic stats
