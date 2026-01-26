# Critical Test Scenarios (Must Pass on Every PR)

**Purpose:** These 10 scenarios define the MINIMUM tests that MUST pass before merging any code.

**Rule:** If ANY of these scenarios fail, the PR is BLOCKED.

---

## RBAC & Data Isolation (Most Critical)

### 1. SuperAdmin sees all cities
- **Test:** SuperAdmin logs in and navigates to /cities
- **Expected:** See ALL cities from ALL areas (no filtering)
- **Why Critical:** SuperAdmin scope validation

### 2. Area Manager CANNOT see other areas
- **Test:** Area Manager logs in and requests data from another area
- **Expected:** Org-tree shows ONLY their area as root, data queries filtered by `areaManagerId`
- **Why Critical:** Prevents cross-area data leakage

### 3. City Coordinator CANNOT see other cities
- **Test:** City Coordinator logs in and tries to access /cities or another city's data
- **Expected:** `/cities` returns 403, data queries filtered by `city_id`
- **Why Critical:** Prevents cross-city data leakage (core security requirement)

### 4. Activist Coordinator CANNOT see unassigned neighborhoods  
- **Test:** Activist Coordinator tries to access neighborhood they're not assigned to
- **Expected:** Data filtered by `activist_coordinator_neighborhoods` M2M table
- **Why Critical:** Neighborhood-level access control

### 5. Cross-city data queries return empty (not error)
- **Test:** City Coordinator queries activists from another city via API
- **Expected:** Returns `200 OK` with empty array `[]` (NOT 403 or 500)
- **Why Critical:** Data isolation without exposing existence of other cities

---

## Authentication & Session

### 6. Login works for all roles
- **Test:** Login as SuperAdmin, AreaManager, CityCoordinator, ActivistCoordinator
- **Expected:** All login successfully and see role-appropriate dashboard
- **Why Critical:** Core auth functionality

### 7. Session persists after page refresh
- **Test:** Login, refresh page, check session still valid
- **Expected:** Middleware validates session, user remains logged in
- **Why Critical:** Session management

### 8. Unauthorized access returns 403 (not crash)
- **Test:** Access protected route without login, or with insufficient permissions
- **Expected:** Returns proper 403 AccessDenied page (not 500 error or crash)
- **Why Critical:** Graceful error handling

---

## UI & Localization

### 9. Hebrew RTL renders correctly
- **Test:** Visual check of dashboard, forms, tables in Hebrew
- **Expected:** `dir="rtl"`, text aligned right, layout not broken
- **Why Critical:** System is Hebrew-only, RTL must work

### 10. Navigation shows role-appropriate tabs
- **Test:** Login as CityCoordinator, check navigation tabs
- **Expected:** CityCoordinator does NOT see "Cities" tab (only SuperAdmin/AreaManager)
- **Why Critical:** UI should match permissions (prevents confusion)

---

## Bonus: Data Integrity

### 11. Database constraints prevent invalid data
- **Test:** Try inserting activist without `neighborhood_id`
- **Expected:** Database blocks via CHECK constraint
- **Why Critical:** Last line of defense against bugs

---

## Implementation Checklist

**Week 1:**
- [ ] All 10 scenarios documented
- [ ] Understand what each scenario validates

**Week 2:**
- [ ] Write E2E tests for scenarios 1-5 (RBAC)
- [ ] Write E2E tests for scenarios 6-8 (Auth)
- [ ] Write E2E tests for scenarios 9-10 (UI/UX)

**Week 3:**
- [ ] Add database constraint tests (scenario 11)
- [ ] Visual regression tests for scenario 9

---

## Test Execution

**On every PR:**
```bash
npm run test:e2e -- tests/e2e/critical/
```

**Result:** All 10 scenarios MUST pass. If any fail, PR is BLOCKED.

---

**Last Updated:** 2025-12-16
