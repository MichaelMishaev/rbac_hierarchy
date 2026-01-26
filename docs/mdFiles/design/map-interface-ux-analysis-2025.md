# Map Interface UI/UX Analysis & Redesign Proposal
## 2025 Best Practices Implementation

**Date:** December 7, 2025
**Current URL:** http://localhost:3200/map-test/maplibre
**Analyzed By:** Aria - Elite UI/UX Designer

---

## Executive Summary

This comprehensive analysis evaluates the current map interface implementation against 2025 industry standards from Google Maps, Mapbox, and Apple Maps. The report provides actionable recommendations for immediate implementation to modernize the interface with glassmorphism, improved spacing systems, enhanced accessibility, and mobile-first responsive design.

---

## Current Implementation Analysis

### Existing Code Structure

**File:** `/app/app/[locale]/(dashboard)/map-test/maplibre/MapLibreClient.tsx`

**Current Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Top Stats Bar (5 chips)                            │
│ [Sites] [Corps] [Workers] [Managers] [Supervisors] │
├─────────────────────────────────────┬───────────────┤
│                                     │               │
│                                     │   Sidebar     │
│         Map Area                    │   (400px)     │
│                                     │               │
│                                     │               │
└─────────────────────────────────────┴───────────────┘
```

---

## Critical Issues Identified

### 1. Header Stats Bar Layout

**Current Issues:**
- Chips wrap on smaller screens causing vertical expansion
- Fixed positioning creates layout conflicts with sidebar toggle
- No visual grouping or categorization
- Limited mobile optimization (chips become cramped)
- Lacks visual hierarchy between metric types

**Visual Problems:**
```tsx
// Current: All chips at same level with basic hover
<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2 } }}>
  <Chip label="אתרים" />
  <Chip label="תאגידים" />
  // ... more chips
</Box>
```

**Best Practice Gap:**
- Google Maps: Categorized filter groups with clear hierarchy
- Mapbox: Card-based stat display with grouped metrics
- Apple Maps: Minimalist single-line metrics with overflow scroll

---

### 2. Spacing & Visual Hierarchy

**Current Issues:**

| Element | Current Value | Industry Standard | Gap |
|---------|--------------|-------------------|-----|
| Header padding | `px: { xs: 2, sm: 3, md: 4 }` | 24-32px consistent | Inconsistent responsive scaling |
| Chip gaps | `gap: { xs: 1.5, sm: 2 }` | 12-16px fixed | Overcomplicated breakpoints |
| Sidebar padding | `p: 3` (24px) | 32-40px for content areas | Insufficient breathing room |
| Section margins | `mb: 1` to `mb: 3` | 24px consistent modular scale | Arbitrary spacing |

**Typography Issues:**
- Font sizes vary: `13px` to `14px` (should use consistent scale)
- No defined type scale (h1-h6 hierarchy unclear)
- Missing font weight consistency (600 vs 700)

---

### 3. Color System & Theming

**Current Pastel Palette:**
```typescript
background: colors.pastel.blue,    // Stats
background: colors.pastel.green,   // Corps
background: colors.pastel.yellow,  // Workers
background: colors.pastel.purple,  // Managers
background: colors.pastel.orange,  // Supervisors
```

**Problems:**
- Pastel colors lack contrast for accessibility (WCAG AA concerns)
- No semantic color system (status vs data visualization)
- Limited dark mode support
- Insufficient color coding for data hierarchy

**Industry Standards:**
- **Mapbox:** High-contrast accent blue (`#007afc`) with neutral grays
- **Google Maps:** Clear semantic colors (blue for active, gray for inactive)
- **Apple Maps:** Minimal color usage with strong contrast ratios

---

### 4. Glassmorphism Implementation

**Current Semi-Implementation:**
```tsx
background: 'rgba(255, 255, 255, 0.98)',
backdropFilter: 'blur(20px)',
```

**Issues:**
- 98% opacity defeats glassmorphism purpose (should be 70-85%)
- Blur value too high (modern standard: 10-12px)
- No layered depth with multiple glass panels
- Missing border highlights (1px white/semi-transparent borders)

**2025 Best Practice:**
```tsx
// Proper glassmorphism (Mapbox/Apple Maps style)
background: 'rgba(255, 255, 255, 0.75)',
backdropFilter: 'blur(12px) saturate(180%)',
border: '1px solid rgba(255, 255, 255, 0.3)',
boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
```

---

### 5. Shadow System

**Current Shadows:**
```tsx
boxShadow: `0 4px 12px ${colors.pastel.blue}`,  // Chip hover
boxShadow: `0 4px 12px ${colors.neutral[300]}`, // Toggle button
```

**Problems:**
- Colored shadows (non-standard, reduces professionalism)
- No elevation system (all shadows same depth)
- Missing modern layered shadow technique

**Industry Standard (Material Design 3 / iOS):**
```tsx
// Elevation levels (Google/Apple standard)
const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.08)',
  md: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
  lg: '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
  xl: '0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)',
};
```

---

### 6. Mobile Responsiveness

**Current Breakpoints:**
```tsx
fontSize: { xs: '13px', sm: '14px' },
height: { xs: '36px', sm: '40px' },
px: { xs: 2, sm: 3, md: 4 },
```

**Issues:**
- Only 2-3 breakpoints (industry uses 4-5)
- No mobile-specific layout changes (just scaling)
- Sidebar doesn't adapt to mobile (400px fixed width problematic)
- No touch-optimized controls (44px minimum touch target)

**Best Practice (Google Maps mobile):**
- Bottom sheet for mobile (not fixed sidebar)
- Floating action buttons for primary actions
- Collapsible header on scroll
- Minimum 48x48px touch targets

---

### 7. Sidebar Design

**Current Implementation:**
```tsx
<Drawer
  anchor="right"
  width={400}
  sx={{ pt: 10 }}  // Top padding to avoid header
>
```

**Issues:**
- Fixed 400px width (not responsive)
- Right anchor conflicts with RTL (should be left in RTL mode)
- Top padding (80px) creates dead space
- No resize handle for user control
- Expand/collapse animations basic (no spring physics)

**Modern Standards:**
- Resizable panels (drag handle)
- Smooth spring animations (react-spring / framer-motion)
- Persistent width in localStorage
- Keyboard shortcuts to toggle
- Mobile: full-screen overlay with bottom sheet

---

## Industry Best Practices Comparison

### Google Maps (2025 Patterns)

**Key Takeaways:**
1. **Modular Sidebar:** Toggleable layers (traffic, transit, terrain) with clear grouping
2. **Search-First:** Prominent search bar with autocomplete
3. **Minimal Chrome:** Controls appear on hover, fade when idle
4. **Responsive Cards:** Info cards adapt from sidebar (desktop) to bottom sheets (mobile)
5. **Theme Switching:** Comprehensive dark mode with ambient navigation

**Implementation in Our Context:**
- Group stats into collapsible categories
- Add search/filter bar above stats
- Implement auto-hide header on scroll
- Convert sidebar to bottom sheet on mobile

---

### Mapbox (Design System Excellence)

**Key Takeaways:**
1. **CSS Custom Properties:** Consistent spacing via `--padding-global`
2. **Three-Tier Shadows:** Small, medium, large elevation system
3. **Glassmorphism:** Backdrop blur with mask gradients
4. **Smooth Transitions:** 200-400ms cubic-bezier easing
5. **Accessibility First:** High contrast (`#007afc`), keyboard navigation, ARIA labels

**Implementation in Our Context:**
- Create CSS variable system for spacing (8px base unit)
- Implement proper elevation system
- Add mask gradients to scrollable areas
- Enhance focus states and keyboard navigation

---

### Apple Maps (Minimalist Philosophy)

**Key Takeaways:**
1. **Functional Clarity:** No decoration, only essential elements
2. **Icon-Based UI:** Visual taxonomy for quick identification
3. **Generous Whitespace:** 32-40px content padding
4. **System Integration:** Respects OS theme preferences
5. **Privacy-Focused:** Minimal data display, clear purpose statements

**Implementation in Our Context:**
- Reduce visual clutter (remove unnecessary borders)
- Increase spacing (32px minimum for content areas)
- Use icons consistently (define icon library)
- Respect system color scheme preferences

---

## Detailed Redesign Recommendations

### 1. Header Stats Bar Redesign

**Current Problem:** Horizontal chip wrapping, no hierarchy

**Recommended Solution: Grouped Card Layout**

```tsx
// New structure: Stats grouped by category
<Box sx={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: sidebarOpen ? '400px' : '0',
  zIndex: 1100,
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(12px) saturate(180%)',
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
  px: 3,
  py: 2,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}}>
  <Stack direction="row" spacing={2} alignItems="center">
    {/* Primary Stats Group */}
    <Card sx={{
      display: 'flex',
      gap: 2,
      p: 1.5,
      background: 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(0, 0, 0, 0.06)',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    }}>
      {/* Sites - Primary Metric */}
      <StatChip
        icon={<MapIcon />}
        label="אתרים פעילים"
        value={stats.activeSites}
        color="primary"
        size="large"
      />
      <Divider orientation="vertical" flexItem />

      {/* Secondary Metrics */}
      <Stack direction="row" spacing={1.5}>
        <StatChip icon={<BusinessIcon />} value={stats.corps} color="secondary" />
        <StatChip icon={<PersonIcon />} value={stats.workers} color="secondary" />
      </Stack>
    </Card>

    {/* Team Stats Group */}
    <Card sx={{ /* same glass style */ }}>
      <Stack direction="row" spacing={1.5}>
        <StatChip icon={<ManagerIcon />} label="מנהלים" value={stats.managers} />
        <StatChip icon={<SupervisorIcon />} label="מפקחים" value={stats.supervisors} />
      </Stack>
    </Card>

    {/* Spacer */}
    <Box sx={{ flexGrow: 1 }} />

    {/* Actions */}
    <IconButton size="small" sx={{ /* glass button style */ }}>
      <FilterListIcon />
    </IconButton>
  </Stack>
</Box>
```

**Benefits:**
- No wrapping (horizontal scroll on mobile if needed)
- Clear visual grouping (primary vs secondary stats)
- Glassmorphism layering creates depth
- Dividers provide visual separation
- Actions isolated on the right

---

### 2. Enhanced Spacing System

**Implement 8px Grid System (Industry Standard):**

```tsx
// Create design tokens
export const spacing = {
  xs: '4px',    // 0.5 units
  sm: '8px',    // 1 unit
  md: '16px',   // 2 units
  lg: '24px',   // 3 units
  xl: '32px',   // 4 units
  xxl: '48px',  // 6 units
  xxxl: '64px', // 8 units
};

// Apply consistently
const theme = createTheme({
  spacing: 8, // Base unit
  components: {
    MuiChip: {
      styleOverrides: {
        root: {
          height: '40px', // 5 units
          paddingLeft: '16px', // 2 units
          paddingRight: '16px',
          gap: '8px', // 1 unit
        },
      },
    },
  },
});
```

**Apply to Components:**
```tsx
// Header
px: 3,  // 24px
py: 2,  // 16px

// Sidebar
p: 4,   // 32px

// Card sections
mb: 3,  // 24px

// List items
py: 1.5, // 12px
px: 2,   // 16px
```

---

### 3. Proper Glassmorphism Implementation

**Current vs Recommended:**

```tsx
// ❌ CURRENT: Too opaque, over-blurred
background: 'rgba(255, 255, 255, 0.98)',
backdropFilter: 'blur(20px)',

// ✅ RECOMMENDED: True glassmorphism
background: 'rgba(255, 255, 255, 0.75)',
backdropFilter: 'blur(12px) saturate(180%)',
border: '1px solid rgba(255, 255, 255, 0.3)',
boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',

// ✅ DARK MODE VARIANT
background: 'rgba(30, 30, 30, 0.75)',
backdropFilter: 'blur(12px) saturate(180%)',
border: '1px solid rgba(255, 255, 255, 0.1)',
boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
```

**Apply to All Glass Elements:**
1. Header stats bar
2. Sidebar drawer
3. Map control buttons
4. Info cards/tooltips
5. Modal overlays

**CSS Variables Approach:**
```tsx
// In theme configuration
const glassStyles = {
  light: {
    background: 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(12px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  },
  dark: {
    background: 'rgba(30, 30, 30, 0.75)',
    backdropFilter: 'blur(12px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
  },
};

// Usage
<Box sx={{
  ...glassStyles[theme.palette.mode],
}}>
```

---

### 4. Enhanced Shadow System

**Create Elevation Tokens:**

```tsx
// Design system: lib/design-system.ts
export const shadows = {
  none: 'none',

  // Primary elevations (black shadows)
  sm: '0 1px 2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08)',
  md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',

  // Inner shadow (for depth)
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',

  // Glass shadow (for glassmorphism)
  glass: '0 8px 32px rgba(0, 0, 0, 0.08)',

  // Focus ring (accessibility)
  focus: '0 0 0 3px rgba(66, 153, 225, 0.5)',
};

// Apply to components
const StatCard = styled(Card)({
  boxShadow: shadows.md,
  '&:hover': {
    boxShadow: shadows.lg,
    transform: 'translateY(-2px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
});
```

**Remove Colored Shadows:**
```tsx
// ❌ REMOVE
boxShadow: `0 4px 12px ${colors.pastel.blue}`,

// ✅ REPLACE WITH
boxShadow: shadows.md,
'&:hover': {
  boxShadow: shadows.lg,
}
```

---

### 5. Mobile-First Responsive Design

**Breakpoint Strategy:**

```tsx
// Define breakpoints (Material-UI default)
const breakpoints = {
  xs: 0,      // Mobile portrait
  sm: 600,    // Mobile landscape
  md: 900,    // Tablet
  lg: 1200,   // Desktop
  xl: 1536,   // Large desktop
};

// Mobile-specific layout changes
<Box sx={{
  // Mobile: bottom sheet
  [theme.breakpoints.down('md')]: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    top: 'auto',
    height: 'auto',
    maxHeight: '60vh',
    borderRadius: '24px 24px 0 0',
    borderBottom: 'none',
    borderTop: '1px solid rgba(0, 0, 0, 0.08)',
  },

  // Desktop: sidebar
  [theme.breakpoints.up('md')]: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '400px',
    borderLeft: '1px solid rgba(0, 0, 0, 0.08)',
  },
}}>
```

**Header Mobile Adaptation:**

```tsx
// Mobile: Single-line with overflow scroll
<Box sx={{
  [theme.breakpoints.down('md')]: {
    overflowX: 'auto',
    overflowY: 'hidden',
    whiteSpace: 'nowrap',
    scrollbarWidth: 'none', // Firefox
    '&::-webkit-scrollbar': { display: 'none' }, // Chrome/Safari

    // Fade edges
    maskImage: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
  },
}}>
  <Stack direction="row" spacing={1.5} sx={{ display: 'inline-flex' }}>
    {/* Stats chips */}
  </Stack>
</Box>
```

**Touch Target Optimization:**

```tsx
// Minimum 48x48px touch targets (WCAG guideline)
const MobileChip = styled(Chip)(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    minHeight: '48px',
    minWidth: '48px',
    fontSize: '14px',
    padding: '12px 16px',
  },
}));

// Map controls: larger on mobile
const MapControl = styled(IconButton)(({ theme }) => ({
  width: '40px',
  height: '40px',

  [theme.breakpoints.down('md')]: {
    width: '56px',
    height: '56px',
    fontSize: '24px',
  },
}));
```

---

### 6. Sidebar Redesign

**Current Issues:**
- Fixed width (not flexible)
- Basic animations
- No resize functionality
- Right anchor in RTL (should be left)

**Recommended: Resizable Panel with Spring Animations**

```tsx
import { motion, useSpring } from 'framer-motion';

const ResizableSidebar = () => {
  const [width, setWidth] = useState(400);
  const springWidth = useSpring(width, { stiffness: 300, damping: 30 });

  return (
    <motion.div
      style={{
        width: springWidth,
        position: 'fixed',
        top: 0,
        left: 0, // LEFT for RTL
        bottom: 0,
        zIndex: 1200,
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* Content */}

      {/* Resize Handle */}
      <Box
        sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '8px',
          cursor: 'ew-resize',
          '&:hover': {
            background: 'rgba(0, 0, 0, 0.1)',
          },
        }}
        onMouseDown={handleResizeStart}
      />
    </motion.div>
  );
};
```

**Mobile: Bottom Sheet**

```tsx
import { Sheet } from 'react-modal-sheet';

const MobileSidebar = ({ open, onClose }) => (
  <Sheet
    isOpen={open}
    onClose={onClose}
    snapPoints={[600, 400, 100, 0]}
    initialSnap={1}
  >
    <Sheet.Container>
      <Sheet.Header />
      <Sheet.Content>
        {/* Same content as desktop sidebar */}
      </Sheet.Content>
    </Sheet.Container>
    <Sheet.Backdrop onTap={onClose} />
  </Sheet>
);
```

---

### 7. Color System Redesign

**Current Pastel Issues:**
- Low contrast (WCAG concerns)
- Too many colors (5 for stats)
- No semantic meaning

**Recommended: High-Contrast Semantic System**

```tsx
// New color system
export const colors = {
  // Brand (primary actions)
  primary: {
    main: '#007aff',      // Apple/Mapbox blue
    light: '#5AC8FA',
    dark: '#0051D5',
    contrast: '#FFFFFF',
  },

  // Semantic (status)
  semantic: {
    success: '#34C759',   // Green (active/healthy)
    warning: '#FF9500',   // Orange (attention)
    error: '#FF3B30',     // Red (critical)
    info: '#007AFF',      // Blue (informational)
  },

  // Data visualization (charts/stats)
  data: {
    blue: '#007AFF',
    teal: '#5AC8FA',
    green: '#34C759',
    yellow: '#FFCC00',
    orange: '#FF9500',
    pink: '#FF2D55',
    purple: '#AF52DE',
  },

  // Neutral (backgrounds, borders)
  neutral: {
    0: '#FFFFFF',
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

// Apply to stats
<Chip
  icon={<MapIcon />}
  label="אתרים"
  sx={{
    background: colors.primary.main,
    color: colors.primary.contrast,
    '&:hover': {
      background: colors.primary.dark,
    },
  }}
/>
```

**Accessibility Compliance:**
```tsx
// Ensure 4.5:1 contrast ratio for text
const getContrastColor = (bgColor: string) => {
  const luminance = calculateLuminance(bgColor);
  return luminance > 0.5 ? colors.neutral[900] : colors.neutral[0];
};
```

---

### 8. Typography Scale

**Implement Type System:**

```tsx
// Design tokens
export const typography = {
  fontFamily: {
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", "Consolas", "Liberation Mono", monospace',
  },

  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Apply to MUI theme
const theme = createTheme({
  typography: {
    fontFamily: typography.fontFamily.primary,
    h1: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
    },
    h2: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
    },
    body1: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.normal,
    },
    button: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      textTransform: 'none', // No uppercase
    },
  },
});
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Priority: Design System Tokens**

1. Create `/lib/design-system/tokens.ts`:
   - Spacing scale (8px grid)
   - Color system (high-contrast semantic)
   - Typography scale
   - Shadow elevations
   - Border radius values

2. Update MUI theme configuration:
   - Apply tokens to theme
   - Configure RTL support
   - Setup dark mode

3. Create reusable components:
   - `GlassCard` component
   - `StatChip` component
   - `ElevatedButton` component

**Estimated Time:** 2-3 days
**Files to Create:**
- `/lib/design-system/tokens.ts`
- `/lib/design-system/theme.ts`
- `/components/ui/GlassCard.tsx`
- `/components/ui/StatChip.tsx`

---

### Phase 2: Header Redesign (Week 1-2)

**Priority: Stats Bar & Grouping**

1. Implement grouped card layout
2. Add glassmorphism styling
3. Create responsive behavior:
   - Desktop: horizontal cards
   - Tablet: two-line wrap
   - Mobile: horizontal scroll with fade edges

4. Add filter/search functionality
5. Implement keyboard shortcuts

**Estimated Time:** 3-4 days
**Files to Modify:**
- `/app/[locale]/(dashboard)/map-test/maplibre/MapLibreClient.tsx`

**Code Changes:**
```tsx
// New header component
<HeaderStatsBar
  stats={data.stats}
  sidebarOpen={sidebarOpen}
  onFilterClick={handleFilterClick}
/>
```

---

### Phase 3: Sidebar Enhancement (Week 2)

**Priority: Resizable Panel & Mobile Bottom Sheet**

1. Install dependencies:
   ```bash
   npm install framer-motion react-modal-sheet
   ```

2. Create resizable sidebar component:
   - Drag handle for width adjustment
   - LocalStorage persistence
   - Spring animations

3. Implement mobile bottom sheet:
   - Snap points (full, half, peek, closed)
   - Swipe gestures
   - Overlay backdrop

4. Enhance sidebar content:
   - Improved list styling
   - Search/filter within sidebar
   - Smooth expand/collapse animations

**Estimated Time:** 4-5 days
**Files to Create:**
- `/components/map/ResizableSidebar.tsx`
- `/components/map/MobileSidebar.tsx`

---

### Phase 4: Polish & Accessibility (Week 2-3)

**Priority: WCAG AA Compliance & Performance**

1. Accessibility audit:
   - Add ARIA labels to all interactive elements
   - Ensure keyboard navigation
   - Test with screen readers
   - Verify color contrast ratios

2. Performance optimization:
   - Lazy load sidebar content
   - Virtual scrolling for long lists
   - Optimize re-renders

3. Add micro-interactions:
   - Hover states
   - Focus indicators
   - Loading skeletons
   - Success/error toasts

4. Testing:
   - Cross-browser testing
   - Mobile device testing
   - RTL verification
   - Performance metrics

**Estimated Time:** 3-4 days
**Testing Tools:**
- Chrome Lighthouse
- WAVE accessibility tool
- axe DevTools
- React DevTools Profiler

---

### Phase 5: Advanced Features (Week 3)

**Priority: Enhanced UX**

1. Map controls modernization:
   - Floating action buttons
   - Zoom controls with glassmorphism
   - Layer toggles (traffic, labels, etc.)

2. Legend component:
   - Collapsible legend panel
   - Color-coded markers
   - Filter by category

3. Search & autocomplete:
   - Site search in header
   - Fuzzy matching
   - Recent searches

4. Dark mode:
   - System preference detection
   - Manual toggle
   - Persistent setting

**Estimated Time:** 4-5 days

---

## Code Snippets: Key Improvements

### 1. Design Tokens File

**Create:** `/lib/design-system/tokens.ts`

```typescript
export const tokens = {
  // Spacing (8px grid system)
  spacing: {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
  },

  // Border radius
  radius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },

  // Shadows (elevation system)
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    glass: '0 8px 32px rgba(0, 0, 0, 0.08)',
  },

  // Glassmorphism
  glass: {
    light: {
      background: 'rgba(255, 255, 255, 0.75)',
      backdropFilter: 'blur(12px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
    },
    dark: {
      background: 'rgba(30, 30, 30, 0.75)',
      backdropFilter: 'blur(12px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
  },

  // Colors (high-contrast semantic)
  colors: {
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#007AFF', // Main
      600: '#0051D5',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    neutral: {
      0: '#FFFFFF',
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    semantic: {
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30',
      info: '#007AFF',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"SF Mono", "Consolas", monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
```

---

### 2. GlassCard Component

**Create:** `/components/ui/GlassCard.tsx`

```typescript
'use client';

import { Box, BoxProps, useTheme } from '@mui/material';
import { tokens } from '@/lib/design-system/tokens';

interface GlassCardProps extends BoxProps {
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
  blur?: number;
}

export function GlassCard({
  elevation = 'md',
  blur = 12,
  children,
  sx,
  ...props
}: GlassCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const glassStyle = isDark ? tokens.glass.dark : tokens.glass.light;

  return (
    <Box
      sx={{
        ...glassStyle,
        backdropFilter: `blur(${blur}px) saturate(180%)`,
        boxShadow: tokens.shadows[elevation],
        borderRadius: tokens.radius.lg,
        transition: tokens.transitions.base,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
```

**Usage:**
```tsx
<GlassCard elevation="lg" p={3}>
  <Typography>Glass effect content</Typography>
</GlassCard>
```

---

### 3. StatChip Component

**Create:** `/components/ui/StatChip.tsx`

```typescript
'use client';

import { Chip, ChipProps, Box, Typography } from '@mui/material';
import { tokens } from '@/lib/design-system/tokens';
import { ReactNode } from 'react';

interface StatChipProps {
  icon: ReactNode;
  label: string;
  value: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

export function StatChip({
  icon,
  label,
  value,
  color = 'primary',
  size = 'medium',
  onClick,
}: StatChipProps) {
  const heightMap = {
    small: '32px',
    medium: '40px',
    large: '48px',
  };

  const fontSizeMap = {
    small: tokens.typography.fontSize.xs,
    medium: tokens.typography.fontSize.sm,
    large: tokens.typography.fontSize.base,
  };

  return (
    <Chip
      icon={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {icon}
          <Typography
            variant="h6"
            fontWeight={tokens.typography.fontWeight.bold}
            fontSize={fontSizeMap[size]}
          >
            {value}
          </Typography>
        </Box>
      }
      label={label}
      onClick={onClick}
      sx={{
        height: heightMap[size],
        px: 2,
        py: 1,
        borderRadius: tokens.radius.xl,
        boxShadow: tokens.shadows.sm,
        transition: tokens.transitions.base,
        backgroundColor: `${color}.main`,
        color: `${color}.contrastText`,
        '& .MuiChip-icon': {
          marginInlineEnd: 1,
          color: 'inherit',
        },
        '&:hover': {
          boxShadow: tokens.shadows.md,
          transform: 'translateY(-2px)',
          backgroundColor: `${color}.dark`,
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      }}
    />
  );
}
```

**Usage:**
```tsx
<StatChip
  icon={<MapIcon />}
  label="אתרים פעילים"
  value={stats.activeSites}
  color="primary"
  size="large"
/>
```

---

### 4. Improved Header Component

**Create:** `/components/map/HeaderStatsBar.tsx`

```typescript
'use client';

import { Box, Stack, IconButton, Divider } from '@mui/material';
import { FilterList as FilterIcon } from '@mui/icons-material';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatChip } from '@/components/ui/StatChip';
import { tokens } from '@/lib/design-system/tokens';
import {
  Map as MapIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  SupervisorAccount as ManagerIcon,
} from '@mui/icons-material';

interface HeaderStatsBarProps {
  stats: {
    activeSites: number;
    activeCorporations: number;
    activeWorkers: number;
    totalManagers: number;
    totalSupervisors: number;
  };
  sidebarOpen: boolean;
  onFilterClick?: () => void;
}

export function HeaderStatsBar({ stats, sidebarOpen, onFilterClick }: HeaderStatsBarProps) {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: sidebarOpen ? '400px' : '0',
        zIndex: 1100,
        ...tokens.glass.light,
        borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
        px: { xs: 2, md: 3 },
        py: 2,
        transition: `right ${tokens.transitions.base}`,
        direction: 'rtl',

        // Mobile: horizontal scroll
        [theme.breakpoints.down('md')]: {
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          maskImage: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
        },
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{
          display: { xs: 'inline-flex', md: 'flex' },
          minWidth: 'min-content',
        }}
      >
        {/* Primary Stats Group */}
        <GlassCard
          elevation="sm"
          sx={{
            display: 'flex',
            gap: 2,
            p: 1.5,
            flexShrink: 0,
          }}
        >
          <StatChip
            icon={<MapIcon />}
            label="אתרים פעילים"
            value={stats.activeSites}
            color="primary"
            size="large"
          />

          <Divider orientation="vertical" flexItem />

          <Stack direction="row" spacing={1.5}>
            <StatChip
              icon={<BusinessIcon />}
              label="תאגידים"
              value={stats.activeCorporations}
              color="secondary"
              size="medium"
            />
            <StatChip
              icon={<PersonIcon />}
              label="עובדים"
              value={stats.activeWorkers}
              color="secondary"
              size="medium"
            />
          </Stack>
        </GlassCard>

        {/* Team Stats Group */}
        <GlassCard
          elevation="sm"
          sx={{
            display: 'flex',
            gap: 1.5,
            p: 1.5,
            flexShrink: 0,
          }}
        >
          <StatChip
            icon={<ManagerIcon />}
            label="מנהלים"
            value={stats.totalManagers}
            color="secondary"
            size="medium"
          />
          <StatChip
            icon={<ManagerIcon />}
            label="מפקחים"
            value={stats.totalSupervisors}
            color="secondary"
            size="medium"
          />
        </GlassCard>

        {/* Spacer (desktop only) */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />

        {/* Filter Action */}
        <IconButton
          onClick={onFilterClick}
          sx={{
            ...tokens.glass.light,
            boxShadow: tokens.shadows.sm,
            width: 40,
            height: 40,
            '&:hover': {
              boxShadow: tokens.shadows.md,
              transform: 'translateY(-2px)',
            },
          }}
        >
          <FilterIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
```

---

### 5. Resizable Sidebar Component

**Install dependencies:**
```bash
npm install framer-motion
```

**Create:** `/components/map/ResizableSidebar.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Box, IconButton, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { tokens } from '@/lib/design-system/tokens';

interface ResizableSidebarProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const MIN_WIDTH = 300;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 400;

export function ResizableSidebar({ open, onClose, children }: ResizableSidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  const motionWidth = useMotionValue(width);
  const springWidth = useSpring(motionWidth, { stiffness: 300, damping: 30 });

  // Load saved width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (parsedWidth >= MIN_WIDTH && parsedWidth <= MAX_WIDTH) {
        setWidth(parsedWidth);
        motionWidth.set(parsedWidth);
      }
    }
  }, []);

  // Save width to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarWidth', width.toString());
  }, [width]);

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  const handleResize = (e: MouseEvent) => {
    if (!isResizing) return;

    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
      setWidth(newWidth);
      motionWidth.set(newWidth);
    }
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

  if (!open) return null;

  // Mobile: use full-width bottom sheet instead
  if (isMobile) {
    return (
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '70vh',
          zIndex: 1300,
          borderRadius: '24px 24px 0 0',
          ...tokens.glass.light,
          borderTop: `1px solid ${tokens.colors.neutral[200]}`,
          boxShadow: tokens.shadows.xl,
        }}
      >
        <Box sx={{ p: 3, overflowY: 'auto', maxHeight: '70vh' }}>
          {/* Drag handle */}
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: tokens.radius.full,
              background: tokens.colors.neutral[300],
              margin: '0 auto 16px',
            }}
          />

          {children}
        </Box>
      </motion.div>
    );
  }

  // Desktop: resizable sidebar
  return (
    <motion.div
      style={{
        width: springWidth,
        position: 'fixed',
        top: 0,
        left: 0, // LEFT for RTL
        bottom: 0,
        zIndex: 1200,
        ...tokens.glass.light,
        borderRight: `1px solid ${tokens.colors.neutral[200]}`,
        boxShadow: tokens.shadows.lg,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 3,
          borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
        }}
      >
        <Typography variant="h5" fontWeight={tokens.typography.fontWeight.bold}>
          פרטי מערכת
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3, overflowY: 'auto', height: 'calc(100% - 72px)' }}>
        {children}
      </Box>

      {/* Resize Handle */}
      <Box
        onMouseDown={handleResizeStart}
        sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: 'ew-resize',
          background: isResizing ? tokens.colors.primary[500] : 'transparent',
          transition: tokens.transitions.fast,
          '&:hover': {
            background: tokens.colors.neutral[200],
          },
          '&:active': {
            background: tokens.colors.primary[500],
          },
        }}
      />
    </motion.div>
  );
}
```

**Usage in main component:**
```tsx
<ResizableSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
  {/* Sidebar content */}
</ResizableSidebar>
```

---

## Accessibility Checklist

### WCAG 2.1 AA Compliance

- [ ] **Color Contrast:**
  - Text: 4.5:1 minimum ratio
  - Large text (18px+): 3:1 minimum
  - UI components: 3:1 minimum
  - Test with: Chrome DevTools Contrast Checker

- [ ] **Keyboard Navigation:**
  - All interactive elements focusable via Tab
  - Focus indicators visible (3px outline)
  - Logical tab order
  - Escape key closes modals/drawers

- [ ] **ARIA Labels:**
  ```tsx
  <IconButton
    aria-label="סגור סרגל צד"
    onClick={onClose}
  >
    <CloseIcon />
  </IconButton>

  <Chip
    aria-label={`${value} ${label}`}
    role="status"
  />
  ```

- [ ] **Touch Targets:**
  - Minimum 48x48px on mobile
  - 8px spacing between targets
  - Test on actual devices

- [ ] **Screen Reader Support:**
  - Semantic HTML (`<nav>`, `<main>`, `<aside>`)
  - ARIA landmarks
  - Live regions for dynamic content
  - Alt text for icons

- [ ] **Motion Sensitivity:**
  ```tsx
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  <motion.div
    animate={prefersReducedMotion ? {} : { y: 0 }}
  />
  ```

---

## Performance Optimization

### Metrics Targets

- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.5s
- **Cumulative Layout Shift (CLS):** < 0.1

### Optimization Strategies

1. **Code Splitting:**
   ```tsx
   const MapLibreMap = dynamic(() => import('./MapLibreMap'), {
     ssr: false,
     loading: () => <MapSkeleton />,
   });
   ```

2. **Virtual Scrolling:**
   ```tsx
   import { FixedSizeList } from 'react-window';

   <FixedSizeList
     height={600}
     itemCount={corporations.length}
     itemSize={64}
   >
     {({ index, style }) => (
       <CorporationItem data={corporations[index]} style={style} />
     )}
   </FixedSizeList>
   ```

3. **Image Optimization:**
   ```tsx
   import Image from 'next/image';

   <Image
     src="/map-marker.svg"
     width={32}
     height={32}
     loading="lazy"
     alt="Site marker"
   />
   ```

4. **Debounce Resize Events:**
   ```tsx
   import { useDebouncedCallback } from 'use-debounce';

   const handleResize = useDebouncedCallback((e: MouseEvent) => {
     // Resize logic
   }, 16); // 60fps
   ```

---

## Testing Strategy

### Visual Regression Testing

```bash
# Install Playwright
npm install -D @playwright/test

# Create visual test
// tests/e2e/map/visual.spec.ts
import { test, expect } from '@playwright/test';

test('map interface matches snapshot', async ({ page }) => {
  await page.goto('/map-test/maplibre');

  // Wait for map to load
  await page.waitForSelector('[data-testid="map-container"]');

  // Take screenshot
  await expect(page).toHaveScreenshot('map-interface.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
```

### Accessibility Testing

```bash
# Install axe
npm install -D @axe-core/playwright

// tests/e2e/map/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('map interface has no accessibility violations', async ({ page }) => {
  await page.goto('/map-test/maplibre');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### Performance Testing

```typescript
// tests/e2e/map/performance.spec.ts
test('map loads within performance budget', async ({ page }) => {
  await page.goto('/map-test/maplibre');

  const metrics = await page.evaluate(() => {
    const perfData = performance.getEntriesByType('navigation')[0];
    return {
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
      tti: perfData.loadEventEnd - perfData.fetchStart,
    };
  });

  expect(metrics.fcp).toBeLessThan(1500);
  expect(metrics.lcp).toBeLessThan(2500);
  expect(metrics.tti).toBeLessThan(3500);
});
```

---

## Mobile-Specific Recommendations

### iOS Optimizations

```tsx
// Prevent zoom on input focus
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
/>

// Safe area insets
<Box sx={{
  paddingTop: 'env(safe-area-inset-top)',
  paddingBottom: 'env(safe-area-inset-bottom)',
}}>

// Smooth scrolling (iOS momentum)
<Box sx={{
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
}}>
```

### Android Optimizations

```tsx
// Hardware acceleration
<Box sx={{
  transform: 'translateZ(0)',
  willChange: 'transform',
}}>

// Touch action (prevent pull-to-refresh)
<Box sx={{
  touchAction: 'pan-y',
}}>
```

### PWA Enhancements

```json
// public/manifest.json
{
  "name": "Map Interface",
  "short_name": "Map",
  "theme_color": "#007AFF",
  "background_color": "#FFFFFF",
  "display": "standalone",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Summary: Priority Fixes

### Immediate (This Week)

1. **Create design system tokens** (1 day)
   - Spacing, colors, typography, shadows
   - Update theme configuration

2. **Fix header stats layout** (2 days)
   - Implement grouped card design
   - Add glassmorphism
   - Make mobile-responsive

3. **Enhance color contrast** (1 day)
   - Replace pastel colors with high-contrast system
   - Test WCAG compliance

### Short-Term (Next Week)

4. **Resizable sidebar** (2 days)
   - Add drag handle
   - Spring animations
   - Mobile bottom sheet

5. **Improve shadows & depth** (1 day)
   - Remove colored shadows
   - Implement elevation system

6. **Typography scale** (1 day)
   - Consistent font sizes
   - Clear hierarchy

### Medium-Term (Week 3)

7. **Accessibility audit** (2 days)
   - ARIA labels
   - Keyboard navigation
   - Screen reader testing

8. **Performance optimization** (2 days)
   - Code splitting
   - Virtual scrolling
   - Image optimization

9. **Dark mode** (2 days)
   - Theme toggle
   - System preference detection

---

## Final Recommendations

### Design Philosophy Alignment

Your current implementation shows good bones, but needs refinement to match 2025 industry standards:

1. **Simplify Color Palette:** Move from 5+ pastel colors to 2-3 high-contrast semantic colors
2. **Increase Spacing:** Apple/Google use 32-48px padding in content areas (you're using 24px)
3. **Proper Glassmorphism:** Lower opacity (75% instead of 98%), less blur (12px instead of 20px)
4. **Elevation System:** Use consistent shadow depths (remove colored shadows)
5. **Mobile-First:** Implement bottom sheets, not just scaled-down sidebars

### Key Metrics to Track

- **Accessibility Score:** Target 95+ in Lighthouse
- **Performance Score:** Target 90+ in Lighthouse
- **User Engagement:** Track sidebar usage, filter interactions
- **Mobile Usability:** Test on real devices (iOS Safari, Chrome Android)

### Resources for Reference

- **Mapbox Design:** https://docs.mapbox.com/help/tutorials/
- **Google Maps Platform:** https://developers.google.com/maps/documentation
- **Material Design 3:** https://m3.material.io/
- **iOS Human Interface Guidelines:** https://developer.apple.com/design/human-interface-guidelines/

---

**Next Steps:**

1. Review this document with the team
2. Prioritize fixes based on roadmap
3. Create Jira/Linear tickets for each phase
4. Set up weekly design review meetings
5. Begin implementation with Phase 1 (design tokens)

**Questions or clarifications needed?** I'm here to provide code examples, conduct design reviews, or assist with implementation.

---

**Document Version:** 1.0
**Last Updated:** December 7, 2025
**Author:** Aria - Elite UI/UX Designer
**Review Status:** Ready for Implementation
