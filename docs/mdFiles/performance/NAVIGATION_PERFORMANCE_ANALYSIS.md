# Navigation Performance Analysis - 2025-12-08

## Problem Statement
Users experiencing 2-3 second delays when navigating between tabs in the menu.

## Root Causes Identified

### 1. Heavy Server-Side Data Fetching on Every Navigation
**Impact:** HIGH - Major contributor to delay

Each page is a Server Component that executes database queries on every visit:

- **Workers Page** (`app/[locale]/(dashboard)/workers/page.tsx`):
  - Fetches ALL workers via `listWorkers({})`
  - Fetches ALL sites via `listSites({})`
  - Fetches ALL supervisors via direct Prisma query
  - No pagination or filtering

- **Sites Page** (`app/[locale]/(dashboard)/sites/page.tsx`):
  - Fetches ALL sites via `listSites({})`
  - Fetches ALL corporations via `listCorporations({})`

- **Dashboard Page** (`app/[locale]/(dashboard)/dashboard/page.tsx`):
  - Fetches comprehensive stats via `getDashboardStats()`
  - Aggregates data across multiple tables

### 2. No Route Caching Strategy
**Impact:** HIGH

- Next.js 15 App Router re-renders Server Components on every navigation
- No `revalidate` time configured
- No `cache` directives
- Every navigation = full page reconstruction + fresh DB queries

### 3. Sequential Blocking Operations
**Impact:** MEDIUM

Every page follows this blocking pattern:
```typescript
const session = await auth();        // Blocking operation #1
const data = await fetchData();      // Blocking operation #2
return <Page data={data} />;         // Finally renders
```

### 4. Large Data Transfers
**Impact:** MEDIUM

- Pages pass entire datasets as props to client components
- No pagination or lazy loading
- Example: WorkersClient receives full arrays of workers, sites, and supervisors

### 5. Minimal Suspense Boundaries
**Impact:** MEDIUM

- Only Dashboard page uses Suspense
- Other pages block completely until all data loads
- No streaming or progressive rendering

### 6. No Loading UI Feedback
**Impact:** LOW (UX issue)

- Users see blank screen or frozen previous page
- No indication that navigation is in progress
- No skeleton loaders

## Performance Measurements

### Before Optimization
- **Dashboard → Workers:** ~2-3 seconds
- **Workers → Sites:** ~2-3 seconds
- **Sites → Dashboard:** ~2-3 seconds

### Expected After Optimization
- **Initial Load:** 300-500ms (with loading skeleton)
- **Subsequent Navigation:** 50-150ms (from cache)

## Solution Strategy

### Phase 1: Quick Wins (Immediate Implementation)
1. Add `loading.tsx` files for instant feedback
2. Configure route segment caching with `revalidate`
3. Add Suspense boundaries around data-heavy components
4. Implement progressive data loading

### Phase 2: Architecture Improvements
1. Install and configure TanStack Query (React Query)
2. Convert to hybrid SSR + client-side caching
3. Implement prefetching on link hover
4. Add optimistic UI updates

### Phase 3: Data Layer Optimization
1. Implement pagination for large lists
2. Add database query optimization
3. Consider Redis caching for frequently accessed data
4. Implement incremental static regeneration (ISR)

## Implementation Plan

See `NAVIGATION_PERFORMANCE_FIX.md` for detailed implementation steps.
