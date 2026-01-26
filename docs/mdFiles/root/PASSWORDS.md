# 🔐 Test Account Credentials

**Last Updated:** 2025-12-19
**All Passwords:** `admin123`

## Quick Login Accounts

| Role | Name | Email | Password |
|------|------|-------|----------|
| 🟣 **SuperAdmin (SA)** | מנהל מערכת | `admin@election.test` | `admin123` |
| 🟠 **Area Manager (AM)** | שרה כהן | `sarah.cohen@telaviv-district.test` | `admin123` |
| 🔵 **City Coordinator (CC)** | דוד לוי | `david.levi@telaviv.test` | `admin123` |
| 🟢 **Activist Coordinator (AC)** | רחל בן-דוד | `rachel.bendavid@telaviv.test` | `admin123` |

## All Test Users (12 Total)

### Tel Aviv District
1. ✅ `admin@election.test` - SuperAdmin - admin123
2. ✅ `sarah.cohen@telaviv-district.test` - Area Manager (Tel Aviv) - admin123
3. ✅ `david.levi@telaviv.test` - City Coordinator (Tel Aviv) - admin123
4. ✅ `rachel.bendavid@telaviv.test` - Activist Coordinator (Florentin) - admin123
5. ✅ `yael.cohen@telaviv.test` - Activist Coordinator (Jaffa) - admin123
6. ✅ `moshe.israeli@ramatgan.test` - City Coordinator (Ramat Gan) - admin123
7. ✅ `dan.carmel@ramatgan.test` - Activist Coordinator (Ramat Gan) - admin123

### Other Districts
8. ✅ `manager@north-district.test` - Area Manager (North) - admin123
9. ✅ `manager@haifa-district.test` - Area Manager (Haifa) - admin123
10. ✅ `manager@center-district.test` - Area Manager (Center) - admin123
11. ✅ `manager@jerusalem-district.test` - Area Manager (Jerusalem) - admin123
12. ✅ `manager@south-district.test` - Area Manager (South) - admin123

## Verification

Run this to verify all passwords:
```bash
cd app
npx tsx scripts/test-all-logins.ts
```

To reset all passwords to admin123:
```bash
cd app
npx tsx scripts/fix-passwords.ts
```

## Login URL

**Development:** http://localhost:3200/login

## Notes

- ✅ All passwords have been standardized to `admin123`
- ✅ Database passwords verified with bcrypt
- ✅ Login page quick-login buttons updated
- ✅ Seed file uses consistent passwords
- ⚠️ **Remember to HARD REFRESH (Cmd+Shift+R) your browser after code changes!**

## Security Note

**⚠️ PRODUCTION WARNING:** These are TEST CREDENTIALS ONLY.

For production deployment:
1. Change all passwords to strong, unique values
2. Remove quick-login buttons from login page
3. Implement proper password reset flow
4. Enable 2FA for admin accounts
