# 🗳️ Production Login Credentials - Election Campaign System

Last Updated: **2025-12-13**

---

## 🎯 Test/Production User Accounts

These credentials are used in both the production seed (`app/prisma/seed.ts`) and E2E test fixtures (`tests/e2e/fixtures/auth.fixture.ts`).

### 🟣 SuperAdmin (מנהל מערכת ראשי)
```
Email:    admin@election.test
Password: admin123
Role:     SUPERADMIN
Access:   Full system access across all regions and cities
```

### 🟠 Area Manager (מנהלת אזור - שרה כהן)
```
Email:    sarah.cohen@telaviv-district.test
Password: area123
Role:     AREA_MANAGER
Region:   מחוז תל אביב (Tel Aviv District)
Access:   All cities in Tel Aviv region (תל אביב-יפו, רמת גן)
```

### 🔵 City Coordinator (רכז עיר - דוד לוי)
```
Email:    david.levi@telaviv.test
Password: manager123
Role:     CITY_COORDINATOR
City:     תל אביב-יפו (Tel Aviv-Yafo)
Access:   Tel Aviv city only - all neighborhoods, activists, coordinators
```

### 🟢 Activist Coordinator (רכזת פעילים - רחל בן-דוד)
```
Email:    rachel.bendavid@telaviv.test
Password: supervisor123
Role:     ACTIVIST_COORDINATOR
City:     תל אביב-יפו
Neighborhoods: פלורנטין (Florentin), נווה צדק (Neve Tzedek)
Access:   Assigned neighborhoods only - activists, attendance, tasks
```

---

## 🔧 Additional Test Users (Seeded)

### City Coordinator - Ramat Gan (משה ישראלי)
```
Email:    moshe.israeli@ramatgan.test
Password: manager123
Role:     CITY_COORDINATOR
City:     רמת גן
```

### Activist Coordinator - Old Jaffa (יעל כהן)
```
Email:    yael.cohen@telaviv.test
Password: supervisor123
Role:     ACTIVIST_COORDINATOR
City:     תל אביב-יפו
Neighborhoods: יפו העתיקה (Old Jaffa)
```

### Activist Coordinator - Ramat Gan (דן כרמל)
```
Email:    dan.carmel@ramatgan.test
Password: supervisor123
Role:     ACTIVIST_COORDINATOR
City:     רמת גן
Neighborhoods: מרכז העיר
```

---

## 📂 Files Using These Credentials

- **Seed File**: `app/prisma/seed.ts` (creates users in database)
- **E2E Fixtures**: `tests/e2e/fixtures/auth.fixture.ts` (test authentication helpers)
- **Multi-tenant Tests**: `tests/e2e/multi-tenant/isolation.spec.ts` (city isolation verification)

---

## 🚀 Usage

### Development (Seed Database)
```bash
cd app
npm run db:seed
```

### E2E Tests
```bash
cd app
npm run test:e2e
```

### Manual Login (Development)
1. Navigate to: `http://localhost:3200/he-IL/login`
2. Use any of the credentials above
3. Dashboard will show role-specific data

---

## 🔒 Security Notes

- **Production**: Change all passwords before deploying to production
- **Never commit** production credentials to version control
- **Environment variables**: Use `.env` for production passwords
- **SuperAdmin**: Can only be created via database seed (no UI/API creation)

---

## 🌍 Hierarchy Overview

```
SuperAdmin (admin@election.test)
└── Election Campaign System
    └── Area Manager - Tel Aviv District (sarah.cohen@telaviv-district.test)
        ├── City 1: תל אביב-יפו
        │   ├── City Coordinator: david.levi@telaviv.test
        │   └── Activist Coordinators:
        │       ├── rachel.bendavid@telaviv.test (פלורנטין, נווה צדק)
        │       └── yael.cohen@telaviv.test (יפו העתיקה)
        └── City 2: רמת גן
            ├── City Coordinator: moshe.israeli@ramatgan.test
            └── Activist Coordinator: dan.carmel@ramatgan.test (מרכז העיר)
```

---

## ✅ Verification

All credentials have been verified in:
- ✅ Production seed file (`app/prisma/seed.ts`)
- ✅ E2E test fixtures (`tests/e2e/fixtures/auth.fixture.ts`)
- ✅ Multi-city isolation tests updated to use production credentials
- ✅ Documentation logged in `/docs/bugs/bugs-archive-2025-12-22.md`
