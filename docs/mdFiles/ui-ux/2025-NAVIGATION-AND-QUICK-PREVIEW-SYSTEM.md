# 2025-2026 Navigation & Quick Preview System

**Implementation Date**: 2025-11-30
**Status**: ✅ Implemented
**Tech Stack**: Next.js 15, MUI v6, TypeScript, Hebrew RTL

---

## 📋 Overview

This document describes the modern, enterprise-grade navigation and quick-preview system implemented for the RBAC Hierarchy Platform. Based on 2025-2026 UX best practices from leading SaaS platforms (Linear, Notion, Monday.com, Asana).

---

## 🎯 Key Features

### 1. **Grouped Side Navigation**
- ✅ **3-tier grouping**: Primary, Management, System
- ✅ **Role-based menus**: SuperAdmin (6 categories), Manager (3 categories), Supervisor (2 categories)
- ✅ **Live badges**: Show real-time counts on navigation items
- ✅ **RTL support**: Fully Arabic/Hebrew compatible
- ✅ **Responsive**: Sticky on mobile, fixed on desktop

### 2. **Quick Preview Drawers**
- ✅ **Non-blocking overlays**: Users stay on current page while viewing details
- ✅ **Minimal clicks**: Access entity info instantly without full navigation
- ✅ **Progressive disclosure**: Show summary first, full details on demand
- ✅ **Mobile-optimized**: Bottom sheet on mobile, side drawer on desktop
- ✅ **Swipe-to-dismiss**: Natural mobile gestures

### 3. **Modern Interaction Patterns**
- ✅ **Card click → Quick preview**: Dashboard KPI cards open quick views
- ✅ **Hover effects**: Visual feedback on interactive elements
- ✅ **Keyboard shortcuts**: ESC to close drawers
- ✅ **Loading states**: Skeleton screens while fetching data
- ✅ **Error handling**: Graceful fallbacks

---

## 🏗️ Architecture

### Component Structure

```
app/components/
├── layout/
│   ├── NavigationClientV2.tsx        ← New grouped navigation
│   └── LanguageSwitcher.tsx
├── dashboard/
│   ├── DashboardClient.tsx            ← Updated with quick preview support
│   └── KPICard.tsx
└── quick-preview/
    ├── EntityQuickPreview.tsx         ← Router component (handles all entity types)
    ├── CorporationQuickPreview.tsx    ← Corporation drawer
    ├── SiteQuickPreview.tsx           ← Site drawer
    ├── WorkerQuickPreview.tsx         ← Worker drawer
    ├── QuickPreviewSkeleton.tsx       ← Loading state
    └── StatChip.tsx                   ← Compact KPI chip
```

---

## 📱 Navigation System

### SuperAdmin Navigation (6 Categories)

```tsx
Primary:
  └── Dashboard (לוח בקרה)
  └── Corporations (תאגידים) [badge: count]

Management:
  └── Managers (מנהלים) [badge: count]
  └── Supervisors (מפקחים) [badge: count]
  └── Sites (אתרים) [badge: active sites]
  └── Workers (עובדים) [badge: active workers]

System:
  └── Invitations (הזמנות) [badge: pending invites]
```

### Manager Navigation (3 Categories)

```tsx
Primary:
  └── Dashboard (לוח בקרה)

Management:
  └── Supervisors (מפקחים) [badge: count]
  └── Sites (אתרים) [badge: active sites]
  └── Workers (עובדים) [badge: active workers]
```

### Supervisor Navigation (2 Categories)

```tsx
Primary:
  └── Dashboard (לוח בקרה)
  └── Workers (עובדים) [badge: active workers]
```

---

## 🚀 Quick Preview System

### 1. Corporation Quick Preview

**Triggered by**: Click on corporation card, corporation row in table
**Drawer width**: 400px (desktop), 100% (mobile)
**Drawer position**: Right (LTR), Left (RTL)

**Content**:
- Header: Logo, Name, Code, Close button
- KPIs: Managers, Supervisors, Sites, Workers (2x2 grid)
- Contact Info: Address, Phone, Email
- Actions: View Full, Edit, Invite Manager

### 2. Site Quick Preview

**Triggered by**: Click on site card, site row in table

**Content**:
- Header: Icon, Name, Active status chip, Close button
- KPIs: Supervisors, Workers
- Location: Address with map icon
- Actions: View Full, Edit Site

### 3. Worker Quick Preview

**Triggered by**: Click on worker card, worker row in table

**Content**:
- Header: Avatar, Name, Active status chip, Close button
- Personal Info: Phone, ID Number
- Site Info: Site name, address (highlighted box)
- Tags: Worker tags as chips
- Actions: Edit Worker

---

## 💡 Usage Guide

### How to Use Navigation

1. **Click a menu item** → Navigate to full page
2. **Badge numbers** → Show live counts (updated on page load)
3. **Grouped sections** → Primary, Management, System (visual separation)
4. **Active state** → Blue highlight on current page

### How to Use Quick Previews

1. **Click a dashboard card** → Quick preview opens
2. **View essential info** → No navigation away from dashboard
3. **Close preview**:
   - Click outside drawer
   - Press ESC key
   - Click X button
   - Swipe down (mobile)
4. **View full details** → Click "צפה במלואו" button

---

## 🎨 Visual Design

### Colors (Semantic Mapping)

```tsx
Corporations → Blue (#6366F1)
Managers     → Purple (#A855F7)
Supervisors  → Blue (#6366F1)
Sites        → Green (#10B981)
Workers      → Orange (#F59E0B)
Invitations  → Red (#EF4444)
```

### Spacing & Layout

```tsx
Navigation width:     260px (desktop)
Quick preview width:  400px (desktop), 100% (mobile)
Card height:         80px (KPI stat chips)
Border radius:       8px (medium), 16px (large), 20px (xlarge)
Shadow:              Soft (navigation), Large (drawers)
```

### Typography

```tsx
Group labels:   0.7rem, uppercase, 600 weight
Nav items:      14px, 500 weight (normal), 600 (active)
Card titles:    h6, 600 weight
Card values:    h6, 600 weight
Captions:       caption, 500 weight
```

---

## 🌐 RTL Support

### Key RTL Considerations

1. **Drawer anchor**: `left` in RTL (appears from right visually)
2. **Icon margins**: `marginInlineStart` / `marginInlineEnd`
3. **Text alignment**: `textAlign: 'start'` (smart alignment)
4. **Navigation position**: `right: 0` (RTL), `left: 0` (LTR)
5. **Border position**: `borderLeft` (RTL), `borderRight` (LTR)

### Icons That Flip in RTL

```tsx
✅ Flip: ChevronRightIcon, ArrowForwardIcon
❌ No flip: PhoneIcon, EmailIcon, LocationOnIcon, DashboardIcon
```

---

## 📊 Performance Optimizations

### 1. Lazy Loading (Future)

```tsx
// components/quick-preview/index.tsx
const CorporationQuickPreview = lazy(() => import('./CorporationQuickPreview'));
const SiteQuickPreview = lazy(() => import('./SiteQuickPreview'));
const WorkerQuickPreview = lazy(() => import('./WorkerQuickPreview'));
```

### 2. Prefetch on Hover (Future)

```tsx
// Prefetch entity data on card hover
const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: ['corporation', corporationId],
    queryFn: () => fetchCorporation(corporationId),
    staleTime: 30000, // Cache for 30s
  });
};
```

### 3. Skeleton Loading

- **Current**: Skeleton shown while loading entity data
- **Pattern**: Same layout as actual content, gray placeholders
- **Duration**: Replaces in <500ms for cached data

---

## 🔌 Integration Points

### 1. Dashboard Cards

```tsx
// Add entityType and entityId to cards to enable quick previews
const cards = [
  {
    title: 'Total Corporations',
    value: 25,
    color: 'blue',
    icon: <BusinessIcon />,
    href: '/corporations',           // Fallback navigation
    entityType: 'corporations',      // Enables quick preview
    entityId: 'corp-123',             // Entity to preview
  },
];
```

### 2. Table Rows (Future)

```tsx
// Click on table row → Quick preview
<TableRow
  onClick={() => setQuickPreview({ type: 'workers', id: worker.id })}
  sx={{ cursor: 'pointer' }}
>
  {/* Row content */}
</TableRow>
```

### 3. Context Menus (Future)

```tsx
// Right-click on card → Context menu with quick actions
<Menu>
  <MenuItem onClick={() => handleQuickPreview(id)}>
    <VisibilityIcon /> Quick View
  </MenuItem>
  <MenuItem onClick={() => handleEdit(id)}>
    <EditIcon /> Edit
  </MenuItem>
  <MenuItem onClick={() => handleDelete(id)}>
    <DeleteIcon /> Delete
  </MenuItem>
</Menu>
```

---

## 🧪 Testing Checklist

### Desktop Testing

- [ ] Navigation renders correctly on desktop (1920x1080)
- [ ] Quick previews slide in from correct side (RTL/LTR)
- [ ] All badges show correct counts
- [ ] Clicking cards opens appropriate quick preview
- [ ] ESC key closes drawers
- [ ] Click outside drawer closes it
- [ ] "View Full" button navigates to full page

### Mobile Testing

- [ ] Navigation is sticky on mobile
- [ ] Quick previews appear as bottom sheets
- [ ] Swipe down to dismiss works
- [ ] Bottom sheet max height is 85vh
- [ ] Touch targets are minimum 44x44px
- [ ] Text is legible on small screens

### RTL Testing

- [ ] Navigation appears on right side
- [ ] Drawers slide from left side (appear from right)
- [ ] Text aligns to the right
- [ ] Icons have correct margins
- [ ] All Hebrew text displays correctly
- [ ] Badges align correctly with icons

---

## 🚧 Future Enhancements

### Phase 2 (Weeks 4-6)

1. **Context Menus**: Right-click on any entity card
2. **Keyboard Shortcuts**: ⌘+K for command palette
3. **Recent Views**: Show recently viewed entities in sidebar
4. **Breadcrumbs**: Show navigation path in header
5. **Quick Actions**: Inline actions in quick previews

### Phase 3 (Weeks 7-9)

1. **Prefetch on Hover**: Instant previews with data caching
2. **Offline Support**: Cache entity data for offline viewing
3. **Search**: Global search with quick preview results
4. **Notifications**: Badge on navigation items with unread counts
5. **Customization**: User-configurable navigation order

---

## 📝 Code Examples

### Example 1: Using Quick Preview in a Custom Component

```tsx
import { useState } from 'react';
import EntityQuickPreview from '@/components/quick-preview/EntityQuickPreview';

export default function MyComponent() {
  const [preview, setPreview] = useState({ type: null, id: null });

  return (
    <>
      <Button onClick={() => setPreview({ type: 'corporations', id: 'corp-123' })}>
        View Corporation
      </Button>

      <EntityQuickPreview
        type={preview.type}
        id={preview.id}
        open={!!preview.type && !!preview.id}
        onClose={() => setPreview({ type: null, id: null })}
      />
    </>
  );
}
```

### Example 2: Adding Stats to Navigation

```tsx
import NavigationClientV2 from '@/components/layout/NavigationClientV2';

export default async function Layout({ children }) {
  const stats = await getDashboardStats();

  return (
    <>
      <NavigationClientV2
        role="SUPERADMIN"
        stats={{
          corporations: stats.totalCorporations,
          managers: stats.totalManagers,
          supervisors: stats.totalSupervisors,
          activeSites: stats.activeSites,
          activeWorkers: stats.activeWorkers,
          pendingInvites: stats.pendingInvitations,
        }}
      />
      <main>{children}</main>
    </>
  );
}
```

---

## 🐛 Troubleshooting

### Issue: Drawer not opening

**Cause**: `type` or `id` is null/undefined
**Fix**: Ensure both `type` and `id` are provided to `EntityQuickPreview`

### Issue: RTL drawer appears on wrong side

**Cause**: Incorrect anchor setting
**Fix**: Use `anchor={isRTL ? 'left' : 'right'}` (MUI flips automatically)

### Issue: Mobile bottom sheet not swipeable

**Cause**: Using `Drawer` instead of `SwipeableDrawer`
**Fix**: Use `SwipeableDrawer` for mobile, `Drawer` for desktop

### Issue: Badges not showing

**Cause**: Stats not passed to navigation component
**Fix**: Pass `stats` prop to `NavigationClientV2`

---

## 📚 References

- [MUI Drawer Documentation](https://mui.com/material-ui/react-drawer/)
- [MUI SwipeableDrawer Documentation](https://mui.com/material-ui/react-drawer/#swipeable)
- [Linear Design System](https://linear.app)
- [Notion Design Patterns](https://notion.so)
- [Monday.com UX Research](https://monday.com)
- [2025 Enterprise Dashboard Best Practices](./2025-enterprise-navigation-best-practices.md)

---

## ✅ Implementation Status

| Component                     | Status | File Path                                           |
|-------------------------------|--------|-----------------------------------------------------|
| NavigationClientV2            | ✅ Done | `components/layout/NavigationClientV2.tsx`          |
| EntityQuickPreview (Router)   | ✅ Done | `components/quick-preview/EntityQuickPreview.tsx`   |
| CorporationQuickPreview       | ✅ Done | `components/quick-preview/CorporationQuickPreview.tsx` |
| SiteQuickPreview              | ✅ Done | `components/quick-preview/SiteQuickPreview.tsx`     |
| WorkerQuickPreview            | ✅ Done | `components/quick-preview/WorkerQuickPreview.tsx`   |
| QuickPreviewSkeleton          | ✅ Done | `components/quick-preview/QuickPreviewSkeleton.tsx` |
| StatChip                      | ✅ Done | `components/quick-preview/StatChip.tsx`             |
| DashboardClient (Updated)     | ✅ Done | `components/dashboard/DashboardClient.tsx`          |
| Hebrew Translations           | ✅ Done | `messages/he.json`                                  |
| Manager Quick Preview         | ⏳ TODO | -                                                   |
| Supervisor Quick Preview      | ⏳ TODO | -                                                   |
| Context Menus                 | ⏳ TODO | -                                                   |
| Prefetch on Hover             | ⏳ TODO | -                                                   |

---

**Last Updated**: 2025-11-30
**Maintained By**: Development Team
**Version**: 1.0.0
