# RBAC Documentation - v2.0 Election Campaign System

**Last Updated:** 2025-12-21

---

## 📋 Quick Start

**⭐ START HERE:** `PERMISSIONS_MATRIX.md` - The authoritative single source of truth for all RBAC permissions.

---

## 📚 Documentation Structure

### 1. Master Reference (Single Source of Truth)
- **`PERMISSIONS_MATRIX.md`** ⭐ **ALWAYS START HERE**
  - Complete page access matrix
  - Entity CRUD permissions for all roles
  - Data isolation rules with code examples
  - Creation permissions matrix
  - Security constraints and validation checklist

### 2. Role-Specific Documentation
- **`superAdminRoles.md`** - SuperAdmin permissions (v2.0)
- **`areManagerRoles.md`** - Area Manager permissions (v2.0)
- **`cityCoordinatorRoles.md`** - City Coordinator permissions (v2.0)
- **`activistCoordinatorRoles.md`** - Activist Coordinator permissions (v2.0)

### 3. System Overview
- **`hierarchy.md`** - Complete organizational hierarchy and relationships

### 4. Backup Files (Legacy)
- **`*.md.backup`** - Archived v1.3 corporate system documentation (for reference only)

---

## 🎯 Role Summary

| Role | Scope | Key Responsibilities |
|------|-------|---------------------|
| **SuperAdmin** | System-wide | Platform administration, area manager creation, system configuration |
| **Area Manager** | Region (multiple cities) | Regional campaign coordination, cross-city resource allocation |
| **City Coordinator** | Single city | City-level campaign management, coordinator supervision |
| **Activist Coordinator** | Assigned neighborhoods (M2M) | On-the-ground field operations, activist management |

---

## 🔐 Critical RBAC Rules

### Data Isolation
```typescript
// SuperAdmin - NO FILTER
const data = await prisma.activist.findMany();

// Area Manager - Filter by area
where: { neighborhood: { cityRelation: { areaManagerId: areaManager.id } } }

// City Coordinator - Filter by city
where: { neighborhood: { cityId: cityCoordinator.cityId } }

// Activist Coordinator - Filter by M2M assigned neighborhoods
where: { neighborhood_id: { in: assignedNeighborhoodIds } }
```

### Locked Pages
- **`/cities`** - SuperAdmin & Area Manager ONLY (locked 2025-12-15)
  - See: `app/app/[locale]/(dashboard)/cities/page.tsx:35`
  - **⚠️ DO NOT MODIFY WITHOUT APPROVAL**

### Security Constraints
- ❌ **NEVER** create SuperAdmin via UI/API (DB/seed only)
- ❌ **NEVER** expose `is_super_admin` flag in public APIs
- ❌ **NEVER** skip RBAC validation
- ❌ **NEVER** allow cross-tenant data leakage
- ✅ **ALWAYS** filter by scope (except SuperAdmin)
- ✅ **ALWAYS** validate M2M relationships (Activist Coordinators)

---

## 🧪 Testing

**Automated RBAC Tests:**
- `app/tests/e2e/rbac/permissions-matrix.spec.ts` - Complete RBAC enforcement test suite
  - Tests every permission in PERMISSIONS_MATRIX.md
  - Validates data isolation for all roles
  - Checks page access restrictions
  - Verifies creation permissions
  - Tests M2M relationship enforcement

**Run tests:**
```bash
cd app
npm run test:e2e -- rbac/permissions-matrix.spec.ts
```

---

## 📖 Version History

| Version | Date | System | Status |
|---------|------|--------|--------|
| 2.0 | 2025-12-21 | Election Campaign System | ✅ **CURRENT** |
| 1.3 | (legacy) | Corporate Hierarchy System | ❌ Deprecated |

### v2.0 Migration (Election Campaign System)

| v1.3 Corporate System | v2.0 Election Campaign System |
|-----------------------|-------------------------------|
| Corporations | Cities |
| Corporation Managers | City Coordinators |
| Supervisors (site_managers) | Activist Coordinators |
| Sites | Neighborhoods |
| Workers | Activists |

---

## 🔗 Related Files

### Implementation
- **Database Schema**: `../../app/prisma/schema.prisma`
- **RBAC Helpers**: `../../app/lib/auth.ts`
- **Locked Pages**: `../../app/app/[locale]/(dashboard)/cities/page.tsx:35`

### Documentation
- **Project CLAUDE.md**: `/CLAUDE.md`
- **Bug Tracking**: `../bugs.md`
- **QA Automations**: `../qa/automations/`

---

## ⚠️ Important Notes

### Before Modifying Permissions:
1. ✅ Check `PERMISSIONS_MATRIX.md` first
2. ✅ Update `PERMISSIONS_MATRIX.md` if changes needed
3. ✅ Get approval for locked pages
4. ✅ Run full RBAC test suite
5. ✅ Update role-specific documentation
6. ✅ Document changes in `../bugs.md` if fixing an issue

### Locked Page Protocol:
Files marked as **LOCKED** require explicit approval before modification:
- Check file header for lock date and reason
- Document why changes are needed
- Get approval from project owner
- Update lock documentation after changes

---

## 📞 Contact

If you find RBAC violations or security issues:

1. **Document immediately** in `/docs/infrastructure/bugs.md`
2. **Create regression test** in `app/tests/e2e/rbac/`
3. **Fix and verify** across all affected roles
4. **Update this documentation** if permissions changed

---

**📌 REMEMBER:**

**`PERMISSIONS_MATRIX.md`** is the **SINGLE SOURCE OF TRUTH** for all RBAC permissions.

When in doubt, check the matrix first.

---

**Status:** ✅ Active Documentation (v2.0 Election Campaign System)
**Last Reviewed:** 2025-12-21
**Next Review:** After any RBAC-related code changes
