---
name: campaign-rtl
description: Validate Hebrew-only UI and RTL layouts with MUI v6. Use when creating/reviewing UI components.
allowed-tools: [Read, Bash, Glob, Grep]
---

# Campaign Hebrew/RTL Validator

Validate Hebrew-only text and RTL layouts for the Election Campaign Management System.

## Usage

```bash
/rtl-check [target]
```

**Targets:**
- `all` - Full Hebrew/RTL audit
- `text` - Find English text violations
- `layout` - Check RTL direction attributes
- `css` - Check for physical CSS properties
- `locale` - Check date/number formatting
- `file [path]` - Audit specific file

---

## CRITICAL: This is NOT Bilingual

```
❌ This is NOT:
- A bilingual system (Hebrew + English)
- A multi-locale system
- A system with English fallbacks

✅ This IS:
- Hebrew-ONLY single language
- RTL-ONLY layouts
- he-IL locale ONLY
- No locale switching
```

---

## Hebrew Text Validation

### Find English Text

```bash
# Find English labels
grep -rn 'label="[A-Z][a-z]' app/app --include="*.tsx"
grep -rn "label='[A-Z][a-z]" app/app --include="*.tsx"

# Find English button text
grep -rn ">[A-Z][a-z].*[a-z]</" app/app --include="*.tsx" | grep -v "data-testid\|className\|href"

# Find English placeholders
grep -rn 'placeholder="[A-Z]' app/app --include="*.tsx"

# Find English titles
grep -rn 'title="[A-Z][a-z]' app/app --include="*.tsx"

# Find English error messages
grep -rn "error.*['\"][A-Z][a-z]" app/app --include="*.ts" --include="*.tsx"
```

### Common Violations

```typescript
// ❌ VIOLATION - English text
<Button>Save</Button>
<TextField label="Full Name" placeholder="Enter name" />
<Typography>No data available</Typography>
<Alert severity="error">Something went wrong</Alert>

// ✅ CORRECT - Hebrew text
<Button>שמור</Button>
<TextField label="שם מלא" placeholder="הכנס שם" />
<Typography>אין נתונים זמינים</Typography>
<Alert severity="error">אירעה שגיאה</Alert>
```

### Campaign Hebrew Vocabulary

| English | Hebrew | Context |
|---------|--------|---------|
| Save | שמור | Buttons |
| Cancel | ביטול | Buttons |
| Delete | מחק | Buttons |
| Edit | ערוך | Buttons |
| Add | הוסף | Buttons |
| Search | חיפוש | Forms |
| Filter | סינון | Tables |
| Loading | טוען... | States |
| No data | אין נתונים | Empty states |
| Error | שגיאה | Alerts |
| Success | הצלחה | Alerts |
| Activist | פעיל | Domain |
| Neighborhood | שכונה | Domain |
| City | עיר | Domain |
| Coordinator | רכז | Domain |
| Task | משימה | Domain |
| Attendance | נוכחות | Domain |

---

## RTL Layout Validation

### Find Missing RTL Direction

```bash
# Find containers without RTL
grep -rn "<Box\|<Card\|<Paper\|<Dialog\|<Drawer" app/app --include="*.tsx" | grep -v "direction.*rtl\|dir=.*rtl"

# Find forms without RTL
grep -rn "<form\|<Form" app/app --include="*.tsx" | grep -v "dir="

# Find tables without RTL
grep -rn "<Table\|<DataGrid" app/app --include="*.tsx" | grep -v "direction"
```

### Required RTL Patterns

```typescript
// ✅ Container with RTL
<Box sx={{ direction: 'rtl' }}>
  {/* content */}
</Box>

// ✅ Alternative: HTML dir attribute
<Box dir="rtl" lang="he">
  {/* content */}
</Box>

// ✅ Dialog with RTL
<Dialog open={open} sx={{ direction: 'rtl' }}>
  <DialogTitle sx={{ textAlign: 'right' }}>
    כותרת
  </DialogTitle>
  <DialogContent>
    {/* content */}
  </DialogContent>
  <DialogActions sx={{ justifyContent: 'flex-start' }}>
    <Button>ביטול</Button>
    <Button variant="contained">אישור</Button>
  </DialogActions>
</Dialog>

// ✅ Drawer from right (RTL)
<Drawer anchor="right" sx={{ direction: 'rtl' }}>
  {/* menu items */}
</Drawer>
```

---

## CSS Logical Properties

### Find Physical CSS Violations

```bash
# Find margin violations
grep -rn "marginLeft\|marginRight" app/app --include="*.tsx" --include="*.ts"
grep -rn "ml:\|mr:" app/app --include="*.tsx"

# Find padding violations
grep -rn "paddingLeft\|paddingRight" app/app --include="*.tsx" --include="*.ts"
grep -rn "pl:\|pr:" app/app --include="*.tsx"

# Find text-align violations
grep -rn "textAlign.*left" app/app --include="*.tsx" --include="*.ts"

# Find position violations
grep -rn "left:\|right:" app/app --include="*.tsx" | grep -v "textAlign"
```

### Required Conversions

```typescript
// ❌ Physical (breaks RTL)
sx={{
  marginLeft: 2,
  marginRight: 4,
  paddingLeft: 1,
  textAlign: 'left'
}}

// ✅ Logical (RTL-compatible)
sx={{
  marginInlineStart: 2,  // Right margin in RTL
  marginInlineEnd: 4,    // Left margin in RTL
  paddingInlineStart: 1, // Right padding in RTL
  textAlign: 'right'     // Hebrew is right-aligned
}}
```

**Property Mapping:**

| Physical (❌) | Logical (✅) | RTL Result |
|---------------|--------------|------------|
| marginLeft | marginInlineStart | Right margin |
| marginRight | marginInlineEnd | Left margin |
| paddingLeft | paddingInlineStart | Right padding |
| paddingRight | paddingInlineEnd | Left padding |
| borderLeft | borderInlineStart | Right border |
| borderRight | borderInlineEnd | Left border |
| left: 0 | insetInlineStart: 0 | Right: 0 |
| right: 0 | insetInlineEnd: 0 | Left: 0 |
| textAlign: left | textAlign: right | Right-aligned |

---

## MUI Theme Configuration

### Verify RTL Theme

```bash
# Check theme.ts for RTL
grep -n "direction.*rtl" app/lib/theme.ts
grep -n "stylis-plugin-rtl" app/lib/theme.ts
grep -n "CacheProvider" app/app/layout.tsx
```

### Required Configuration

```typescript
// app/lib/theme.ts
import { createTheme } from '@mui/material/styles';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import createCache from '@emotion/cache';

// RTL cache for MUI
export const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Theme with RTL direction
export const theme = createTheme({
  direction: 'rtl',  // MUST be 'rtl'
  typography: {
    fontFamily: 'Rubik, Heebo, "Noto Sans Hebrew", sans-serif',
  },
  // ... rest of theme
});
```

```typescript
// app/app/[locale]/layout.tsx
import { CacheProvider } from '@emotion/react';
import { cacheRtl, theme } from '@/lib/theme';

export default function Layout({ children }) {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <Box dir="rtl" lang="he">
          {children}
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
}
```

---

## Date/Number Locale Validation

### Find Locale Violations

```bash
# Find missing locale in date formatting
grep -rn "toLocaleDateString()" app/app --include="*.ts" --include="*.tsx"
grep -rn "toLocaleString()" app/app --include="*.ts" --include="*.tsx"
grep -rn "new Date().*format" app/app --include="*.ts" --include="*.tsx"

# Find English locale usage
grep -rn "en-US\|en_US\|en-GB" app/ --include="*.ts" --include="*.tsx"
```

### Required Formatting

```typescript
// ❌ VIOLATION - No locale
new Date().toLocaleDateString()
number.toLocaleString()

// ✅ CORRECT - Hebrew locale
new Date().toLocaleDateString('he-IL')
// Output: "26.01.2026"

(1234567).toLocaleString('he-IL')
// Output: "1,234,567"

new Date().toLocaleString('he-IL', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Jerusalem'
})
// Output: "יום ראשון, 26 בינואר 2026"
```

---

## Form Input RTL

### Hebrew Text Inputs (RTL)
```typescript
<TextField
  label="שם מלא"
  sx={{
    '& .MuiInputBase-root': { direction: 'rtl' },
    '& .MuiInputLabel-root': {
      right: 24,
      left: 'auto',
      transformOrigin: 'top right'
    }
  }}
  inputProps={{ dir: 'rtl', style: { textAlign: 'right' } }}
/>
```

### Phone/Email Inputs (LTR Exception)
```typescript
// Phone numbers stay LTR
<TextField
  label="טלפון"
  inputProps={{
    dir: 'ltr',
    inputMode: 'tel',
    style: { textAlign: 'left' }
  }}
/>

// Email stays LTR
<TextField
  label="דוא״ל"
  inputProps={{
    dir: 'ltr',
    inputMode: 'email',
    style: { textAlign: 'left' }
  }}
/>
```

---

## Output Format

```
🇮🇱 CAMPAIGN HEBREW/RTL CHECK

Scanning: app/app/components/*.tsx

TEXT VIOLATIONS:
❌ app/components/ActivistForm.tsx:42
   → English text: <Button>Save</Button>
   → FIX: Change to <Button>שמור</Button>

❌ app/components/Dashboard.tsx:28
   → English label: label="Search"
   → FIX: Change to label="חיפוש"

RTL VIOLATIONS:
❌ app/components/StatsCard.tsx:15
   → Missing RTL direction on container
   → FIX: Add sx={{ direction: 'rtl' }}

CSS VIOLATIONS:
❌ app/components/Sidebar.tsx:33
   → Physical property: marginLeft: 2
   → FIX: Change to marginInlineStart: 2

LOCALE VIOLATIONS:
❌ app/components/ActivityFeed.tsx:55
   → toLocaleDateString() without locale
   → FIX: Add 'he-IL' parameter

Summary: 12 violations found
- Text: 2
- RTL: 1
- CSS: 1
- Locale: 1
```

---

## Quick Fix Commands

```bash
# Auto-fix common CSS violations (manual review required)
# marginLeft → marginInlineStart
sed -i 's/marginLeft/marginInlineStart/g' app/components/*.tsx

# marginRight → marginInlineEnd
sed -i 's/marginRight/marginInlineEnd/g' app/components/*.tsx
```

---

## Integration

- Called by: `/protocol pre-commit`, frontend-developer agent
- Used by: hebrew-rtl-specialist agent
- Reference: `baseRules.md` section 10 (Hebrew/RTL Development Rules)

---

**Hebrew-only. RTL-only. No exceptions. 🇮🇱**
