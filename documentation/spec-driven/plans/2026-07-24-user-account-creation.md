# Case 05 – Create User Account: Implementation Plan

## Phase 1: Backend + Database

1. [x] Create design spec
2. [ ] Add `PassengerUser` model to `cases/models.py`
3. [ ] Create migration
4. [ ] Add email settings to `config/settings.py`
5. [ ] Create account service (user creation + password generation + email)
6. [ ] Create auth views (login, change-password)
7. [ ] Create auth serializers
8. [ ] Add auth URLs
9. [ ] Hook user creation into case creation flow
10. [ ] Add token auth to settings

## Phase 2: Backend Testing

11. [ ] Write unit tests for user account creation
12. [ ] Write unit tests for login endpoint
13. [ ] Write unit tests for password change endpoint
14. [ ] Run all tests

## Phase 3: Frontend

15. [ ] Add react-router for navigation
16. [ ] Create login page component
17. [ ] Create password change component
18. [ ] Add auth state management
19. [ ] Add route protection

## Phase 4: Frontend Testing

20. [ ] Write component tests
21. [ ] Run frontend tests
