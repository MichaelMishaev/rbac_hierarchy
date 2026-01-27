# PROD BUG: Error - [Client-Side Error] Uncaught TypeError: Converting circular ...

**Error Hash:** 4e7ef615
**First Seen:** 2026-01-26T18:00:30.729Z
**Last Seen:** 2026-01-26T18:00:30.729Z
**Occurrence Count:** 1
**Level:** ERROR
**Affected Users:** Unknown

## Error Details

**Error Type:** `Error`

**Full Message:**
```
[Client-Side Error] Uncaught TypeError: Converting circular structure to JSON
    --> starting at object with constructor 'HTMLInputElement'
    |     property '__reactFiber$uab2krceuqg' -> object with constructor 'rn'
    --- property 'stateNode' closes the circle
```

**URLs Affected:**
- https://app.rbac.shop/manage-voters

**HTTP Statuses:** N/A

**Sample Error IDs:**
- a976203a-7a8d-46b3-baf4-b7ab562eac9c

## Stack Trace
```
No stack trace available
```

## Root Cause Analysis

The `handleFormSubmit` function in VoterForm.tsx was accessing `e.nativeEvent.submitter` directly,
which is an HTMLInputElement DOM node. DOM nodes contain React Fiber internal properties
(`__reactFiber$...`) that have circular references (`stateNode` -> fiber -> `stateNode`).

When this DOM element was referenced anywhere that might serialize it (error tracking, logging,
or form state management), `JSON.stringify` would throw the circular structure error.

## Fix Applied

Modified `handleFormSubmit` to extract only the primitive `type` attribute string from the
submitter element, rather than holding a reference to the DOM element itself.

**Before (problematic):**
```typescript
const submitter = (e.nativeEvent as SubmitEvent).submitter;
if (!submitter || submitter.getAttribute('type') !== 'submit') { ... }
```

**After (safe):**
```typescript
const nativeEvent = e.nativeEvent as SubmitEvent;
const submitterType = nativeEvent.submitter?.getAttribute('type');
const isValidSubmit = submitterType === 'submit';
if (!isValidSubmit) { ... }
```

## Files Modified

- `app/app/[locale]/(dashboard)/manage-voters/components/VoterForm.tsx` (lines 567-593)

## Prevention Rule

**FORM-DOM-001:** Never store or pass DOM elements (HTMLElement, Event.target, nativeEvent.submitter)
to functions that might serialize them. Always extract only the primitive data you need
(strings, numbers, booleans).

## Status: ✅ FIXED

**Created:** 2026-01-26
**Fixed Date:** 2026-01-27
**Commit:** (pending commit)
