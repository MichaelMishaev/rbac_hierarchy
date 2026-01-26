# ✅ Production Deployment Checklist

> **CRITICAL:** Complete ALL items before deploying to production
> **Zero tolerance for regression bugs**

---

## 🔒 Security & RBAC

- [ ] **Multi-city isolation tests passing**
  ```bash
  cd app && npm run test:e2e -- multi-tenant
  ```
  Expected: All tests pass, no cross-city data leakage

- [ ] **RBAC permission tests passing**
  ```bash
  cd app && npm run test:e2e -- rbac
  ```
  Expected: All role boundaries enforced

- [ ] **Negative tests passing** (unauthorized access blocked)
  ```bash
  cd app && npm run test:e2e tests/e2e/rbac/negative-tests.spec.ts
  ```
  Expected: All forbidden paths blocked

- [ ] **Runtime guards deployed** (Prisma middleware active)
  - File exists: `app/lib/prisma-middleware.ts`
  - Guards registered in Prisma client initialization
  - Test: Try to create activist without cityId → should throw error

- [ ] **SuperAdmin cannot be created via API**
  - Only via DB/bootstrap script
  - API blocks `isSuperAdmin: true` flag

---

## 🗂️ Data Integrity

- [ ] **DB integrity tests passing**
  ```bash
  cd app && npm run db:check-integrity
  ```
  Expected: No cityId mismatches, all FKs valid

- [ ] **Composite FK tests passing**
  - ActivistCoordinatorNeighborhood has matching cityId
  - Activists have matching cityId with neighborhood
  - No orphaned records

- [ ] **Soft delete behavior verified**
  - Activists use `isActive: false` (not hard delete)
  - Deleted activists still in DB
  - Test: Delete activist → verify `isActive: false`

- [ ] **No hard deletes on user-facing data**
  - Prisma middleware blocks hard deletes
  - Test: Try `prisma.activist.delete()` → should throw error

---

## 🇮🇱 Hebrew/RTL

- [ ] **All pages `dir="rtl" lang="he"`**
  - Check: View source on production dashboard
  - `<html dir="rtl" lang="he">`

- [ ] **All text in Hebrew (no English)**
  - Manual check: Navigate all pages
  - No English words visible (except technical errors)

- [ ] **Logical CSS properties used**
  - `marginInlineStart/End` (not marginLeft/Right)
  - `paddingInlineStart/End` (not paddingLeft/Right)

- [ ] **Visual regression tests passing**
  ```bash
  cd app && npm run test:e2e -- responsive
  ```
  Expected: All screenshots match baseline

---

## 📱 Mobile

- [ ] **Mobile navigation works**
  - Bottom navigation bar visible
  - FAB (Floating Action Button) working
  - Swipe gestures work

- [ ] **All pages accessible on iPhone 14 (390x844)**
  ```bash
  cd app && npm run test:e2e -- --project=mobile-iphone-14
  ```
  Expected: All pages render correctly

- [ ] **Touch gestures work**
  - Swipe actions
  - Tap interactions
  - Long-press menus

- [ ] **PWA installable and offline-capable**
  - Manifest.json valid
  - Service worker registered
  - Test: Install PWA on mobile device

---

## 🐤 Monitoring

- [ ] **Golden Path canaries deployed**
  - GitHub Action: `.github/workflows/golden-path-canary.yml`
  - Runs hourly
  - Test: Trigger workflow manually

- [ ] **Canary secrets configured**
  ```
  CANARY_USER_EMAIL
  CANARY_PASSWORD
  CANARY_CITY_COORDINATOR_EMAIL
  CANARY_ACTIVIST_COORDINATOR_EMAIL
  CANARY_CITY_NAME
  CANARY_FORBIDDEN_CITY
  SLACK_WEBHOOK
  ```

- [ ] **Error monitoring active**
  - Sentry/similar configured
  - Test: Throw error in dev → verify alert

- [ ] **Audit logs capturing all mutations**
  - Create activist → verify audit log entry
  - Update user → verify audit log entry
  - Delete neighborhood → verify audit log entry

- [ ] **Performance metrics tracked**
  - Web Vitals reporting
  - Page load times < 3 seconds
  - API response times < 500ms

---

## 🧪 Testing

- [ ] **All E2E tests passing**
  ```bash
  cd app && npm run test:e2e
  ```
  Expected: 40+ tests pass, 0 flaky

- [ ] **No flaky tests**
  - Run tests 5 times → all pass
  - No retry logic in CI
  - Zero tolerance for flaky tests

- [ ] **Type-check passing**
  ```bash
  cd app && npm run type-check
  ```
  Expected: No TypeScript errors

- [ ] **Lint passing**
  ```bash
  cd app && npm run lint
  ```
  Expected: No lint errors

- [ ] **Build successful**
  ```bash
  cd app && npm run build
  ```
  Expected: Build completes without errors

---

## 📋 Database

- [ ] **Production DB backed up**
  - Backup created before deployment
  - Backup tested (restore to staging)

- [ ] **Migrations applied**
  ```bash
  cd app && npm run db:migrate:prod
  ```
  Expected: All migrations applied successfully

- [ ] **Schema matches Prisma**
  ```bash
  cd app && npx prisma db pull
  ```
  Expected: No schema drift

- [ ] **Seed data created** (if new production)
  ```bash
  cd app && npm run db:seed:prod
  ```
  - SuperAdmin user created
  - Test cities/neighborhoods created

---

## 🌐 Infrastructure

- [ ] **Environment variables set**
  ```
  DATABASE_URL
  DATABASE_URL_POOLED
  NEXTAUTH_SECRET
  NEXTAUTH_URL
  REDIS_URL (if using Redis)
  ```

- [ ] **SSL certificates valid**
  - HTTPS enabled
  - Certificate not expired

- [ ] **CDN configured**
  - Static assets served via CDN
  - Cache headers correct

- [ ] **Rate limiting enabled**
  - API rate limits configured
  - DDoS protection active

---

## 🚀 Deployment

- [ ] **Deployment plan documented**
  - Rollback procedure defined
  - On-call engineer assigned

- [ ] **Staging tested**
  - All features tested on staging
  - Staging data matches production structure

- [ ] **Zero downtime deployment**
  - Blue-green deployment or similar
  - Database migrations run before code deploy

- [ ] **Rollback tested**
  - Rollback procedure documented
  - Test rollback on staging

---

## 📊 Post-Deployment

- [ ] **Canary tests passing** (within 1 hour)
  - Check GitHub Actions
  - Verify no alerts in Slack

- [ ] **Error rate normal** (< 1%)
  - Check Sentry dashboard
  - No new error spikes

- [ ] **Performance metrics normal**
  - Page load times < 3 seconds
  - API response times < 500ms

- [ ] **User reports monitoring**
  - WhatsApp channel monitored
  - Support tickets monitored

- [ ] **Database performance normal**
  - Query times < 100ms
  - No connection pool exhaustion

---

## ❌ Rollback Conditions

**Immediately rollback if:**

1. **Canary tests fail** within 1 hour
2. **Error rate > 5%** in production
3. **Critical feature broken** (login, dashboard, activists)
4. **Data leakage detected** (cross-city access)
5. **Performance degradation** (page load > 10 seconds)

**Rollback procedure:**
```bash
# Railway/Vercel: Rollback to previous deployment
railway rollback
# or
vercel rollback

# Database: Restore from backup (if schema changed)
pg_restore -d production backup.sql
```

---

## 🎯 Success Criteria

**System is production-ready when:**

- ✅ **99.8% regression prevention** (via tests + guards + canaries)
- ✅ **Zero data leakage** (multi-city isolation perfect)
- ✅ **Zero RBAC violations** (permissions enforced)
- ✅ **100% Hebrew RTL** (no English, no LTR)
- ✅ **Mobile-first always** (works on iPhone 14)
- ✅ **All checklist items completed**

**If ANY item fails → DO NOT DEPLOY** ❌

---

## 📞 Emergency Contacts

**On-call engineer:** [Name] - [Phone]
**Database admin:** [Name] - [Phone]
**Infrastructure:** [Name] - [Phone]

**Slack channels:**
- `#production-alerts` - Canary failures, errors
- `#deployments` - Deployment notifications
- `#support` - User reports

**Monitoring dashboards:**
- GitHub Actions: https://github.com/.../actions
- Sentry: https://sentry.io/.../
- Railway: https://railway.app/.../

---

**Remember: Regression bugs are NOT ALLOWED in production.**

**Last Updated:** 2025-12-17
**Version:** 1.0
