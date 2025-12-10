# Railway Production Database Setup

## 🎯 Quick Setup (Copy & Paste)

### Option 1: Via Railway Dashboard (Recommended)

1. **Open Railway Project Dashboard**: https://railway.app/project/812ee13e-900b-4435-9b08-6a6f96060771

2. **Go to your service** → Click "rbac_hierarchy"

3. **Run One-Off Command**:
   - Click "Settings" tab
   - Scroll to "Deploy" section
   - Or use the "Execute" button in the service view

4. **Paste this command**:
```bash
npx prisma generate && npx prisma db push --accept-data-loss && npm run db:seed
```

This will:
- ✅ Generate Prisma Client
- ✅ Push database schema to Railway PostgreSQL
- ✅ Seed with test data (2 cities, 4 neighborhoods, full user hierarchy)

### Option 2: Add All Israeli Cities (Optional)

After the main setup, run this additional command:
```bash
npm run db:seed:cities
```

This adds all 82 Israeli cities to the database.

---

## 📊 What Gets Created

### Users & Roles:
- **SuperAdmin**: admin@election.test (password: `admin123`)
- **Area Manager**: sarah.cohen@telaviv-district.test (password: `area123`)
- **City Coordinator (Tel Aviv)**: david.levi@telaviv.test (password: `manager123`)
- **City Coordinator (Ramat Gan)**: moshe.israeli@ramatgan.test (password: `manager123`)
- **Activist Coordinators**: 3 coordinators with assigned neighborhoods

### Geographic Data:
- **Area**: Tel Aviv District (מחוז תל אביב)
- **Cities**:
  - Tel Aviv-Yafo (תל אביב-יפו)
  - Ramat Gan (רמת גן)
- **Neighborhoods**: 4 neighborhoods across both cities

### Sample Data:
- **Activists**: 8 field activists assigned to neighborhoods
- **Tasks**: Sample campaign tasks
- **Attendance Records**: Historical attendance data

---

## 🔍 Verify Setup

After running the commands, verify the database:

```bash
# Check cities count
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM cities;"

# List all cities
npx prisma db execute --stdin <<< "SELECT name FROM cities ORDER BY name;"

# Check users count
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users;"
```

---

## ⚠️ Important Notes

- This is **production data** - handle with care
- SuperAdmin account should change password immediately
- All test accounts use simple passwords - update in production
- GPS coordinates are sample data - update for actual campaign locations

---

## 🚀 Next Steps After Setup

1. **Login to your Railway app** using SuperAdmin credentials
2. **Change SuperAdmin password** immediately
3. **Create real campaign data** or import from existing system
4. **Configure environment variables** (email, SMS, etc.)
5. **Enable monitoring** for production readiness

---

## 💾 Database Backup (Recommended)

Before seeding, you may want to backup existing data:

```bash
# This creates a backup of the current database state
railway run --service rbac_hierarchy pg_dump > backup_$(date +%Y%m%d_%H%M%S).sql
```

To restore:
```bash
railway run --service rbac_hierarchy psql < backup_YYYYMMDD_HHMMSS.sql
```
