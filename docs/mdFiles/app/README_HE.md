# 🏢 מערכת ניהול תאגידים - תיעוד טכני

**גרסה:** 1.0.0 MVP
**תאריך:** 2025-11-28
**שפה ראשית:** עברית 🇮🇱

---

## 📋 סקירה כללית

מערכת ניהול היררכית לתאגידים, אתרים ועובדים עם תמיכה מלאה בעברית ו-RTL.

### מבנה היררכי
```
תאגיד (Corporation)
  └── אתרים (Sites)
      └── עובדים (Workers)

משתמשים (Users):
  - מנהל על (SUPERADMIN) - ניהול כל המערכת
  - מנהל (MANAGER) - ניהול תאגיד
  - רכז שכונתי (SUPERVISOR) - ניהול אתר
```

---

## 🎨 עיצוב Monday.com

### פלטת צבעים רשמית
```typescript
// צבעים ראשיים
Primary Blue:    #6161FF  (כחול קורנפלאואר)
Primary Dark:    #5034FF  (כחול כהה)
Primary Light:   #7F7FFF  (כחול בהיר)

// צבעי סטטוס (10 צבעים)
Red:        #E44258  (אדום)
Orange:     #FDAB3D  (כתום)
Yellow:     #FFCB00  (צהוב)
Green:      #00C875  (ירוק) - הצלחה
Purple:     #A25DDC  (סגול)
Pink:       #FF158A  (ורוד)
Blue:       #0086C0  (כחול) - מידע
```

### פונט Figtree
```css
font-family: "Figtree", -apple-system, BlinkMacSystemFont, sans-serif;
```

---

## 🏗️ ארכיטקטורה

### Tech Stack
```
Frontend:  Next.js 15 + React 19
Backend:   Next.js Server Actions
Database:  PostgreSQL 15 + Prisma
Auth:      NextAuth.js
i18n:      next-intl
UI:        Material-UI (MUI)
Styling:   Monday.com Design System
```

### מבנה תיקיות
```
app/
├── [locale]/                    # תמיכה ב-i18n
│   ├── (auth)/                  # קבוצת נתיבים - התחברות
│   │   └── login/
│   └── (dashboard)/             # קבוצת נתיבים - לוח בקרה
│       ├── dashboard/
│       ├── corporations/
│       ├── users/
│       ├── sites/
│       ├── workers/
│       └── invitations/
│
├── actions/                     # Server Actions
│   ├── corporations.ts
│   ├── users.ts
│   ├── sites.ts
│   └── workers.ts
│
├── components/                  # רכיבי React
│   ├── modals/
│   ├── corporations/
│   ├── users/
│   └── NavigationClient.tsx
│
├── lib/                         # ספריות עזר
│   ├── design-system.ts         # Monday.com colors
│   ├── auth.ts                  # Auth helpers
│   └── prisma.ts
│
└── messages/                    # תרגומים
    ├── he.json                  # עברית (ראשי)
    └── en.json                  # אנגלית
```

---

## 🌍 תמיכה בינלאומית (i18n)

### שפה ראשית: עברית
```typescript
// middleware.ts
const intlMiddleware = createIntlMiddleware({
  locales: ['he', 'en'],
  defaultLocale: 'he',
  localeDetection: false,  // עברית תמיד
});
```

### תרגומים
```json
// messages/he.json
{
  "common": {
    "save": "שמור",
    "cancel": "ביטול",
    "delete": "מחק"
  },
  "navigation": {
    "dashboard": "לוח בקרה",
    "corporations": "תאגידים"
  }
}
```

### שימוש ברכיבים
```typescript
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('common');

  return <Button>{t('save')}</Button>;
}
```

---

## 🔐 אימות והרשאות

### NextAuth.js
```typescript
// auth.config.ts
export const authOptions = {
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
    }),
  ],
  session: { strategy: "jwt" },
};
```

### בדיקת הרשאות
```typescript
import { requireAuth, requireSuperAdmin } from '@/lib/auth';

// בדף Server Component
export default async function Page() {
  const user = await requireAuth();  // חייב להיות מחובר
  const admin = await requireSuperAdmin();  // חייב להיות מנהל על
}
```

### תפקידים
```typescript
enum Role {
  SUPERADMIN  // מנהל על - גישה מלאה
  MANAGER     // מנהל תאגיד
  SUPERVISOR  // רכז שכונתי
}
```

---

## 🗄️ מסד נתונים

### סכמת Prisma
```prisma
model Corporation {
  id          String   @id @default(uuid())
  name        String
  code        String   @unique
  email       String?
  phone       String?
  address     String?
  isActive    Boolean  @default(true)

  sites       Site[]
  users       User[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model User {
  id             String   @id @default(uuid())
  email          String   @unique
  name           String
  password       String
  role           Role
  corporationId  String?
  siteId         String?

  corporation    Corporation? @relation(fields: [corporationId])
  site           Site?        @relation(fields: [siteId])
}

model Site {
  id             String   @id @default(uuid())
  name           String
  code           String   @unique
  address        String?
  corporationId  String
  isActive       Boolean  @default(true)

  corporation    Corporation @relation(fields: [corporationId])
  workers        Worker[]
}

model Worker {
  id         String   @id @default(uuid())
  name       String
  position   String?
  siteId     String
  startDate  DateTime
  endDate    DateTime?
  photo      String?
  tags       String[]
  isActive   Boolean  @default(true)

  site       Site     @relation(fields: [siteId])
}
```

### Migrations
```bash
# יצירת migration חדש
npx prisma migrate dev --name description

# החלת migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

---

## 🔌 Server Actions

### דוגמת CRUD מלאה
```typescript
// app/actions/users.ts
'use server';

import { auth } from '@/auth.config';
import prisma from '@/lib/prisma';

export async function listUsers() {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };

  const users = await prisma.user.findMany({
    include: {
      corporation: true,
      site: true,
    },
  });

  return { success: true, users };
}

export async function createUser(data: CreateUserInput) {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };

  const user = await prisma.user.create({
    data: {
      ...data,
      password: await hash(data.password, 10),
    },
  });

  revalidatePath('/users');
  return { success: true, user };
}
```

### שימוש ברכיב Client
```typescript
'use client';

import { createUser } from '@/app/actions/users';

export default function UserForm() {
  const handleSubmit = async (formData) => {
    const result = await createUser(formData);
    if (result.success) {
      // הצלחה
    }
  };
}
```

---

## 🧩 רכיבים נפוצים

### NavigationClient
```typescript
// תפריט צד עם i18n
<NavigationClient
  currentLocale="he"
  role="SUPERADMIN"
/>
```

### Modal Templates
```typescript
// מודל monday.com
<Dialog
  open={open}
  onClose={onClose}
  PaperProps={{
    sx: {
      borderRadius: borderRadius.lg,
      boxShadow: shadows.large,
    },
  }}
>
  <DialogTitle>כותרת</DialogTitle>
  <DialogContent>תוכן</DialogContent>
  <DialogActions>
    <Button onClick={onClose}>ביטול</Button>
    <Button variant="contained">שמור</Button>
  </DialogActions>
</Dialog>
```

### Stat Cards
```typescript
// כרטיס KPI
<Box sx={{
  background: colors.pastel.blueLight,
  borderRadius: borderRadius.xl,
  p: 3,
}}>
  <Typography variant="h3" sx={{
    color: colors.primary.main,
    fontWeight: 700,
  }}>
    {count}
  </Typography>
  <Typography>{title}</Typography>
</Box>
```

---

## 🎨 Design System

### ייבוא והשימוש
```typescript
import { colors, shadows, borderRadius } from '@/lib/design-system';

// כפתור ראשי
<Button sx={{
  background: colors.primary.main,
  color: colors.secondary.white,
  borderRadius: borderRadius.md,
  boxShadow: shadows.soft,
  '&:hover': {
    background: colors.primary.dark,
    boxShadow: shadows.glowBlue,
  },
}} />

// צ'יפ תפקיד
<Chip
  label="מנהל"
  sx={{
    backgroundColor: `${colors.status.blue}20`,
    color: colors.status.blue,
    borderRadius: borderRadius.full,
  }}
/>
```

---

## 🚀 הרצה מקומית

### Docker Environment
```bash
# הפעלת כל השירותים
make up

# עצירת שירותים
make down

# צפייה בלוגים
make logs

# ניקוי מלא
make clean
```

### פקודות npm
```bash
# התקנת תלויות
npm install

# הרצת dev server
npm run dev

# build לייצור
npm run build

# הרצת production
npm start

# בדיקת TypeScript
npm run type-check

# פורמט קוד
npm run format
```

### משתני סביבה
```bash
# .env.local
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 🧪 בדיקות

### Playwright E2E
```bash
# הרצת בדיקות
npx playwright test

# מצב UI
npx playwright test --ui

# בדיקה ספציפית
npx playwright test users.spec.ts
```

### דוגמת בדיקה
```typescript
// tests/users.spec.ts
test('create user flow', async ({ page }) => {
  await page.goto('/users');
  await page.click('button:has-text("משתמש חדש")');
  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button:has-text("צור")');

  await expect(page.locator('table')).toContainText('Test User');
});
```

---

## 📊 מצב הפרויקט

### הושלם ✅
- [x] התקנת פרויקט (Next.js 15)
- [x] Docker environment
- [x] Prisma + PostgreSQL
- [x] NextAuth.js
- [x] Monday.com Design System
- [x] i18n (עברית + אנגלית)
- [x] דף Dashboard
- [x] דף Corporations (CRUD מלא)
- [x] דף Users (CRUD מלא)

### בתהליך 🔄
- [ ] דף Sites
- [ ] דף Workers
- [ ] מערכת הזמנות

### מתוכנן ⏸️
- [ ] אנימציות (Framer Motion)
- [ ] Toast notifications
- [ ] Mobile responsive
- [ ] Dark mode
- [ ] בדיקות יחידה
- [ ] Deployment ל-Railway

---

## 🤝 תרומה

### קוד סטנדרטים
```typescript
// שמות משתנים בעברית במסמכים
// שמות משתנים באנגלית בקוד
const userName = user.name;  // ✅
const שם_משתמש = user.name;  // ❌

// רכיבים עם TypeScript מלא
type Props = {
  name: string;
  onSubmit: (data: FormData) => void;
};

// Server Components כברירת מחדל
// Client Components רק כשצריך
'use client';  // רק אם יש useState/useEffect
```

### Git Workflow
```bash
# ענף חדש
git checkout -b feature/sites-management

# commit עם הודעה ברורה
git commit -m "feat: add sites CRUD operations"

# push ליצירת PR
git push origin feature/sites-management
```

---

## 📚 משאבים

### תיעוד רשמי
- [Next.js 15](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org)
- [next-intl](https://next-intl-docs.vercel.app)
- [MUI](https://mui.com)

### Monday.com Design
- [Vibe Design System](https://vibe.monday.com)
- [Monday.com Colors](https://mobbin.com/colors/brand/monday-com)

---

## 👨‍💻 מפתחים

**צוות הפיתוח:**
- Claude (AI Assistant)
- SuperClaude 2.0 (Architecture)

**תמיכה טכנית:**
- GitHub: [anthropics/claude-code](https://github.com/anthropics/claude-code)

---

**עודכן לאחרונה:** 2025-11-28
**גרסה:** 1.0.0-MVP
**רישיון:** MIT
