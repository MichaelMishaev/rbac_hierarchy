# מדריך אתחול מערכת - Customer Onboarding Guide
## Election Campaign Management System

---

## 📋 תוכן עניינים

1. [מה מקבל הלקוח בהתקנה ראשונית?](#initial-state)
2. [תהליך אתחול שלב אחר שלב](#step-by-step)
3. [מסלולי אתחול לפי גודל ארגון](#onboarding-paths)
4. [שלבים קריטיים והמלצות](#critical-steps)
5. [בדיקות אבטחה ואיכות](#security-checks)
6. [נספח: פקודות מערכת](#system-commands)

---

## 🎁 מה מקבל הלקוח בהתקנה ראשונית? {#initial-state}

### ✅ נתונים ראשוניים (Demo Data)

כאשר הלקוח מתקין את המערכת ומריץ את הסקריפט `npm run db:seed`, המערכת יוצרת:

#### 👤 משתמש מנהל על (SuperAdmin)
- **אימייל**: `admin@election.test`
- **סיסמה**: `admin123`
- **תפקיד**: מנהל על (SUPERADMIN)
- **הרשאות**: גישה מלאה לכל המערכת
- ⚠️ **קריטי**: זהו המשתמש היחיד שיכול ליצור מנהלי אזור וערים חדשות!

#### 🗺️ 6 מנהלי אזור (Area Managers) - כל המחוזות בישראל
1. **מחוז תל אביב** - sarah.cohen@telaviv-district.test / area123
2. **מחוז הצפון** - manager@north-district.test / area123
3. **מחוז חיפה** - manager@haifa-district.test / area123
4. **מחוז המרכז** - manager@center-district.test / area123
5. **מחוז ירושלים** - manager@jerusalem-district.test / area123
6. **מחוז הדרום** - manager@south-district.test / area123

#### 🏙️ 2 ערים לדוגמה (Sample Cities)
1. **תל אביב-יפו** (שייכת למחוז תל אביב)
   - רכז עיר: david.levi@telaviv.test / manager123
   - 3 שכונות: פלורנטין, נווה צדק, יפו העתיקה
   - 2 רכזי פעילים
   - 28 פעילים לדוגמה

2. **רמת גן** (שייכת למחוז תל אביב)
   - רכז עיר: moshe.israeli@ramatgan.test / manager123
   - שכונה אחת: מרכז העיר
   - רכז פעילים אחד
   - 5 פעילים לדוגמה

### 📊 סיכום: מה יש במערכת אחרי ההתקנה?

```
✅ 1 SuperAdmin
✅ 6 Area Managers (כל המחוזות)
✅ 2 Cities (תל אביב-יפו, רמת גן)
✅ 4 Neighborhoods (3 בתל אביב, 1 ברמת גן)
✅ 2 City Coordinators
✅ 3 Activist Coordinators
✅ 33 Activists (נתוני דמו)
```

---

## 🚀 תהליך אתחול שלב אחר שלב {#step-by-step}

### שלב 0: הכנות לפני האתחול

#### ✅ דרישות טרום-הפעלה
1. **התקנת Docker** - וודא ש-Docker Desktop מותקן ופועל
2. **התקנת Node.js** - גרסה 20 ומעלה
3. **התקנת המערכת**:
   ```bash
   # מנהל מערכת מריץ:
   cd /path/to/corporations/app
   npm install
   make up              # הפעלת Docker services
   npm run db:push      # יצירת טבלאות מסד נתונים
   npm run db:seed      # יצירת נתוני דמו
   npm run dev          # הפעלת שרת פיתוח
   ```

4. **גישה ראשונה**:
   - פתח דפדפן: `http://localhost:3200`
   - התחבר כ-SuperAdmin: `admin@election.test` / `admin123`

---

### שלב 1: החלפת משתמש SuperAdmin (קריטי!)

⚠️ **אבטחה קריטית**: לפני כל דבר, יש להחליף את משתמש הדמו!

#### אופציה A: דרך Prisma Studio (מומלץ למפתחים)
```bash
cd app
npm run db:studio
# פתח טבלת users
# מצא את המשתמש admin@election.test
# ערוך:
# - email: השתמש באימייל אמיתי של מנהל הארגון
# - fullName: שם מלא אמיתי
# - phone: טלפון אמיתי
# - passwordHash: יצירת hash חדש (ראה הוראות למטה)
```

#### אופציה B: דרך סקריפט (מומלץ לפרודקשן)
```bash
# צור סקריפט: app/scripts/update-superadmin.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateSuperAdmin() {
  const newPassword = 'YOUR_SECURE_PASSWORD_HERE'; // החלף!
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email: 'admin@election.test' },
    data: {
      email: 'real.admin@yourcampaign.com',      // החלף!
      fullName: 'שם מנהל אמיתי',                  // החלף!
      phone: '+972-XX-XXX-XXXX',                  // החלף!
      passwordHash: hashedPassword,
    },
  });

  console.log('✅ SuperAdmin updated successfully!');
}

updateSuperAdmin()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
```

```bash
# הרץ את הסקריפט:
npx tsx app/scripts/update-superadmin.ts
```

#### ✅ בדיקת תקינות
- התנתק מהמערכת
- התחבר עם האימייל והסיסמה החדשים
- ודא שאתה רואה את לוח הבקרה של SuperAdmin

---

### שלב 2: החלטת ארכיטקטורה - איזה מחוזות צריך?

הלקוח צריך להחליט:

#### אופציה 1: שימוש במחוזות קיימים (מומלץ לישראל)
המערכת כבר כוללת את 6 המחוזות הרשמיים:
- מחוז תל אביב
- מחוז הצפון
- מחוז חיפה
- מחוז המרכז
- מחוז ירושלים
- מחוז הדרום

**פעולות נדרשות**:
1. עבור על כל מנהל אזור (Area Manager)
2. החלף את האימייל והפרטים האישיים לאנשים אמיתיים
3. או: מחק מנהלי אזור שלא צריך (אם הקמפיין לא פועל בכל המחוזות)

#### אופציה 2: מחיקת הכל והתחלה מחדש (ארגונים קטנים)
אם הארגון לא צריך מבנה מחוזי:
```sql
-- מחק את כל נתוני הדמו (זהיר!)
-- דרך Prisma Studio או SQL
DELETE FROM activists;
DELETE FROM activist_coordinator_neighborhoods;
DELETE FROM activist_coordinators;
DELETE FROM city_coordinators;
DELETE FROM neighborhoods;
DELETE FROM cities;
DELETE FROM area_managers WHERE userId != (SELECT id FROM users WHERE isSuperAdmin = true);
```

⚠️ **זהירות**: פעולה זו תמחק את כל נתוני הדמו! עשה backup לפני!

---

### שלב 3: יצירת מנהלי אזור (אם נדרש)

אם אתה רוצה ליצור מנהל אזור חדש:

#### דרך ממשק המשתמש (UI)
1. התחבר כ-SuperAdmin
2. עבור ל: **ניהול → מחוזות**
3. לחץ: **+ מנהל אזור חדש**
4. מלא פרטים:
   - **שם מלא**: שם האדם האחראי
   - **אימייל**: אימייל ייחודי למנהל
   - **טלפון**: מספר טלפון
   - **שם מחוז**: למשל "מחוז צפון-מערב"
   - **קוד מחוז**: למשל "NW-DISTRICT"
5. **שמור**

המערכת תיצר:
- משתמש חדש עם תפקיד `AREA_MANAGER`
- רשומת `area_manager` מקושרת למשתמש
- תישלח הזמנה באימייל (אם SMTP מוגדר)

#### דרך Prisma Studio (פיתוח)
```bash
npm run db:studio
# 1. צור משתמש בטבלת users (role: AREA_MANAGER)
# 2. צור רשומה בטבלת area_managers עם userId של המשתמש שיצרת
```

---

### שלב 4: יצירת ערים

לאחר שיש מנהלי אזור, צור ערים:

#### מי יכול ליצור עיר?
- ✅ SuperAdmin
- ✅ Area Manager (רק בתוך המחוז שלו)

#### דרך ממשק המשתמש
1. התחבר כ-SuperAdmin או Area Manager
2. עבור ל: **ניהול → ערים**
3. לחץ: **+ עיר חדשה**
4. מלא פרטים:
   - **שם עיר**: למשל "חיפה"
   - **קוד עיר**: למשל "HAIFA"
   - **תיאור**: "קמפיין בחירות חיפה"
   - **מנהל אזור**: בחר מהרשימה (רק אם אתה SuperAdmin)
5. **שמור**

#### ✅ בדיקת תקינות
- עבור ללוח הבקרה
- ודא שהעיר מופיעה ברשימת הערים
- ודא ש-Area Manager רואה את העיר במחוז שלו

---

### שלב 5: יצירת רכזי עיר (City Coordinators)

לכל עיר צריך רכז עיר אחד לפחות:

#### מי יכול ליצור רכז עיר?
- ✅ SuperAdmin
- ✅ Area Manager (רק לערים במחוז שלו)

#### דרך ממשק המשתמש
1. התחבר כ-SuperAdmin או Area Manager
2. עבור ל: **ניהול → משתמשים**
3. לחץ: **+ משתמש חדש**
4. מלא פרטים:
   - **שם מלא**: שם רכז העיר
   - **אימייל**: אימייל ייחודי
   - **טלפון**: מספר טלפון
   - **תפקיד**: בחר "רכז עיר" (City Coordinator)
   - **עיר**: בחר את העיר שבה הוא יעבוד
   - **כותרת**: למשל "מנהל קמפיין חיפה"
5. **שמור**

#### ✅ בדיקת תקינות
- רכז העיר צריך לקבל אימייל הזמנה
- לאחר ההתחברות, הוא רואה רק את העיר שלו
- הוא לא רואה ערים אחרות (בידוד!)

---

### שלב 6: יצירת שכונות (Neighborhoods)

כל עיר מחולקת לשכונות (districts/precincts):

#### מי יכול ליצור שכונה?
- ✅ SuperAdmin
- ✅ Area Manager (בערים במחוז שלו)
- ✅ City Coordinator (רק בעיר שלו)

#### דרך ממשק המשתמש
1. התחבר כ-City Coordinator (או SuperAdmin/Area Manager)
2. עבור ל: **ניהול → שכונות**
3. לחץ: **+ שכונה חדשה**
4. מלא פרטים:
   - **שם שכונה**: למשל "הדר"
   - **כתובת**: "רחוב הרצל 1, חיפה"
   - **עיר**: חיפה (מתמלא אוטומטית לפי תפקיד)
   - **מיקום GPS**: (אופציונלי) Latitude/Longitude
   - **טלפון/אימייל**: פרטי קשר של מטה השכונה
   - **מטא-דאטה** (אופציונלי):
     - אוכלוסייה
     - מספר בוחרים משוער
     - שטח כיסוי
5. **שמור**

#### 💡 המלצה: תכנון שכונות
- חלק את העיר לפי אזורים גיאוגרפיים ברורים
- כל שכונה צריכה להיות בגודל ניהולי (3,000-15,000 תושבים)
- שקול שכונות לפי קלפיות בחירות

---

### שלב 7: יצירת רכזי פעילים (Activist Coordinators)

אנשי קשר בשטח שמנהלים פעילים בשכונות:

#### מי יכול ליצור רכז פעילים?
- ✅ SuperAdmin
- ✅ Area Manager (בערים במחוז שלו)
- ✅ City Coordinator (רק בעיר שלו)

#### דרך ממשק המשתמש
1. התחבר כ-City Coordinator (או SuperAdmin/Area Manager)
2. עבור ל: **ניהול → משתמשים**
3. לחץ: **+ משתמש חדש**
4. מלא פרטים:
   - **שם מלא**: שם רכז הפעילים
   - **אימייל**: אימייל ייחודי
   - **טלפון**: מספר טלפון
   - **תפקיד**: בחר "רכז פעילים" (Activist Coordinator)
   - **עיר**: בחר עיר (מתמלא אוטומטית לפי תפקיד)
   - **שכונות מוקצות**: בחר אחת או יותר שכונות
   - **כותרת**: למשל "רכז שכונת הדר"
5. **שמור**

#### ⚠️ חשוב: הקצאת שכונות
- רכז פעילים חייב להיות מוקצה לפחות לשכונה אחת
- הוא יכול לנהל מספר שכונות
- הוא רואה **רק** פעילים בשכונות המוקצות לו (בידוד!)

---

### שלב 8: גיוס פעילים (Activists)

פעילי השטח - אנשים שאינם משתמשי מערכת:

#### מי יכול ליצור פעיל?
- ✅ SuperAdmin
- ✅ Area Manager (בערים במחוז שלו)
- ✅ City Coordinator (בעיר שלו)
- ✅ Activist Coordinator (רק בשכונות המוקצות לו)

#### דרך ממשק המשתמש
1. התחבר כ-Activist Coordinator (או City Coordinator)
2. עבור ל: **ניהול → פעילים**
3. לחץ: **+ פעיל חדש**
4. מלא פרטים:
   - **שם מלא**: שם הפעיל
   - **טלפון**: מספר טלפון (חובה)
   - **אימייל**: אימייל (אופציונלי)
   - **שכונה**: בחר שכונה (מוגבל לשכונות המוקצות)
   - **תפקיד**: למשל "דלת לדלת", "טלפנות", "תיאום אירועים"
   - **תאריך התחלה**: מתי הצטרף לקמפיין
   - **תגיות**: למשל "מתנדב", "ותיק", "סוף שבוע"
5. **שמור**

#### 💡 טיפים לניהול פעילים
- השתמש בתגיות לקטגוריזציה (שפות, זמינות, כישורים)
- עדכן metadata עם מידע רלוונטי (שעות נדבות, משימות שהושלמו)
- שמור על רשומות פעילים מעודכנות (טלפון, זמינות)

---

## 🎯 מסלולי אתחול לפי גודל ארגון {#onboarding-paths}

### מסלול 1: קמפיין קטן (עיר אחת, 50-200 פעילים)

**מבנה מומלץ**:
```
SuperAdmin
└── City Coordinator (בלי Area Manager)
    └── 3-5 Activist Coordinators
        └── 10-40 Activists per coordinator
```

**שלבי אתחול**:
1. ✅ עדכן SuperAdmin
2. ❌ מחק את כל ה-Area Managers (לא צריך)
3. ✅ צור עיר אחת (בלי קישור ל-Area Manager)
4. ✅ צור City Coordinator אחד
5. ✅ צור 3-5 שכונות
6. ✅ צור 3-5 Activist Coordinators
7. ✅ הקצה שכונות לכל רכז
8. ✅ גייס פעילים

**זמן אתחול**: 2-4 שעות

---

### מסלול 2: קמפיין בינוני (2-5 ערים, 200-1000 פעילים)

**מבנה מומלץ**:
```
SuperAdmin
└── 1 Area Manager
    └── 2-5 Cities
        └── 1 City Coordinator per city
            └── 3-8 Activist Coordinators per city
                └── 10-30 Activists per coordinator
```

**שלבי אתחול**:
1. ✅ עדכן SuperAdmin
2. ✅ עדכן 1 Area Manager (מחק את השאר)
3. ✅ צור 2-5 ערים
4. ✅ צור City Coordinator לכל עיר
5. ✅ צור 5-15 שכונות לכל עיר
6. ✅ צור Activist Coordinators
7. ✅ הקצה שכונות
8. ✅ גייס פעילים

**זמן אתחול**: 1-2 ימים

---

### מסלול 3: קמפיין ארצי (6+ ערים, 1000+ פעילים)

**מבנה מומלץ**:
```
SuperAdmin
└── 6 Area Managers (כל המחוזות)
    └── 1-10 Cities per district
        └── 1-2 City Coordinators per city
            └── 5-20 Activist Coordinators per city
                └── 10-50 Activists per coordinator
```

**שלבי אתחול**:
1. ✅ עדכן SuperAdmin
2. ✅ עדכן 6 Area Managers (כל המחוזות)
3. ✅ צור ערים במחוזות
4. ✅ צור City Coordinators
5. ✅ צור שכונות
6. ✅ צור Activist Coordinators
7. ✅ הקצה שכונות
8. ✅ גייס פעילים (בשלבים)

**זמן אתחול**: 1-2 שבועות (בשלבים)

---

## ⚠️ שלבים קריטיים והמלצות {#critical-steps}

### 🔐 אבטחה

#### 1. החלפת סיסמאות ברירת מחדל
```bash
# ❌ לעולם אל תשאיר:
admin@election.test / admin123
area123
manager123
supervisor123

# ✅ החלף מיד לאחר התקנה:
real.admin@campaign.com / StrongPassword123!@#
```

#### 2. הגדרת SMTP אמיתי
```env
# .env.local
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-campaign@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourcampaign.com
```

#### 3. הפעלת HTTPS בפרודקשן
- השתמש ב-Railway או Vercel עם SSL אוטומטי
- אל תחשוף את המערכת ב-HTTP בפרודקשן!

---

### 📊 ניהול נתונים

#### 1. גיבוי קבוע
```bash
# הרץ כל יום בפרודקשן:
make db-backup

# שמור גיבויים ב-S3 או Google Cloud Storage
```

#### 2. בדיקת תקינות נתונים
```bash
# לאחר כל שינוי גדול:
npm run db:check-integrity

# אם יש בעיות:
npm run db:fix-integrity
```

#### 3. ניקוי נתוני דמו לפני פרודקשן
```bash
# צור סקריפט ייעודי:
npm run cleanup:demo-data
```

---

### 👥 ניהול משתמשים

#### 1. הזמנות במקום יצירה ידנית
- השתמש במערכת ההזמנות (Invitations)
- זה יוצר משתמשים עם סיסמאות מאובטחות
- שולח אימייל הזמנה אוטומטי

#### 2. אל תיצור SuperAdmin דרך UI
- רק דרך `seed.ts` או Prisma Studio
- מנע יצירה בטעות של מנהלי על נוספים

#### 3. בדוק בידוד נתונים
- City Coordinator רואה רק את העיר שלו
- Activist Coordinator רואה רק את השכונות המוקצות לו
- אין דליפת נתונים בין ערים!

---

## ✅ בדיקות אבטחה ואיכות {#security-checks}

### Checklist לפני עליה לפרודקשן

```markdown
### אבטחה
- [ ] החלפת כל סיסמאות ברירת המחדל
- [ ] הגדרת SMTP אמיתי
- [ ] HTTPS מופעל
- [ ] משתני סביבה (.env) לא בגרסה שליטה
- [ ] רק SuperAdmin אמיתי במערכת (לא demo users)

### נתונים
- [ ] נתוני דמו נמחקו (אם לא צריך)
- [ ] גיבוי ראשוני בוצע
- [ ] בדיקת תקינות עברה: npm run db:check-integrity
- [ ] Area Managers מעודכנים בפרטים אמיתיים
- [ ] ערים וערים נוצרו לפי תכנון

### גישה
- [ ] בדיקת בידוד: City Coordinator לא רואה ערים אחרות
- [ ] בדיקת בידוד: Activist Coordinator לא רואה שכונות שלא הוקצו לו
- [ ] כל המשתמשים קיבלו הזמנות ונכנסו למערכת
- [ ] אין משתמשים עם `is_active = false` ללא סיבה

### פונקציונליות
- [ ] ניהול משימות עובד
- [ ] נוכחות פעילים עובדת
- [ ] מפה מציגה שכונות נכון
- [ ] דוחות מציגים נתונים נכונים
- [ ] התראות Push עובדות (אם מופעל)

### ביצועים
- [ ] כל העמודים נטענים מתחת ל-2 שניות
- [ ] חיפוש פעילים מהיר (גם עם 1000+ רשומות)
- [ ] מסד הנתונים מאופטם (indexes)
```

---

## 📚 נספח: פקודות מערכת {#system-commands}

### הפעלת המערכת
```bash
cd app
npm run dev                 # פיתוח (port 3200)
npm run build              # בניית production
npm run start              # הפעלת production
```

### מסד נתונים
```bash
npm run db:generate        # יצירת Prisma Client
npm run db:push            # דחיפת schema לDB
npm run db:seed            # טעינת נתוני דמו
npm run db:studio          # ממשק גרפי לDB
npm run db:check-integrity # בדיקת תקינות
npm run db:fix-integrity   # תיקון בעיות
```

### Docker Services
```bash
make up                    # הפעלת כל השירותים
make down                  # כיבוי שירותים
make clean                 # מחיקת volumes (זהיר!)
make health                # בדיקת תקינות
make logs                  # צפייה ב-logs
make db-backup             # גיבוי DB
```

### בדיקות
```bash
npm run test:e2e           # Playwright E2E tests
npm run test:e2e:ui        # UI mode
npm run test:e2e:headed    # ראיית הדפדפן
```

---

## 📞 תמיכה ועזרה

### בעיות נפוצות

**1. "Cannot connect to database"**
```bash
# וודא ש-Docker רץ:
docker ps
# אם לא רץ:
make up
```

**2. "Prisma Client not found"**
```bash
npm run db:generate
```

**3. "Port 3200 already in use"**
```bash
# הרוג תהליכים:
lsof -ti:3200 | xargs kill -9
```

**4. "SMTP error when sending invitations"**
- וודא ש-.env.local מוגדר נכון
- בפיתוח: השתמש ב-MailHog (http://localhost:8025)

---

## 🎓 משאבים נוספים

- **מסמך PRD**: `docs/syAnalyse/PRD_2025_Updated_Industry_Standards.md`
- **סכמת מסד נתונים**: `docs/syAnalyse/mvp/02_DATABASE_SCHEMA.md`
- **מפרט UI**: `docs/syAnalyse/mvp/04_UI_SPECIFICATIONS.md`
- **Docker Guide**: `docs/syAnalyse/mvp/08_DOCKER_DEVELOPMENT.md`
- **כללי מערכת**: http://localhost:3200/system-rules

---

## ✨ סיכום

### מסלול מהיר (TL;DR):
1. התקן → `npm install && make up && npm run db:push && npm run db:seed`
2. החלף SuperAdmin → Prisma Studio או סקריפט
3. החלט: כמה מחוזות? כמה ערים?
4. צור מבנה היררכי: Area Managers → Cities → Coordinators → Neighborhoods → Activists
5. בדוק בידוד נתונים
6. גבה והעלה לפרודקשן

**זמן אתחול טיפוסי**:
- קמפיין קטן (עיר אחת): **2-4 שעות**
- קמפיין בינוני (2-5 ערים): **1-2 ימים**
- קמפיין ארצי (6+ ערים): **1-2 שבועות**

---

**מסמך זה עודכן לאחרונה**: 2025-12-14
**גרסת מערכת**: 2.0 (Election Campaign System)
