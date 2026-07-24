# Role 04 – Admin Landing Page: Design Specification

## Summary

A System Admin sees a dedicated landing page after login that shows all possible actions they can perform, with navigation links to: New User View, User View, Case View, and System View.

## Current State

The codebase already has:
- Admin authentication with `is_staff` / `ColleagueProfile.role == 'admin'` checks
- Case management page at `/cases` (admin-only)
- User management page at `/users` (admin-only)
- Create colleague page at `/admin/create-colleague` (admin-only)
- Navigation links in the header for Cases, Users, Create Colleague
- No dedicated admin landing page – admins currently see the CaseEntryForm at `/`
- No system view page

## Gaps Identified (vs. Role 04 Requirements)

1. **No admin landing page** – admin users land on the case entry form instead of a dashboard
2. **No admin navigation metadata endpoint** – no API to return available admin actions
3. **No system view** – need at least a placeholder system info page
4. **No dedicated admin route** – need `/admin-dashboard` route for the landing page

## Implementation Plan

### Database

No new persistent data required – the ticket confirms this.

### Backend

1. Create `AdminNavigationView` (GET `/api/admin/navigation/`) – returns navigation metadata with available admin actions and their labels/URLs
2. Create `SystemInfoView` (GET `/api/admin/system-info/`) – returns basic system information (version, stats)
3. Both endpoints require `IsAdminUser` permission

#### API: GET /api/admin/navigation/

Response 200:
```json
{
  "sections": [
    {
      "key": "new-user",
      "label": "New User",
      "description": "Create new colleague accounts",
      "path": "/admin/create-colleague"
    },
    {
      "key": "users",
      "label": "User Management",
      "description": "View and manage user accounts",
      "path": "/users"
    },
    {
      "key": "cases",
      "label": "Case Management",
      "description": "View and manage passenger cases",
      "path": "/cases"
    },
    {
      "key": "system",
      "label": "System",
      "description": "View system information and settings",
      "path": "/admin/system"
    }
  ]
}
```

Response 403 (non-admin):
```json
{"detail": "You do not have permission to perform this action."}
```

#### API: GET /api/admin/system-info/

Response 200:
```json
{
  "total_cases": 5,
  "total_users": 3,
  "total_colleagues": 2
}
```

### Frontend

1. Create `AdminLandingPage` component with card-based navigation
2. Create `SystemPage` component (basic system info display)
3. Update routing: admin users land on `/admin-dashboard` instead of case entry form
4. Add admin dashboard link to header navigation
5. Each card links to its respective page

### Acceptance Criteria Mapping

| Criteria | Implementation |
|----------|---------------|
| Landing page with all admin actions | AdminLandingPage with cards |
| Link to New User View | Card linking to `/admin/create-colleague` |
| Link to User View | Card linking to `/users` |
| Link to Case View | Card linking to `/cases` |
| Link to System View | Card linking to `/admin/system` |
