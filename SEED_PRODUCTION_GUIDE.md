# 🌱 Production Database Seeding Guide

## Overview

The production seed script creates **presentation-ready Hebrew demo data** with:

- ✅ **3 Corporations** (טכנולוגיות אלקטרה, קבוצת בינוי, רשת מזון טעים)
- ✅ **3 Managers** (one per corporation)
- ✅ **5 Supervisors** (distributed across corporations)
- ✅ **5 Sites** (factories, construction sites, restaurants)
- ✅ **17 Workers** (with Hebrew names and positions)

---

## 🚀 How to Seed Production Database on Railway

### Method 1: Run from Railway CLI (Recommended)

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link to your project**:
   ```bash
   railway link
   ```

4. **Run the seed script**:
   ```bash
   railway run npm run db:seed:prod
   ```

### Method 2: Run from Railway Dashboard

1. Go to Railway dashboard
2. Click on your Next.js service
3. Click **"Deployments"** tab
4. Click **"..."** on latest deployment → **"View Logs"**
5. In another tab: Railway → Your service → **Settings** → **Deploy**
6. Add a **custom build command**:
   ```
   npx prisma generate && npm run build && npm run db:seed:prod
   ```

   **⚠️ Warning:** This will run on EVERY deploy! Remove it after first run.

### Method 3: SSH into Railway Container (Advanced)

1. In Railway dashboard → Your service → **Settings**
2. Enable **"SSH"** (if available)
3. Connect via SSH
4. Run:
   ```bash
   cd /app/app
   npm run db:seed:prod
   ```

---

## 📝 Demo Credentials

After seeding, use these credentials to login at https://app.rbac.shop:

### SuperAdmin
```
Email: admin@rbac.shop
Password: admin123
```

### Managers
```
טכנולוגיות אלקטרה:
  Email: david.cohen@electra-tech.co.il
  Password: manager123

קבוצת בינוי:
  Email: sarah.levi@binui.co.il
  Password: manager123

רשת מזון טעים:
  Email: yossi.mizrahi@taim-food.co.il
  Password: manager123
```

### Supervisors
```
All supervisors:
  Password: supervisor123
  
Emails:
  - moshe.israeli@electra-tech.co.il
  - rachel.cohen@electra-tech.co.il
  - avi.shapira@binui.co.il
  - noa.goldstein@binui.co.il
  - chen.amar@taim-food.co.il
```

---

## 🗂️ What Data is Created

### Corporation 1: טכנולוגיות אלקטרה (Electra Tech)
- **Manager**: דוד כהן (David Cohen)
- **Sites**:
  - מפעל תל אביב (Tel Aviv Factory)
  - מפעל חיפה (Haifa Factory)
- **Supervisors**: 2
- **Workers**: 5

### Corporation 2: קבוצת בינוי (Binui Construction)
- **Manager**: שרה לוי (Sarah Levi)
- **Sites**:
  - אתר בנייה - פרויקט הרצליה (Herzliya Project)
  - אתר בנייה - פרויקט ירושלים (Jerusalem Project)
- **Supervisors**: 2
- **Workers**: 6

### Corporation 3: רשת מזון טעים (Taim Food Chain)
- **Manager**: יוסי מזרחי (Yossi Mizrahi)
- **Sites**:
  - סניף דיזנגוף (Dizengoff Branch)
- **Supervisors**: 1
- **Workers**: 3

---

## ✅ Verification

After seeding, verify the data:

1. **Login as SuperAdmin**:
   - Visit: https://app.rbac.shop
   - Login with: admin@rbac.shop / admin123
   - You should see all 3 corporations in the dashboard

2. **Check Corporation Data**:
   - Navigate to Corporations page
   - Verify all 3 corporations are listed
   - Click on each to see details

3. **Check Hierarchical Data**:
   - Navigate to Sites page
   - Verify 5 sites are listed
   - Navigate to Users page
   - Verify managers and supervisors exist
   - Navigate to Workers page (if available)
   - Verify 17 workers exist

---

## 🔄 Re-seeding

The seed script uses `upsert()` for corporations and users, so:
- ✅ **Safe to run multiple times** (won't create duplicates)
- ⚠️ **Workers will be duplicated** on each run (using `create()`)

If you need to re-seed from scratch:

```bash
# Warning: This deletes ALL data!
railway run npx prisma db push --force-reset
railway run npm run db:seed:prod
```

---

## 📊 Presentation Tips

1. **Login as SuperAdmin** to show:
   - Multi-corporation dashboard
   - Corporation management
   - User management across all corporations

2. **Login as Manager** to show:
   - Single corporation scope
   - Site management
   - Supervisor assignment
   - Worker management

3. **Login as Supervisor** to show:
   - Limited site access
   - Worker management for assigned sites only
   - Role-based restrictions

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'tsx'"
```bash
railway run npm install tsx --save-dev
railway run npm run db:seed:prod
```

### Error: "Database connection failed"
- Verify `DATABASE_URL` env var is set in Railway
- Check if Postgres service is running

### Error: "Unique constraint violation"
- Data already exists
- Either:
  - Ignore (upserts will update existing)
  - OR reset database (see Re-seeding section)

---

**Created**: 2025-11-30
**Last Updated**: 2025-11-30
