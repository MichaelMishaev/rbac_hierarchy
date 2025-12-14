# 🚀 Production Setup - SuperAdmin Creation

## Quick Start: Create SuperAdmin on Production

### Option 1: Via Railway CLI (Recommended)

If you're using Railway, run this command from your local machine:

```bash
cd app
railway run npm run db:seed:prod-admin
```

### Option 2: Via Railway Dashboard

1. Go to Railway Dashboard → Your Project
2. Click on **Variables** tab
3. Add a new variable (if not exists):
   ```
   DATABASE_URL=<your-production-database-url>
   ```
4. Go to **Deployments** tab
5. Click **Deploy** → **Custom Command**
6. Enter: `cd app && npm run db:seed:prod-admin`
7. Click **Deploy**

### Option 3: Manual Database Connection (Advanced)

If you have direct database access:

```bash
cd app

# Set production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run seed script
npm run db:seed:prod-admin
```

---

## 🔑 Default SuperAdmin Credentials

After running the seed script, you can log in with:

```
Email:    admin@election.test
Password: admin123
```

⚠️ **IMPORTANT**: Change this password immediately after first login!

---

## 🔒 Security Checklist

- [ ] Run seed script on production database
- [ ] Test login with default credentials
- [ ] Change SuperAdmin password immediately
- [ ] Enable 2FA (if implemented)
- [ ] Verify user has `isSuperAdmin: true` flag
- [ ] Delete or secure seed script after use

---

## 🛠️ Troubleshooting

### "User already exists" Error
The script uses `upsert`, so it's safe to run multiple times. It will update the existing user.

### "Database connection failed"
- Verify `DATABASE_URL` environment variable is set
- Check database is accessible from your current location
- Verify database credentials are correct

### "Permission denied"
- Make sure script is executable: `chmod +x scripts/seed-production-superadmin.ts`
- Or run with: `tsx scripts/seed-production-superadmin.ts`

### Login Still Fails After Seeding
1. Check if user was created:
   ```bash
   railway run npx prisma studio
   ```
2. Look for user with email: `admin@election.test`
3. Verify `isSuperAdmin` is `true`
4. Check password hash exists

---

## 📊 Verify SuperAdmin Creation

### Via Prisma Studio
```bash
# Railway
railway run npx prisma studio

# Or local with production URL
DATABASE_URL="..." npx prisma studio
```

### Via Database Query
```sql
SELECT id, email, "fullName", role, "isSuperAdmin", "isActive"
FROM users
WHERE email = 'admin@election.test';
```

Expected result:
```
id  | email                 | fullName         | role       | isSuperAdmin | isActive
----+-----------------------+------------------+------------+--------------+---------
1   | admin@election.test   | מנהל מערכת ראשי | SUPERADMIN | true         | true
```

---

## 🎯 What This Script Does

The `seed-production-superadmin.ts` script:

1. ✅ Connects to production database
2. ✅ Creates (or updates) SuperAdmin user:
   - Email: `admin@election.test`
   - Role: `SUPERADMIN`
   - Password: `admin123` (bcrypt hashed)
   - Flags: `isSuperAdmin: true`, `isActive: true`
3. ✅ Safe to run multiple times (uses upsert)
4. ✅ No test data - ONLY creates SuperAdmin

---

## 📁 Files

- **Seed Script**: `app/scripts/seed-production-superadmin.ts`
- **Package Script**: `npm run db:seed:prod-admin`
- **This Guide**: `PRODUCTION_SETUP.md`

---

## 🔄 Next Steps After SuperAdmin Creation

1. **Login**: Use credentials above to log in
2. **Change Password**: Go to profile settings
3. **Create Area Managers**: Add regional campaign directors
4. **Create Cities**: Add cities for your campaign
5. **Invite Coordinators**: Send invitations to city/activist coordinators

---

## ⚡ Quick Reference

```bash
# Development (seed with test data)
npm run db:seed

# Production (SuperAdmin only)
npm run db:seed:prod-admin

# Railway Production
railway run npm run db:seed:prod-admin

# Verify
railway run npx prisma studio
```

---

Last Updated: 2025-12-13
