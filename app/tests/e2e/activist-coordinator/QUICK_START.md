# 🚀 Quick Start Guide - Worker-Supervisor Tests

**For New Developers:** Run this automation to verify all worker-supervisor business rules are working correctly.

---

## ⚡ Quick Test (5 minutes)

Run all automated tests to verify the system:

```bash
cd app
npm run test:worker-supervisor
```

This will test **40+ scenarios** covering:
- ✅ Worker creation validation
- ✅ Worker updates and site changes
- ✅ Supervisor auto-assignment triggers
- ✅ Supervisor removal and reassignment
- ✅ Data integrity checks

---

## 🎯 What Gets Tested

### Business Rules Validated:

1. **Site with NO supervisors** → Workers must have `supervisorId = null`
2. **Site with supervisors** → Workers MUST be assigned to a supervisor
3. **First supervisor added** → AUTO-assigns ALL orphan workers
4. **Last supervisor removed** → Workers return to site (`supervisorId = null`)
5. **Non-last supervisor removed** → Workers reassigned (load balanced)
6. **Worker moves sites** → Supervisor cleared (manual reselection required)
7. **Orphan detection** → Flags data integrity issues

---

## 📊 Expected Output

```
✓ Scenario 1: Create worker in site with NO supervisors - supervisorId must be NULL
✓ Scenario 2: Create worker in site with NO supervisors - REJECT if supervisorId provided
✓ Scenario 3: Create worker in site with ONE supervisor - supervisorId REQUIRED
...
✓ 40 scenarios passed

🎉 All tests passed! System is working correctly.
```

---

## 🐛 If Tests Fail

### Step 1: Check Database State
```bash
npm run db:check-integrity
```

This will report any existing data integrity issues:
- Orphan workers (site has supervisors, worker doesn't)
- Dangling references (supervisor not assigned to site)
- Inactive supervisor assignments

### Step 2: Auto-Fix Issues
```bash
npm run db:fix-integrity
```

This will automatically:
- Assign orphan workers to least-loaded supervisors
- Clear dangling references
- Fix inactive supervisor assignments

### Step 3: Re-run Tests
```bash
npm run test:worker-supervisor
```

---

## 🔍 Debug Failed Test

### Run with UI (Interactive)
```bash
npm run test:worker-supervisor:ui
```

### Run in Browser (Visual)
```bash
npm run test:worker-supervisor:headed
```

### Run Specific Test File
```bash
npm run test:e2e -- tests/e2e/worker-supervisor/01-worker-creation.spec.ts
```

### Run Specific Scenario
```bash
npm run test:e2e -- tests/e2e/worker-supervisor/01-worker-creation.spec.ts -g "Scenario 1"
```

---

## 📁 Test Files Structure

```
tests/e2e/worker-supervisor/
├── README.md                     ← Full documentation
├── QUICK_START.md               ← This file
├── fixtures/
│   └── test-data.ts             ← Test data setup/cleanup
├── 01-worker-creation.spec.ts   ← Worker creation validation (8 scenarios)
├── 02-worker-updates.spec.ts    ← Worker updates & site changes (8 scenarios)
├── 03-supervisor-assignment.spec.ts ← Auto-assignment triggers (6 scenarios)
├── 04-supervisor-removal.spec.ts    ← Removal & reassignment (5 scenarios)
└── 05-data-integrity.spec.ts        ← Data integrity checks (6 scenarios)
```

---

## 🎓 Understanding Test Results

### ✅ All Green - System Working
All business rules are enforced correctly. Safe to deploy.

### ❌ Red Failures - Issues Found

**Common Issues:**

1. **"supervisorId REQUIRED" failure**
   - **Problem:** Worker created without supervisor in site that has supervisors
   - **Fix:** Validation not working, check `validateWorkerSupervisorAssignment()`

2. **"Auto-assign failed" failure**
   - **Problem:** First supervisor didn't trigger auto-assignment
   - **Fix:** Check `autoAssignWorkersToFirstSupervisor()` function

3. **"Load balancing failed" failure**
   - **Problem:** Workers not reassigned to least-loaded supervisor
   - **Fix:** Check `findLeastLoadedSupervisor()` logic

---

## 🧪 Manual Verification

Want to manually verify the system? Follow these steps:

### Test 1: Create Worker Without Supervisor (Should Fail)
```typescript
// Site B has supervisors, so this should FAIL
const result = await createWorker({
  fullName: 'Test Worker',
  phone: '1234567890',
  siteId: siteWithSupervisors,
  // supervisorId missing - should be rejected
});

// Expected: result.success === false
// Expected: result.error contains "must be assigned to a supervisor"
```

### Test 2: Assign First Supervisor (Should Auto-Assign)
```typescript
// Site A has 5 orphan workers
const result = await assignSupervisorToSite(supervisor1, siteA);

// Expected: result.success === true
// Expected: result.workersAutoAssigned === 5
// Expected: All workers now have supervisorId = supervisor1
```

### Test 3: Delete Supervisor (Should Reassign)
```typescript
// Site has 2 supervisors: supervisor1 (10 workers), supervisor2 (2 workers)
const result = await deleteSupervisor(supervisor1);

// Expected: result.success === true
// Expected: 10 workers now assigned to supervisor2 (least loaded)
```

---

## 📚 Learn More

- **Full Documentation:** [README.md](./README.md)
- **Business Rules:** `/docs/syAnalyse/mvp/WORKER_SUPERVISOR_RULES.md`
- **Helper Functions:** `/lib/supervisor-worker-assignment.ts`
- **Server Actions:** `/app/actions/workers.ts`, `/app/actions/supervisor-sites.ts`

---

## 🆘 Troubleshooting

### Tests hang or timeout
```bash
# Kill any hanging processes
pkill -f playwright

# Clean test database
npm run db:push -- --force-reset
npm run db:seed

# Re-run tests
npm run test:worker-supervisor
```

### Database connection errors
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart Docker services
cd ../..  # Go to project root
docker-compose restart

# Check database connection
npm run db:studio
```

### "Module not found" errors
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Regenerate Prisma client
npm run db:generate
```

---

## ✅ Checklist for New Developers

Before starting work on worker-supervisor features:

- [ ] Run `npm run test:worker-supervisor` - All tests pass
- [ ] Run `npm run db:check-integrity` - No integrity issues
- [ ] Read `README.md` - Understand all 40+ scenarios
- [ ] Review helper functions in `/lib/supervisor-worker-assignment.ts`
- [ ] Review server actions in `/app/actions/workers.ts`
- [ ] Understand auto-assignment triggers
- [ ] Understand load balancing logic

---

**Need Help?**
1. Check full documentation in [README.md](./README.md)
2. Run data integrity check: `npm run db:check-integrity`
3. Review test logs for specific error messages
4. Check Prisma Studio: `npm run db:studio`

---

**Last Updated:** December 2025
**Test Suite Version:** 1.0.0
**Total Scenarios:** 40+
**Average Run Time:** 3-5 minutes
