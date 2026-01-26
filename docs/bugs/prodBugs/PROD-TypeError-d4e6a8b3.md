# PROD BUG: TypeError - className.split is not a function

**Error Hash:** d4e6a8b3
**First Seen:** 2026-01-22 09:41:17 UTC
**Last Seen:** 2026-01-22 10:52:03 UTC
**Occurrence Count:** 5
**Level:** ERROR
**Severity:** 🟢 LOW
**Affected Users:** Unknown (client-side error)

## Error Details

**Error Type:** `TypeError`

**Full Message:**
```
[Client-Side Error] Uncaught TypeError: r.className.split is not a function
```

**URLs Affected:**
- /cities

**Sample Error ID:** 7661ba4a-2cda-4504-85f7-8a24efecc8b2

## Stack Trace
```
(No stack trace available - minified production code)
```

## Root Cause Analysis

**Issue:** `className` prop received a non-string value

**What happens:**
1. A component expects `className` to be a string
2. It calls `.split()` on the className (likely to parse multiple classes)
3. `className` is `undefined`, `null`, number, or object instead
4. `.split()` fails because it's not a string method

**Common causes:**
```typescript
// BAD - className is undefined
<Box className={undefined} />

// BAD - className is an object
<Box className={{ root: 'class-name' }} />

// BAD - className is a number
<Box className={123} />

// GOOD
<Box className="class-name" />
<Box className={clsx('class-1', 'class-2')} />
```

**Why this happens on /cities:**
- MUI's `sx` prop misuse (using className instead)
- Conditional className logic returning wrong type
- CSS module import used incorrectly

## Investigation Steps

### Step 1: Check /cities page for className usage

```bash
cd app
grep -n "className.*=" app/[locale]/(dashboard)/cities/*.tsx
```

Look for:
- `className={someObject}`
- `className={conditionalValue}` where conditionalValue might not be a string
- `className={styles}` (should be `className={styles.someClass}`)

### Step 2: Audit MUI components on cities page

Common mistake with MUI:
```typescript
// BAD - sx is not className
<Box className={sx({ color: 'red' })} />

// GOOD
<Box sx={{ color: 'red' }} />
```

### Step 3: Check CSS module imports

```typescript
// BAD - entire module object passed to className
import styles from './cities.module.css';
<div className={styles} />

// GOOD
<div className={styles.container} />
```

## Likely Code Location

**File:** `app/app/[locale]/(dashboard)/cities/page.tsx` or related client components

**Pattern to find:**
```typescript
// Search for problematic patterns
const className = {
  // This will cause .split() to fail
};

<SomeComponent className={className} />
```

## Suggested Fix

### Step 1: Add type safety for className props

```typescript
interface ComponentProps {
  className?: string; // Make it explicit
}

function MyComponent({ className }: ComponentProps) {
  // className is guaranteed to be string | undefined
  return <div className={className} />;
}
```

### Step 2: Use clsx for conditional classes

```typescript
import clsx from 'clsx';

<Box
  className={clsx(
    'base-class',
    isActive && 'active-class',
    someCondition ? 'conditional' : null
  )}
/>
```

### Step 3: Fix CSS module usage

```typescript
import styles from './cities.module.css';

// Ensure you're using specific class names
<div className={styles.citiesTable} />
<div className={clsx(styles.row, styles.active)} />
```

## Files to Investigate

Primary suspects:
- `app/app/[locale]/(dashboard)/cities/page.tsx`
- `app/app/[locale]/(dashboard)/cities/CitiesClient.tsx`
- `app/components/features/cities/*` (any city-specific components)

**Search patterns:**
```bash
cd app
# Find potential className type issues
grep -rn "className=.*{.*}" app/[locale]/(dashboard)/cities/
grep -rn "className.*Object" app/[locale]/(dashboard)/cities/
```

## Status: 🔄 NEEDS CODE AUDIT

**Created:** 2026-01-22
**Investigation Status:** Pending className prop audit on /cities page
**Fixed Date:** -
**Commit:** -

## Next Actions
1. ✅ Document issue (this file)
2. ⏳ Search for `className={` patterns in cities page
3. ⏳ Identify the component passing non-string className
4. ⏳ Add TypeScript strict checks for className props
5. ⏳ Replace problematic usage with clsx or proper string
6. ⏳ Test /cities page thoroughly
