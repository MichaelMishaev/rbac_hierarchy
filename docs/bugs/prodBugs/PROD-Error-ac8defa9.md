# PROD BUG: Error - [Client-Side Error] Uncaught TypeError: Converting circular ...

**Error Hash:** ac8defa9
**First Seen:** 2026-01-26T18:04:18.533Z
**Last Seen:** 2026-01-26T18:04:18.533Z
**Occurrence Count:** 1
**Level:** ERROR
**Affected Users:** Unknown

## Error Details

**Error Type:** `Error`

**Full Message:**
```
[Client-Side Error] Uncaught TypeError: Converting circular structure to JSON
    --> starting at object with constructor 'HTMLInputElement'
    |     property '__reactFiber$wohz307vbl' -> object with constructor 'rn'
    --- property 'stateNode' closes the circle
```

**URLs Affected:**
- https://app.rbac.shop/manage-voters?supportLevel=&contactStatus=&priority=&notes=

**HTTP Statuses:** N/A

**Sample Error IDs:**
- e23da586-2dc3-4bab-b001-d958357cc982

## Stack Trace
```
No stack trace available
```

## Root Cause Analysis

**Same root cause as PROD-Error-4e7ef615** - different React Fiber ID from different user session.

The `handleFormSubmit` function in VoterForm.tsx was accessing `e.nativeEvent.submitter` directly,
which contains circular React Fiber references that break JSON.stringify.

## Fix Applied

See PROD-Error-4e7ef615.md for full fix details.

Modified `handleFormSubmit` to extract only primitive attribute strings instead of DOM element references.

## Files Modified

- `app/app/[locale]/(dashboard)/manage-voters/components/VoterForm.tsx` (lines 567-593)

## Status: ✅ FIXED

**Created:** 2026-01-26
**Fixed Date:** 2026-01-27
**Commit:** (pending commit)
