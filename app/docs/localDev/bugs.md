# Bug Tracking Log

## Bug: CommandPalette Dynamic Import Error - Module Resolution (2025-12-16)

### Issue Description
Runtime TypeError when loading dashboard layout: "can't access property 'call', originalFactory is undefined" at DashboardLayout (CommandPaletteWrapper component).

### Root Cause Analysis
1. **Webpack Module Resolution**: Next.js 15 dynamic imports sometimes fail to resolve the default export properly
2. **Build Cache**: Old build artifacts can cause module resolution issues after code changes
3. **Missing Explicit Export Resolution**: The dynamic import was not explicitly resolving `mod.default`

### Error Details
- **Error Type**: Runtime TypeError
- **Error Message**: "can't access property 'call', originalFactory is undefined"
- **Location**: `app/[locale]/(dashboard)/layout.tsx:33` (CommandPaletteWrapper)
- **Next.js Version**: 15.5.6 (Webpack)
- **Recurrence**: Error persisted after initial fix attempt

### Solution Implemented

**Step 1: Explicit Default Export Resolution**
Modified `app/app/components/ui/CommandPaletteWrapper.tsx` to explicitly resolve the default export:

```typescript
// Before:
const CommandPalette = dynamic(
  () => import('@/app/components/ui/CommandPalette'),
  { ssr: false }
);

// After:
const CommandPalette = dynamic(
  () => import('@/app/components/ui/CommandPalette').then(mod => mod.default),
  { ssr: false }
);
```

**Step 2: Clear Build Cache**
```bash
rm -rf .next
# Kill and restart dev server
lsof -ti:3200 | xargs kill -9
npm run dev
```

**Files Modified**:
- ✅ Modified: `app/app/components/ui/CommandPaletteWrapper.tsx` (added `.then(mod => mod.default)`)

### Prevention Rules

**Next.js 15 Dynamic Import Best Practices:**

1. **Always Explicit Export Resolution**:
   ```typescript
   // ✅ GOOD - Explicit default export
   dynamic(() => import('./Component').then(mod => mod.default))
   
   // ⚠️ RISKY - May fail in some cases
   dynamic(() => import('./Component'))
   ```

2. **Clear Build Cache After Module Changes**:
   - Run `rm -rf .next` after creating/modifying dynamic imports
   - Restart dev server completely (kill + start, not just save/reload)

3. **Client Component Wrapper Pattern** (for Server Components):
   ```typescript
   // wrapper.tsx (Client Component)
   'use client';
   const Component = dynamic(
     () => import('./Component').then(mod => mod.default),
     { ssr: false }
   );
   export default function Wrapper() { return <Component />; }
   ```

4. **Testing Checklist**:
   - ✅ Clear `.next` cache
   - ✅ Restart dev server completely
   - ✅ Test in both dev and build modes
   - ✅ Check browser console for hydration errors
   - ✅ Verify dynamic component functionality (e.g., Cmd+K)

### Commands for Future Reference
```bash
# Clear cache and restart
rm -rf .next && lsof -ti:3200 | xargs kill -9 && npm run dev

# Or use the shorthand
npm run dev:clean  # (if you add this script to package.json)
```

### Testing Results
- ✅ Build cache cleared
- ✅ Module resolution fixed with `.then(mod => mod.default)`
- ✅ Dev server restarted
- ✅ No runtime errors on dashboard load
- ✅ CommandPalette (Cmd+K) functionality works

### Related
- See: Next.js 15 Dynamic Import Documentation
- See: Webpack Module Resolution
- Pattern: Client Component Wrapper for Server Components

---

## Bug: Stale Session After Database Reseed (2025-12-17)

### Issue Description
Users encounter SESSION_INVALID error when accessing dashboard after database reseeds/resets. Session contains user ID that no longer exists in database.

### Root Cause Analysis
1. **JWT Session Persistence**: NextAuth sessions use JWT tokens stored in browser cookies
2. **Database Reset**: Running `npm run db:seed` generates new UUIDs for all users
3. **Session Mismatch**: Old JWT contains stale user ID (e.g., `e858e4e5-b534-44e8-926b-7fb85e69623e`)
4. **Auth Validation**: `getCurrentUser()` in `lib/auth.ts` correctly detects missing user and throws SESSION_INVALID error

### Error Details
- **Error Type**: SESSION_INVALID
- **Error Message**: "User session is stale. Please sign out and sign back in."
- **Location**: `lib/auth.ts:49`
- **Trigger**: Database reseed/reset while user has active session
- **User Impact**: Cannot access dashboard until signing out

### Solution Implemented

**Auth Code Already Handles This Correctly** (lib/auth.ts:44-50):
```typescript
if (!dbUser) {
  // User exists in session but not in database (stale JWT token)
  // This can happen after database resets/seeds
  console.error(`[Auth Error] Session contains invalid user ID: ${session.user.id}`);
  console.error('[Auth Error] User needs to sign out and sign back in');
  throw new Error('SESSION_INVALID: User session is stale. Please sign out and sign back in.');
}
```

**User Action Required**:
1. Clear browser cookies/session OR
2. Click "Sign Out" button
3. Sign in again with correct credentials

**No Code Changes Needed** - This is expected behavior after database reseeds.

### Prevention Rules

**Database Reseed Best Practices:**

1. **Always Clear Sessions After Reseed**:
   ```bash
   # After running db:seed, clear browser data
   npm run db:seed
   # Then in browser: Clear cookies for localhost:3200
   ```

2. **Development Workflow**:
   - ✅ Run `npm run db:seed`
   - ✅ Sign out from application
   - ✅ Sign in with seeded credentials
   - ❌ Don't expect old sessions to work after reseed

3. **Production Safety**:
   - ❌ NEVER run database seed/reset in production
   - ✅ Use database migrations instead
   - ✅ Sessions remain valid across migrations

### Testing Results
- ✅ Error correctly identifies stale session
- ✅ User receives clear instructions to sign out
- ✅ After sign out + sign in, user can access dashboard
- ✅ No data loss or corruption

### Related
- See: NextAuth JWT Sessions
- File: `lib/auth.ts:44-50`
- Related: Database seed workflow

---

## Bug: Undefined Variable in Seed File (2025-12-17)

### Issue Description
Runtime ReferenceError during database seed: `telAviv is not defined`. Variable name mismatch in 6 locations within voter seeding code.

### Root Cause Analysis
1. **Variable Naming Inconsistency**: City variable created as `telAvivYafo` (line 221)
2. **Incorrect References**: Voter seeding code referenced non-existent `telAviv` variable (6 times)
3. **Copy-Paste Error**: Likely from refactoring city names from "Tel Aviv" to "תל אביב-יפו"

### Error Details
- **Error Type**: ReferenceError
- **Error Message**: "telAviv is not defined"
- **Location**: `app/prisma/seed.ts` (lines 739, 773, 793, 811, 830, 831)
- **Impact**: Seed script crashes during voter insertion
- **Affected Code**: Voter records for Rachel, Yael, City Coordinator, Area Manager

### Solution Implemented

**Fixed all 6 occurrences** of `telAviv` → `telAvivYafo`:

```typescript
// Before (BROKEN):
insertedByCityName: telAviv.name,
assignedCityId: telAviv.id,
assignedCityName: telAviv.name,

// After (FIXED):
insertedByCityName: telAvivYafo.name,
assignedCityId: telAvivYafo.id,
assignedCityName: telAvivYafo.name,
```

**Files Modified**:
- ✅ Modified: `app/prisma/seed.ts:739` (Rachel Florentin voters)
- ✅ Modified: `app/prisma/seed.ts:773` (Yael Jaffa voters)
- ✅ Modified: `app/prisma/seed.ts:793` (Rachel coordinator voter)
- ✅ Modified: `app/prisma/seed.ts:811` (David coordinator voter)
- ✅ Modified: `app/prisma/seed.ts:830-831` (Area manager voter)

### Prevention Rules

**Seed File Best Practices:**

1. **Variable Naming Consistency**:
   ```typescript
   // ✅ GOOD - Use variable name matching creation
   const telAvivYafo = await prisma.city.create({ name: 'תל אביב-יפו' });
   // Later:
   insertedByCityName: telAvivYafo.name  // ✅ Correct

   // ❌ BAD - Don't shorten variable names later
   insertedByCityName: telAviv.name  // ❌ Undefined!
   ```

2. **Pre-Seed Testing**:
   ```bash
   # Always test seed script before committing
   npm run db:push
   npm run db:seed  # Must complete without errors
   ```

3. **Grep Check for Undefined Variables**:
   ```bash
   # Check for variable references before running seed
   grep -n "telAviv\." app/prisma/seed.ts
   # Should only show telAvivYafo, not telAviv
   ```

4. **Code Review Checklist**:
   - ✅ All city variables match their creation names
   - ✅ No shortened variable references
   - ✅ Seed script runs successfully
   - ✅ All voters inserted correctly

### Testing Results
- ✅ Seed script runs without errors
- ✅ All 6 voter records created successfully
- ✅ City names correctly assigned
- ✅ No undefined variable errors
- ✅ Verified with: `grep "telAviv\." app/prisma/seed.ts` (no matches)

### Commands for Future Reference
```bash
# Test seed after fixes
npm run db:push && npm run db:seed

# Verify no undefined variables
grep -n "telAviv\." app/prisma/seed.ts  # Should return no results
```

### Related
- File: `app/prisma/seed.ts:221` (telAvivYafo creation)
- Pattern: Variable naming consistency in seed scripts

---

## Bug: Server Component with Client Event Handler (2025-12-17)

### Issue Description
Mobile navigation error: GET http://localhost:3200/more returns HTTP 500. Server Component (`/more/page.tsx`) contains `onClick` handler with `window.location.href`, causing server-side runtime error.

### Root Cause Analysis
1. **Server Component with Client Logic**: `/more/page.tsx` is a Server Component (async, uses `auth()`)
2. **Invalid Event Handler**: ListItemButton has `onClick` handler (line 118-122)
3. **Browser API on Server**: Handler calls `window.location.href` which doesn't exist on server
4. **Next.js 15 Validation**: Next.js 15 prevents client-side handlers in Server Components

### Error Details
- **Error Type**: Server Runtime Error (HTTP 500)
- **Error Message**: "Cannot use client-side event handlers in Server Components"
- **Location**: `app/[locale]/(dashboard)/more/page.tsx:118-122`
- **Trigger**: Accessing `/more` page on mobile
- **Impact**: More page completely broken for all users

### Solution Implemented

**Step 1: Created Client Component for Logout**
Created `app/components/LogoutButton.tsx`:
```typescript
'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <ListItem disablePadding>
      <ListItemButton onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon sx={{ color: colors.error }} />
        </ListItemIcon>
        <ListItemText primary="התנתק" />
      </ListItemButton>
    </ListItem>
  );
}
```

**Step 2: Updated More Page**
Modified `app/[locale]/(dashboard)/more/page.tsx`:
```typescript
// Removed LogoutIcon import (moved to LogoutButton)
// Added LogoutButton import
import { LogoutButton } from '@/app/components/LogoutButton';

// Replaced inline logout button with:
<LogoutButton />
```

**Files Modified**:
- ✅ Created: `app/components/LogoutButton.tsx` (client component)
- ✅ Modified: `app/[locale]/(dashboard)/more/page.tsx` (removed onClick handler)

### Prevention Rules

**Server vs Client Components Best Practices:**

1. **Event Handlers Require Client Components**:
   ```typescript
   // ❌ BAD - Server Component with onClick
   export default async function Page() {
     return <button onClick={() => {}}>Click</button>; // ERROR!
   }

   // ✅ GOOD - Client Component with onClick
   'use client';
   export default function Button() {
     return <button onClick={() => {}}>Click</button>;
   }
   ```

2. **Extract Interactive UI to Client Components**:
   ```typescript
   // Server Component (page.tsx)
   export default async function Page() {
     const data = await fetchData();
     return (
       <div>
         <DataDisplay data={data} />
         <InteractiveButton />  {/* Client component */}
       </div>
     );
   }

   // Client Component (InteractiveButton.tsx)
   'use client';
   export function InteractiveButton() {
     return <button onClick={handleClick}>Click</button>;
   }
   ```

3. **Logout Pattern**:
   ```typescript
   // ✅ Always use signOut from next-auth/react
   'use client';
   import { signOut } from 'next-auth/react';

   await signOut({ callbackUrl: '/login' });

   // ❌ NEVER use window.location or /api/auth/signout directly
   window.location.href = '/api/auth/signout';  // ❌ Wrong!
   ```

4. **Testing Checklist**:
   - ✅ Check for `onClick`, `onChange`, `onSubmit` in async components
   - ✅ Check for `useState`, `useEffect` in Server Components
   - ✅ Check for browser APIs (`window`, `document`, `localStorage`)
   - ✅ Test mobile navigation flow after changes

### Testing Results
- ✅ `/more` page loads without errors (HTTP 200)
- ✅ All navigation links work correctly
- ✅ Logout button triggers signOut properly
- ✅ Mobile navigation fully functional
- ✅ No server-side errors in console

### Commands for Future Reference
```bash
# Check for onClick handlers in Server Components
grep -rn "onClick" app/\[locale\]/\(dashboard\)/ --include="page.tsx"

# Should only appear in 'use client' files
grep -B5 "onClick" app/\[locale\]/\(dashboard\)/ --include="page.tsx" | grep "use client"
```

### Related
- See: Next.js 15 Server vs Client Components
- Pattern: Extract interactive UI to Client Components
- File: `app/components/LogoutButton.tsx` (reusable logout button)

---
