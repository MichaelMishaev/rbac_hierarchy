import React from 'react';
import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import { getLocale } from 'next-intl/server';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PublicIcon from '@mui/icons-material/Public';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PeopleIcon from '@mui/icons-material/People';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import GroupsIcon from '@mui/icons-material/Groups';
import WarningIcon from '@mui/icons-material/Warning';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Link from 'next/link';
import SecurityIcon from '@mui/icons-material/Security';
import InfoIcon from '@mui/icons-material/Info';
import TranslateIcon from '@mui/icons-material/Translate';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LockIcon from '@mui/icons-material/Lock';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import TrafficIcon from '@mui/icons-material/Traffic';
import EventIcon from '@mui/icons-material/Event';
import StorageIcon from '@mui/icons-material/Storage';
import SystemRulesClient from '@/app/components/system-rules/SystemRulesClient';
import type { ArchitectureConcept } from '@/app/components/system-rules/ArchitectureCard';

export default async function SystemRulesPage() {
  const session = await auth();
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // Only SuperAdmin can access this page
  if (session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard');
  }

  // Setup steps with actual links
  const setupSteps = [
    {
      order: 1,
      title: '🔐 צור מנהלי אזור (Area Managers)',
      description: 'מנהלי אזור מנהלים מספר ערים באזור גיאוגרפי',
      icon: <PublicIcon />,
      color: colors.pastel.orange,
      link: '/areas',
      linkText: '➤ עבור לדף מנהלי אזור',
      steps: [
        'לחץ על כפתור "+ מנהל אזור חדש"',
        'בחר משתמש קיים או צור משתמש חדש',
        'הזן שם אזור (לדוגמה: "מחוז המרכז", "מחוז הצפון")',
        'הזן קוד אזור (לדוגמה: "CENTER", "NORTH")',
        'שמור ולחץ "צור מנהל אזור"',
      ],
      tip: 'קמפיין קטן? אתה יכול לדלג על שלב זה ולנהל ישירות ערים כ-SuperAdmin',
    },
    {
      order: 2,
      title: '🏙️ צור ערים',
      description: 'כל עיר היא יחידה ארגונית עצמאית בקמפיין',
      icon: <LocationCityIcon />,
      color: colors.pastel.blue,
      link: '/cities',
      linkText: '➤ עבור לדף ערים',
      steps: [
        'לחץ על כפתור "+ עיר חדשה"',
        'הזן שם עיר (לדוגמה: "תל אביב-יפו", "ירושלים")',
        'הזן קוד עיר (לדוגמה: "TLV", "JRS")',
        'בחר מנהל אזור (אם יש) או השאר ריק',
        'הוסף תיאור אופציונלי',
        'שמור ולחץ "צור עיר"',
      ],
      tip: 'התחל עם 1-2 ערים כדי לבדוק את המערכת לפני הוספת יותר',
    },
    {
      order: 3,
      title: '👤 צור רכזי עיר (City Coordinators)',
      description: 'רכז עיר מנהל את כל הפעילות של עיר אחת',
      icon: <PeopleIcon />,
      color: colors.pastel.blue,
      link: '/users',
      linkText: '➤ עבור לדף משתמשים',
      steps: [
        'לחץ על כפתור "+ משתמש חדש"',
        'בחר תפקיד: "רכז עיר" (City Coordinator)',
        'הזן פרטי משתמש: שם מלא, אימייל, טלפון',
        'בחר עיר שהרכז ינהל',
        'הגדר סיסמה זמנית (המשתמש יוכל לשנות אותה)',
        'שמור ולחץ "צור משתמש"',
      ],
      tip: 'כל עיר צריכה לפחות רכז עיר אחד. ערים גדולות יכולות לקבל מספר רכזים',
    },
    {
      order: 4,
      title: '🏘️ צור שכונות',
      description: 'שכונות הן מחוזות הקמפיין - אזורים גיאוגרפיים בתוך עיר',
      icon: <HomeWorkIcon />,
      color: colors.status.lightGreen,
      link: '/neighborhoods',
      linkText: '➤ עבור לדף שכונות',
      steps: [
        'לחץ על כפתור "+ שכונה חדשה"',
        'הזן שם שכונה (לדוגמה: "פלורנטין", "נווה צדק")',
        'בחר עיר',
        'הוסף כתובת מרכזית (אופציונלי)',
        'הוסף קואורדינטות GPS (אופציונלי - למפה)',
        'שמור ולחץ "צור שכונה"',
      ],
      tip: 'המלצה: 3-15 שכונות לכל עיר, תלוי בגודל העיר ומבנה הקלפיות',
    },
    {
      order: 5,
      title: '👥 צור רכזי שכונות (Activist Coordinators)',
      description: 'רכז שכונתי מארגן פעילים ב-1 עד 5 שכונות',
      icon: <GroupsIcon />,
      color: colors.pastel.green,
      link: '/users',
      linkText: '➤ עבור לדף משתמשים',
      steps: [
        'לחץ על כפתור "+ משתמש חדש"',
        'בחר תפקיד: "רכז שכונתי" (Activist Coordinator)',
        'הזן פרטי משתמש: שם מלא, אימייל, טלפון',
        'בחר עיר',
        'הקצה 1-5 שכונות שהרכז ינהל',
        'הגדר סיסמה זמנית',
        'שמור ולחץ "צור משתמש"',
      ],
      tip: 'רכז שכונתי טוב יכול לנהל 30-50 פעילים. תכנן בהתאם',
    },
    {
      order: 6,
      title: '🎯 גייס פעילים (Activists)',
      description: 'פעילי שטח - מתנדבים בשטח שעושים את העבודה',
      icon: <GroupsIcon />,
      color: colors.neutral[500],
      link: '/activists',
      linkText: '➤ עבור לדף פעילים',
      steps: [
        'לחץ על כפתור "+ פעיל חדש"',
        'הזן שם מלא',
        'הזן מספר טלפון (חובה לתקשורת)',
        'בחר שכונה שבה הפעיל פעיל',
        'הוסף תפקיד (לדוגמה: "מאבטח קלפי", "מפיץ עלונים")',
        'הוסף תגיות לקטגוריזציה',
        'שמור ולחץ "צור פעיל"',
      ],
      tip: 'התחל עם 5-10 פעילים לשכונה כדי לבדוק את התהליך',
    },
  ];

  // Architecture concepts
  const architectureConcepts: ArchitectureConcept[] = [
    {
      id: 'hebrew-only',
      order: 1,
      title: 'מערכת עברית בלבד',
      icon: 'TranslateIcon',
      color: colors.pastel.blue,
      realWorldExample: `דמיין שאתה פותח קמפיין בחו"ל ומנסה לתפעל אותו באנגלית. הפעילים שלך מדברים עברית, אבל המערכת מציגה להם טקסטים באנגלית. זה יוצר בלבול, טעויות ואיבוד זמן יקר.

המערכת שלנו נבנתה **רק בעברית** כי כל הפעילים, הרכזים והמנהלים מדברים עברית. אין תמיכה בשפות נוספות כי זה מיותר ומסרבל.`,
      whySuperAdminCares: [
        'פעילי שטח עובדים בטלפונים ניידים תוך כדי תנועה - אין להם זמן לתרגם',
        'טעויות תרגום יכולות לגרום לבעיות תפעוליות בקמפיין',
        'פשטות = יעילות בעונת בחירות',
      ],
      technicalTranslation: `• כל ה-UI מוגדר עם \`dir="rtl"\` ו-\`lang="he"\`
• לוקאל ברירת מחדל: \`he-IL\`, אזור זמן: \`Asia/Jerusalem\`
• אין fallback לאנגלית - רק עברית
• שימוש ב-\`marginInlineStart/End\` במקום \`left/right\`
• CSS: כל הרווחים והמרווחים לוגיים (not directional)`,
      keywords: ['עברית', 'RTL', 'ימין לשמאל', 'שפה', 'תרגום', 'לוקאל'],
    },
    {
      id: 'rbac',
      order: 2,
      title: 'בקרת גישה מבוססת תפקידים (RBAC)',
      icon: 'VpnKeyIcon',
      color: colors.pastel.green,
      realWorldExample: `דמיין בניין משרדים גדול. יש מפתחות שונים לכל קומה:

• רכז שכונה מקבל מפתח רק לשכונות שלו (קומה 3)
• רכז עיר מקבל מפתח לכל העיר (קומות 1-10)
• אתה כמנהל על מקבל מפתח ראשי לכל הבניין

**RBAC** זה המנגנון שמוודא שכל אחד רואה רק את מה שהוא צריך לראות.`,
      whySuperAdminCares: [
        'רכז עיר בתל אביב לא צריך (ולא יכול) לראות נתוני ירושלים',
        'מניעת דליפת מידע בין קמפיינים במספר ערים',
        'שמירה על סודיות אסטרטגית של הקמפיין',
        'בקרת נזקים: אם מישהו טועה, הוא לא יכול לפגוע בעיר אחרת',
      ],
      technicalTranslation: `• 4 רמות תפקידים: **SuperAdmin** → **Area Manager** → **City Coordinator** → **Activist Coordinator**
• כל שאילתה מסוננת לפי \`city_id\` / \`area\` (למעט SuperAdmin)
• רכז שכונה מוגבל לשכונות שהוקצו לו בטבלת M2M (\`activist_coordinator_neighborhoods\`)
• \`UNIQUE\` constraints מונעים כפילויות: \`(city_id, user_id)\` לרכזי עיר
• Prisma middleware מכניס סינונים אוטומטית בכל query`,
      keywords: ['הרשאות', 'גישה', 'תפקידים', 'אבטחה', 'פרטיות', 'סינון', 'RBAC'],
    },
    {
      id: 'data-isolation',
      order: 3,
      title: 'בידוד נתונים (Data Isolation)',
      icon: 'LockIcon',
      color: colors.pastel.orange,
      realWorldExample: `דמיין שיש לך קמפיינים בתל אביב, ירושלים וחיפה. כל עיר זה כמו כספת נפרדת:

• רכז תל אביב לא יכול לפתוח את הכספת של ירושלים
• גם אם הוא ינסה, המערכת תחסום אותו
• רק אתה (SuperAdmin) מחזיק מפתח לכל הכספות

**בידוד נתונים** מבטיח שכל מה שקורה בעיר אחת נשאר בעיר הזאת, אלא אם אתה מחליט אחרת.`,
      whySuperAdminCares: [
        'אי אפשר לטעות ולמחוק פעילים בעיר הלא נכונה',
        'כל עיר יכולה לנהל את הקמפיין שלה בצורה עצמאית',
        'אם יש דליפת מידע, היא מוגבלת לעיר אחת בלבד',
        'בדיקות איכות: קל לזהות פעילות חריגה בעיר ספציפית',
      ],
      technicalTranslation: `• רכז עיר: \`WHERE neighborhood.cityId = session.user.cityId\`
• רכז אזור: \`WHERE city.areaManagerId = areaManager.id\`
• רכז שכונה: \`WHERE neighborhood_id IN assignedNeighborhoods\`
• SuperAdmin: ללא סינון (גישה מלאה לכל הנתונים)
• E2E tests: \`city-isolation.spec.ts\`, \`area-isolation.spec.ts\``,
      keywords: ['אבטחה', 'הפרדה', 'סינון', 'עיר', 'שכונה', 'נתונים', 'בידוד'],
    },
    {
      id: 'organizational-hierarchy',
      order: 4,
      title: 'היררכיה ארגונית (Organizational Hierarchy)',
      icon: 'AccountTreeIcon',
      color: colors.pastel.purple,
      realWorldExample: `דמיין צבא קטן עם שרשרת פיקוד ברורה:

1. **מפקד על** (אתה - SuperAdmin) - רואה את כולם
2. **מפקדי גזרות** (Area Managers) - רואים מספר ערים
3. **מפקדי עיר** (City Coordinators) - רואים עיר אחת
4. **מפקדי פלוגה** (Activist Coordinators) - רואים 1-5 שכונות
5. **חיילי שטח** (Activists) - לא נכנסים למערכת

כל אחד רואה רק את מי שנמצא "מתחתיו" במבנה.`,
      whySuperAdminCares: [
        'מבנה ברור = אחריות ברורה (לא מתעורבבים תפקידים)',
        'קל לעקוב אחרי מי אחראי על מה',
        'אפשר להסמיך מנהלים ברמות שונות בלי לאבד שליטה',
        'סקלביליות: קל להוסיף ערים/אזורים חדשים',
      ],
      technicalTranslation: `SuperAdmin (\`is_super_admin = true\`)
  ↓ creates
Area Manager (\`area_managers\` table)
  ↓ manages
Cities (\`cities\` table)
  ↓ contains
City Coordinator (\`city_coordinators\` table) + Neighborhoods
  ↓ manages
Activist Coordinator (\`activist_coordinators\` table) + M2M assignments
  ↓ organizes
Activists (\`activists\` table)

• Referential integrity: Foreign keys cascade deletes
• Soft deletes for activists: \`is_active = false\`
• Orphaned entities: Script to detect & report`,
      keywords: ['מבנה', 'היררכיה', 'ניהול', 'תפקידים', 'שרשרת פיקוד', 'ארגון'],
    },
    {
      id: 'mobile-first',
      order: 5,
      title: 'עיצוב Mobile-First',
      icon: 'PhoneAndroidIcon',
      color: colors.pastel.teal,
      realWorldExample: `דמיין רכז שטח שעומד ליד קלפי בשעה 18:00 ביום הבחירות:

• יש לו טלפון בכיס, לא מחשב נייד
• הוא צריך לרשום נוכחות של 10 פעילים תוך דקה
• המסך קטן (5.5 אינץ'), האור חלש, והוא עומד בתנועה
• אין זמן לגלילה או לחיפוש - צריך כפתורים גדולים ופשוטים

המערכת נבנתה **קודם לטלפון, אחר כך למחשב** - כי ככה עובדים בשטח.`,
      whySuperAdminCares: [
        'פעילים עובדים בתנועה, לא בשולחן עבודה',
        'מסך קטן = צריך UI ממוקד ופשוט (לא 20 שדות בטופס)',
        'טפסים ארוכים לא עובדים בטלפון (אנשים מוותרים)',
        'GPS integration: נוכחות עם מיקום - עובד רק במובייל',
      ],
      technicalTranslation: `• Viewport minimum: \`320px\` (iPhone SE - המכשיר הכי קטן)
• Touch targets: \`44x44px\` minimum (Apple HIG standard)
• Forms: Multi-step wizards instead of long scrolls
• Tables: Collapsible columns on mobile (TanStack Table)
• GPS integration: \`navigator.geolocation\` API
• PWA: Service worker for offline attendance recording
• Responsive breakpoints: \`xs (320px)\`, \`sm (600px)\`, \`md (900px)\``,
      keywords: ['מובייל', 'טלפון', 'נייד', 'שטח', 'פעילים', 'נוחות', 'responsive'],
    },
    {
      id: 'risk-levels',
      order: 6,
      title: 'רמות סיכון (Risk Levels)',
      icon: 'TrafficIcon',
      color: colors.status.orange,
      realWorldExample: `דמיין שאתה מנהל קמפיין 3 ימים לפני הבחירות:

**🔹 סיכון נמוך:** שינוי צבע של כפתור
  → תוצאה: אף אחד לא שם לב, אין בעיה

**🔸 סיכון בינוני:** הוספת שדה חדש לטופס משימות
  → תוצאה: צריך לעדכן את הרכזים, אבל לא קריטי

**🔴 סיכון גבוה:** שינוי של מי יכול לראות נתוני בוחרים
  → תוצאה: אם משהו נשבר, דליפת מידע רגישה!

המערכת מסווגת כל שינוי לפי רמת הסיכון כדי שתדע מתי לבדוק פעמיים.`,
      whySuperAdminCares: [
        'לדעת מתי אפשר לאשר שינוי מהר ומתי צריך לבדוק בזהירות',
        'הבנה של מה יכול "לשבור" את המערכת',
        'תכנון שינויים בעונת בחירות: פחות RBAC, יותר UI',
        'בקרת איכות: שינויי 🔴 דורשים בדיקות מלאות',
      ],
      technicalTranslation: `🔴 **HIGH RISK** (RBAC, Auth, Data Filters)
   → Requires: Explicit plan + Negative tests + Full test suite
   → Examples: Change \`city_id\` filter, modify role permissions, auth flows
   → Tests: \`app/tests/e2e/rbac/*.spec.ts\`

🔸 **MEDIUM RISK** (Features, Forms, Tasks)
   → Requires: E2E tests + Integration tests
   → Examples: Add voter field, modify task assignment, new dashboard widget
   → Tests: \`app/tests/e2e/features/*.spec.ts\`

🔹 **LOW RISK** (UI Styling, Translations)
   → Requires: Visual regression + RTL check
   → Examples: Change button color, update Hebrew text, adjust spacing
   → Tests: Lighthouse + manual visual check`,
      keywords: ['סיכון', 'שינויים', 'בדיקות', 'אבטחה', 'תיקוני באגים', 'risk'],
    },
    {
      id: 'superadmin-security',
      order: 7,
      title: 'אבטחת SuperAdmin',
      icon: 'AdminPanelSettingsIcon',
      color: colors.status.orange,
      realWorldExample: `דמיין מפתח ראשי של בניין:

• אתה לא יכול ללכת לחנות חומרה ולהעתיק אותו
• צריך לפנות לחברת האבטחה ולעבור אימות מלא
• רק טכנאי מוסמך יכול ליצור עותק נוסף

כך גם SuperAdmin במערכת:

• לא אפשר ליצור אותו דרך ה-UI (כמו שיוצרים רכז עיר)
• רק ישירות במסד הנתונים (Prisma Studio או seed script)
• זה מבטיח שאף אחד לא יכול "לקדם" את עצמו בטעות`,
      whySuperAdminCares: [
        'שמירה על הגישה העליונה של המערכת',
        'מניעת "קידום עצמי" של משתמשים (privilege escalation)',
        'בקרת נזקים: אם מישהו פורץ, הוא לא יכול ליצור SuperAdmin חדש',
        'ביקורת: קל לבדוק מי יש לו is_super_admin = true (אמור להיות 1-2 בלבד)',
      ],
      technicalTranslation: `• SuperAdmin נוצר רק דרך:
  1. Database seed: \`npm run db:seed\` (ראשוני)
  2. Prisma Studio: \`npx prisma studio\` (manual creation)
  3. SQL direct: \`psql\` command (advanced)

• \`is_super_admin\` flag: NEVER exposed in public APIs
• UI/API: Cannot create users with \`is_super_admin = true\`
• Seed default: \`superadmin@election.test\` → **Must be changed!**
• Security audit:
  \`SELECT email FROM users WHERE is_super_admin = true;\`
  (אמור להחזיר 1-2 משתמשים בלבד)`,
      keywords: ['SuperAdmin', 'אבטחה', 'הרשאות', 'יצירה', 'ניהול', 'privilege'],
    },
    {
      id: 'campaign-season',
      order: 8,
      title: 'עונת קמפיין (Campaign Season Context)',
      icon: 'EventIcon',
      color: colors.status.red,
      realWorldExample: `דמיין שאתה ב-10 הימים האחרונים לפני הבחירות:

**המצב:**
• 500 פעילים בשטח, פועלים 12 שעות ביום
• 100,000 בוחרים במאגר, 50,000 טלפונים ביום
• 20 רכזים מתאמים 10 שכונות בו-זמנית
• כל תקלה במערכת = אובדן קולות אמיתי

**מה זה אומר?**

זה **לא** הזמן לשנות:
❌ מערכת הרשאות
❌ פיצ'ר חדש של ניהול משימות
❌ שדרוג גרסת React

זה **כן** הזמן ל:
✅ תיקוני באגים קטנים
✅ שיפורי UI (צבעים, כפתורים)
✅ תרגום עברי של טקסט שנשכח

המערכת מתייחסת לעונת קמפיין כמו אירוע חי - **יציבות > חדשנות**.`,
      whySuperAdminCares: [
        'דעת מתי לאשר שינויים ומתי להמתין (timing is everything)',
        'הבנה של איזון מהירות מול בטיחות',
        'תכנון שדרוגים לפני/אחרי עונת הקמפיין',
        'בקרת עדיפויות: באגים קריטיים vs nice-to-have features',
      ],
      technicalTranslation: `🟢 **SAFE TO ITERATE QUICKLY** (during campaign):
   • UI styling (colors, spacing, borders, shadows)
   • Hebrew translations (fix typos, clarify text)
   • Mobile responsiveness tweaks (button size, padding)
   • Non-behavioral changes (refactoring internals)
   • Performance optimizations (no logic change)

🔴 **SLOW DOWN AND TEST** (during campaign):
   • RBAC changes (permissions, data filters, role assignments)
   • Auth flows (login, password reset, session management)
   • Locked pages (Cities, Manage Voters - see LOCKED_FLOWS)
   • Database schema changes (migrations, new tables)
   • Third-party integrations (SMS, email, payment)

📅 **Campaign Calendar Planning:**
   • 3 months before: Major features, RBAC changes, migrations
   • 1 month before: Medium features, forms, dashboards
   • 2 weeks before: UI polish, translations, bug fixes only
   • 1 week before: Critical bugs only, no features
   • Election day: Read-only (no deployments)`,
      keywords: ['קמפיין', 'בחירות', 'לוחות זמנים', 'עדיפויות', 'דחיפות', 'יציבות'],
    },
    {
      id: 'data-integrity',
      order: 9,
      title: 'שלמות נתונים (Data Integrity)',
      icon: 'StorageIcon',
      color: colors.pastel.cyan,
      realWorldExample: `דמיין שרכז שכונה מוחק בטעות 50 פעילים במקום להסתיר אותם:

**אם המחיקה קבועה (hard delete):**
❌ כל ההיסטוריה שלהם נעלמת
❌ רישומי נוכחות - נמחקו
❌ משימות שהוקצו להם - נעלמו
❌ קשרי בוחרים - אבדו לנצח

**אבל במערכת שלנו (soft delete):**
✅ הפעיל מסומן כ-\`is_active = false\`
✅ כל הנתונים נשארים במסד הנתונים
✅ אפשר לשחזר אותו בלחיצת כפתור
✅ ההיסטוריה נשמרת לניתוח אחרי הקמפיין

זה כמו "סל מחזור" במחשב - אתה לא באמת מוחק, רק מסתיר.`,
      whySuperAdminCares: [
        'הגנה מפני טעויות בלתי הפיכות (human error protection)',
        'שמירה על היסטוריה לניתוח אחרי הקמפיין',
        'אפשרות לשחזר נתונים במקרה חירום',
        'ביקורת ותאימות: רישום מלא של כל הפעולות',
      ],
      technicalTranslation: `**Soft Deletes (מחיקה רכה):**
• \`activists.is_active = false\` (NOT \`DELETE FROM activists\`)
• Blocked: \`activists.delete()\` via Prisma middleware
• Queries filter: \`WHERE is_active = true\` (אוטומטי)
• Recovery: \`UPDATE activists SET is_active = true WHERE id = ?\`

**Uniqueness Constraints (למניעת כפילויות):**
• Activists: \`UNIQUE (neighborhood_id, full_name, phone)\`
• City Coordinators: \`UNIQUE (city_id, user_id)\`
• M2M Assignments: \`PRIMARY KEY (activist_coordinator_id, neighborhood_id)\`

**Immutable Records (רשומות שלא ניתנות לשינוי):**
• \`attendance_records\`: Cannot UPDATE/DELETE after creation
• Audit trail must be tamper-proof (לא ניתן לשנות היסטוריה)
• \`created_at\` timestamps: Auto-generated, never modified

**Integrity Checks:**
• \`npm run db:check-integrity\` (script to detect orphaned records)
• Referential integrity: Foreign keys with CASCADE/RESTRICT
• Data validation: Zod schemas on client + server`,
      keywords: ['מחיקה', 'שחזור', 'היסטוריה', 'גיבוי', 'אובדן נתונים', 'integrity'],
    },
  ];

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        background: colors.neutral[50],
        minHeight: '100vh',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <RocketLaunchIcon sx={{ fontSize: 48, color: colors.pastel.purple }} />
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: colors.neutral[900],
                mb: 0.5,
              }}
            >
              מדריך אתחול מערכת - SuperAdmin
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: colors.neutral[600],
                fontWeight: 500,
              }}
            >
              הדרכה שלב אחר שלב להקמת מערכת הקמפיין שלך
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Critical Warning */}
      <Alert severity="error" sx={{ mb: 4, borderRadius: borderRadius.lg }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <WarningIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '16px', mb: 0.5 }}>
              ⚠️ קריטי: החלף את משתמש ה-SuperAdmin לפני כל דבר אחר!
            </Typography>
            <Typography sx={{ fontSize: '14px' }}>
              המערכת יוצרת משתמש דמו בשם <code>superadmin@election.test</code>. אתה חייב להחליף את
              הפרטים שלו (אימייל, שם, טלפון, סיסמה) לפני שתתחיל לעבוד. השתמש ב-Prisma Studio:{' '}
              <code>npm run db:studio</code>
            </Typography>
          </Box>
        </Box>
      </Alert>

      {/* Campaign Organizational Hierarchy - Visual Flow */}
      <Card
        sx={{
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          border: `1px solid ${colors.neutral[200]}`,
          overflow: 'hidden',
          mb: 4,
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            p: 3,
            color: colors.neutral[0],
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ fontSize: 32 }}>
            <AccountTreeIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              📊 מבנה היררכי של מערכת הבחירות
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              זה המבנה הארגוני שתצור בשלבים הבאים
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              maxWidth: '900px',
              mx: 'auto',
            }}
          >
            {/* SuperAdmin */}
            <Card
              sx={{
                borderRadius: borderRadius.lg,
                border: `3px solid ${colors.pastel.purple}`,
                boxShadow: shadows.large,
                background: `linear-gradient(135deg, ${colors.pastel.purple}15 0%, ${colors.pastel.purple}05 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: colors.pastel.purple,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                    }}
                  >
                    <AdminPanelSettingsIcon />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '18px', color: colors.neutral[900] }}>
                      SuperAdmin (אתה!)
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: colors.neutral[600] }}>
                      ניהול מלא של המערכת - גישה לכל הנתונים
                    </Typography>
                  </Box>
                  <Chip
                    label="מותקן"
                    sx={{
                      background: colors.status.green,
                      color: colors.neutral[0],
                      fontWeight: 700,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Arrow */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDownwardIcon sx={{ fontSize: 32, color: colors.neutral[400] }} />
            </Box>

            {/* Area Manager */}
            <Card
              sx={{
                borderRadius: borderRadius.lg,
                border: `3px solid ${colors.pastel.orange}`,
                boxShadow: shadows.large,
                background: `linear-gradient(135deg, ${colors.pastel.orange}15 0%, ${colors.pastel.orange}05 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: colors.pastel.orange,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                    }}
                  >
                    <PublicIcon />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '18px', color: colors.neutral[900] }}>
                      שלב 1: Area Managers (מנהלי אזור)
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: colors.neutral[600] }}>
                      מנהל מחוז - מנהל מספר ערים באזור גיאוגרפי
                    </Typography>
                  </Box>
                  <Chip label="אופציונלי" sx={{ background: colors.pastel.orangeLight, fontWeight: 600 }} />
                </Box>
              </CardContent>
            </Card>

            {/* Arrow */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDownwardIcon sx={{ fontSize: 32, color: colors.neutral[400] }} />
            </Box>

            {/* Cities */}
            <Card
              sx={{
                borderRadius: borderRadius.lg,
                border: `3px solid ${colors.pastel.blue}`,
                boxShadow: shadows.large,
                background: `linear-gradient(135deg, ${colors.pastel.blue}15 0%, ${colors.pastel.blue}05 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: colors.pastel.blue,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                    }}
                  >
                    <LocationCityIcon />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '18px', color: colors.neutral[900] }}>
                      שלב 2: Cities (ערים)
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: colors.neutral[600] }}>
                      יחידות ארגוניות עצמאיות - תל אביב, ירושלים, חיפה וכו&apos;
                    </Typography>
                  </Box>
                  <Chip label="חובה" sx={{ background: colors.status.red, color: colors.neutral[0], fontWeight: 700 }} />
                </Box>
              </CardContent>
            </Card>

            {/* Arrow */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDownwardIcon sx={{ fontSize: 32, color: colors.neutral[400] }} />
            </Box>

            {/* City Coordinators */}
            <Card
              sx={{
                borderRadius: borderRadius.lg,
                border: `3px solid ${colors.pastel.blue}`,
                boxShadow: shadows.large,
                background: `linear-gradient(135deg, ${colors.pastel.blue}15 0%, ${colors.pastel.blue}05 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: colors.pastel.blue,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                    }}
                  >
                    <PeopleIcon />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '18px', color: colors.neutral[900] }}>
                      שלב 3: City Coordinators (רכזי עיר)
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: colors.neutral[600] }}>
                      רכז עיר - מנהל את כל הפעילות של עיר אחת
                    </Typography>
                  </Box>
                  <Chip label="חובה" sx={{ background: colors.status.red, color: colors.neutral[0], fontWeight: 700 }} />
                </Box>
              </CardContent>
            </Card>

            {/* Arrow */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDownwardIcon sx={{ fontSize: 32, color: colors.neutral[400] }} />
            </Box>

            {/* Neighborhoods */}
            <Card
              sx={{
                borderRadius: borderRadius.lg,
                border: `3px solid ${colors.status.lightGreen}`,
                boxShadow: shadows.large,
                background: `linear-gradient(135deg, ${colors.status.lightGreen}15 0%, ${colors.status.lightGreen}05 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: colors.status.lightGreen,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                    }}
                  >
                    <HomeWorkIcon />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '18px', color: colors.neutral[900] }}>
                      שלב 4: Neighborhoods (שכונות)
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: colors.neutral[600] }}>
                      מחוזות קמפיין - אזורים גיאוגרפיים בתוך עיר (פלורנטין, נווה צדק וכו&apos;)
                    </Typography>
                  </Box>
                  <Chip label="חובה" sx={{ background: colors.status.red, color: colors.neutral[0], fontWeight: 700 }} />
                </Box>
              </CardContent>
            </Card>

            {/* Arrow */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDownwardIcon sx={{ fontSize: 32, color: colors.neutral[400] }} />
            </Box>

            {/* Activist Coordinators */}
            <Card
              sx={{
                borderRadius: borderRadius.lg,
                border: `3px solid ${colors.pastel.green}`,
                boxShadow: shadows.large,
                background: `linear-gradient(135deg, ${colors.pastel.green}15 0%, ${colors.pastel.green}05 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: colors.pastel.green,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                    }}
                  >
                    <GroupsIcon />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '18px', color: colors.neutral[900] }}>
                      שלב 5: Activist Coordinators (רכזי שכונות)
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: colors.neutral[600] }}>
                      רכז שכונתי - מארגן פעילים ב-1 עד 5 שכונות
                    </Typography>
                  </Box>
                  <Chip label="חובה" sx={{ background: colors.status.red, color: colors.neutral[0], fontWeight: 700 }} />
                </Box>
              </CardContent>
            </Card>

            {/* Arrow */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDownwardIcon sx={{ fontSize: 32, color: colors.neutral[400] }} />
            </Box>

            {/* Activists */}
            <Card
              sx={{
                borderRadius: borderRadius.lg,
                border: `3px solid ${colors.neutral[400]}`,
                boxShadow: shadows.large,
                background: `linear-gradient(135deg, ${colors.neutral[200]}15 0%, ${colors.neutral[100]}05 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: colors.neutral[400],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                    }}
                  >
                    <GroupsIcon />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '18px', color: colors.neutral[900] }}>
                      שלב 6: Activists (פעילי שטח)
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: colors.neutral[600] }}>
                      מתנדבי קמפיין בשטח - אלו שעושים את העבודה בפועל
                    </Typography>
                  </Box>
                  <Chip label="חובה" sx={{ background: colors.status.red, color: colors.neutral[0], fontWeight: 700 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </CardContent>
      </Card>

      {/* Step-by-Step Setup Guide */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: colors.neutral[900],
          mb: 3,
          textAlign: 'center',
        }}
      >
        📋 הדרכה שלב אחר שלב
      </Typography>

      <Box sx={{ mb: 4 }}>
        <SystemRulesClient
          setupSteps={setupSteps}
          architectureConcepts={architectureConcepts}
          isRTL={isRTL}
        />
      </Box>

      {/* Password Management Section */}
      <Card
        sx={{
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          border: `2px solid ${colors.status.orange}`,
          overflow: 'hidden',
          mb: 4,
        }}
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, ${colors.status.orange} 0%, ${colors.status.orange}CC 100%)`,
            p: 3,
            color: colors.neutral[0],
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <SecurityIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              🔐 ניהול סיסמאות - מידע חשוב
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              כיצד לטפל בסיסמאות שנשכחו ולאפס גישה למשתמשים
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: borderRadius.md }}>
            <Typography sx={{ fontWeight: 700, fontSize: '15px', mb: 1 }}>
              ⚠️ אזהרה קריטית: סיסמאות לא נשמרות במערכת!
            </Typography>
            <Typography sx={{ fontSize: '14px' }}>
              כאשר אתה יוצר משתמש חדש, הסיסמה מוצגת <strong>פעם אחת בלבד</strong> במסך אישור היצירה.
              לאחר סגירת המסך, אין דרך לשחזר את הסיסמה המקורית. אם משתמש שכח את הסיסמה שלו,
              <strong> הדרך היחידה היא לאפס את הסיסמה</strong>.
            </Typography>
          </Alert>

          <Typography
            variant="h6"
            sx={{ fontWeight: 700, mb: 2, color: colors.neutral[800], display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <InfoIcon sx={{ color: colors.status.blue }} />
            איך לאפס סיסמה למשתמש?
          </Typography>

          <Box
            sx={{
              p: 3,
              background: colors.neutral[50],
              borderRadius: borderRadius.lg,
              border: `2px solid ${colors.neutral[200]}`,
              mb: 3,
            }}
          >
            <List>
              <ListItem sx={{ alignItems: 'flex-start', pb: 2 }}>
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: colors.status.blue,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    1
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary="עבור למסך משתמשים"
                  secondary={
                    <Link href="/users" style={{ color: colors.primary.main, fontWeight: 600, textDecoration: 'underline' }}>
                      לחץ כאן כדי לעבור למסך משתמשים ➤
                    </Link>
                  }
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: '15px',
                    color: colors.neutral[800],
                    mb: 0.5,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '14px',
                    color: colors.neutral[600],
                    mt: 0.5,
                  }}
                />
              </ListItem>

              <ListItem sx={{ alignItems: 'flex-start', pb: 2 }}>
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: colors.status.blue,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    2
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary="מצא את המשתמש ברשימה"
                  secondary="השתמש בסינונים או בחיפוש כדי למצוא את המשתמש שצריך לאפס לו את הסיסמה"
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: '15px',
                    color: colors.neutral[800],
                    mb: 0.5,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '14px',
                    color: colors.neutral[600],
                  }}
                />
              </ListItem>

              <ListItem sx={{ alignItems: 'flex-start', pb: 2 }}>
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: colors.status.blue,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    3
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary='לחץ על שלוש הנקודות (⋮) ליד המשתמש'
                  secondary="תפריט פעולות ייפתח עם מספר אפשרויות"
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: '15px',
                    color: colors.neutral[800],
                    mb: 0.5,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '14px',
                    color: colors.neutral[600],
                  }}
                />
              </ListItem>

              <ListItem sx={{ alignItems: 'flex-start', pb: 2 }}>
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: colors.status.orange,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    4
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary='בחר "אפס סיסמה"'
                  secondary="תיפתח חלונית שבה תוכל להזין סיסמה חדשה למשתמש"
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: '15px',
                    color: colors.neutral[800],
                    mb: 0.5,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '14px',
                    color: colors.neutral[600],
                  }}
                />
              </ListItem>

              <ListItem sx={{ alignItems: 'flex-start' }}>
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: colors.status.green,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    5
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary="הזן סיסמה חדשה ושלח למשתמש"
                  secondary="הסיסמה החדשה תוצג לך פעם אחת בלבד - העתק והעבר למשתמש באופן מאובטח (WhatsApp, SMS)"
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: '15px',
                    color: colors.neutral[800],
                    mb: 0.5,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '14px',
                    color: colors.neutral[600],
                  }}
                />
              </ListItem>
            </List>
          </Box>

          <Alert severity="info" sx={{ borderRadius: borderRadius.md }}>
            <Typography sx={{ fontWeight: 600, fontSize: '14px', mb: 0.5 }}>
              💡 טיפ: יצירת משתמש חדש
            </Typography>
            <Typography sx={{ fontSize: '13px' }}>
              כאשר אתה יוצר משתמש חדש, הסיסמה המוצגת במסך האישור כוללת כפתור העתקה נוח.
              השתמש בכפתור &quot;העתק אימייל וסיסמה&quot; כדי להעתיק את שני הפרטים בבת אחת ולשלוח למשתמש החדש.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Quick Reference Card */}
      <Card
        sx={{
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          border: `1px solid ${colors.neutral[200]}`,
          overflow: 'hidden',
          mb: 4,
        }}
      >
        <Box
          sx={{
            background: colors.gradients.info,
            p: 3,
            color: colors.neutral[0],
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <InfoIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              📖 מידע נוסף
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              משאבים נוספים ועזרה
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Link href="/onboarding" passHref style={{ textDecoration: 'none' }}>
                <Card
                  sx={{
                    p: 2.5,
                    borderRadius: borderRadius.lg,
                    border: `2px solid ${colors.pastel.blue}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: shadows.medium,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <RocketLaunchIcon sx={{ fontSize: 32, color: colors.pastel.blue }} />
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '15px', color: colors.neutral[900] }}>
                        מדריך אתחול מפורט
                      </Typography>
                      <Typography sx={{ fontSize: '13px', color: colors.neutral[600] }}>
                        מידע נוסף על תכנון המערכת ושאלות נפוצות
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Link>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  p: 2.5,
                  borderRadius: borderRadius.lg,
                  border: `2px solid ${colors.pastel.green}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SecurityIcon sx={{ fontSize: 32, color: colors.pastel.green }} />
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '15px', color: colors.neutral[900] }}>
                      אבטחה וגיבויים
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: colors.neutral[600] }}>
                      אל תשכח: גיבויים יומיים ו-HTTPS בפרודקשן
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Final Checklist */}
      <Card
        sx={{
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          border: `2px solid ${colors.status.green}`,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            background: colors.gradients.success,
            p: 3,
            color: colors.neutral[0],
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              ✅ רשימת בדיקה לפני השקה
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              וודא שביצעת את כל השלבים הבאים
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: colors.neutral[800] }}>
                🔐 אבטחה
              </Typography>
              <List dense>
                {[
                  'החלפת משתמש SuperAdmin בפרטים אמיתיים',
                  'סיסמאות חזקות לכל המשתמשים',
                  'HTTPS מופעל בפרודקשן',
                  'משתני סביבה (.env) מאובטחים',
                  'גיבוי ראשוני בוצע',
                ].map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ fontSize: 20, color: colors.status.green }} />
                    </ListItemIcon>
                    <ListItemText primary={item} primaryTypographyProps={{ fontSize: '14px' }} />
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: colors.neutral[800] }}>
                📊 נתונים
              </Typography>
              <List dense>
                {[
                  'לפחות עיר אחת נוצרה',
                  'לפחות רכז עיר אחד הוקצה',
                  'לפחות 3 שכונות נוצרו',
                  'לפחות רכז שכונתי אחד הוקצה',
                  'נתונים נבדקו עם: npm run db:check-integrity',
                ].map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ fontSize: 20, color: colors.pastel.blue }} />
                    </ListItemIcon>
                    <ListItemText primary={item} primaryTypographyProps={{ fontSize: '14px' }} />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
