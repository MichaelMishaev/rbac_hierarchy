# GitHub Secrets Configuration

This document lists all GitHub Secrets required for CI/CD workflows to function correctly.

## How to Add Secrets

1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`
2. Click "New repository secret"
3. Add name and value
4. Click "Add secret"

---

## Required Secrets

### 🔴 CRITICAL: Canary Tests (Golden Path Health Check)

These secrets are used by the hourly production health check workflow (`.github/workflows/golden-path-canary.yml`).

| Secret Name | Description | Example | Required |
|-------------|-------------|---------|----------|
| `CANARY_USER_EMAIL` | Email for read-only test user in production | `canary@example.com` | ✅ Yes |
| `CANARY_PASSWORD` | Password for canary test user | `SecurePassword123!` | ✅ Yes |
| `CANARY_CITY_COORDINATOR_EMAIL` | Email for city coordinator test account | `city.test@example.com` | ⚠️ Optional |
| `CANARY_ACTIVIST_COORDINATOR_EMAIL` | Email for activist coordinator test | `activist.test@example.com` | ⚠️ Optional |
| `CANARY_CITY_NAME` | City name for RBAC isolation tests | `תל אביב` | ⚠️ Optional |
| `CANARY_FORBIDDEN_CITY` | City user should NOT have access to | `ירושלים` | ⚠️ Optional |

**Setup Instructions:**
1. Create a read-only user in production with minimal permissions
2. Use a strong, unique password for this account
3. This account will be used hourly to verify production health
4. **Security:** This user should only have read access, no write permissions

---

### 📊 Performance Tests

These secrets are used by the performance test workflow (`.github/workflows/performance-tests.yml`).

| Secret Name | Description | Example | Required |
|-------------|-------------|---------|----------|
| `DATABASE_URL_TEST` | Test database connection string | `postgresql://user:pass@host:5432/db` | ⚠️ Optional |

**Note:** Performance tests use local PostgreSQL containers by default. Only set `DATABASE_URL_TEST` if testing against an external database.

---

### 🔔 Notifications (Slack)

These secrets are used to send alerts when workflows fail.

| Secret Name | Description | Required |
|-------------|-------------|----------|
| `SLACK_WEBHOOK` | Slack webhook URL for alerts | ⚠️ Optional |

**Setup Instructions:**
1. Go to: https://api.slack.com/apps
2. Create a new app (or use existing)
3. Enable "Incoming Webhooks"
4. Create webhook for your alerts channel
5. Copy webhook URL to `SLACK_WEBHOOK` secret

**Format:** `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`

---

## Workflow Environment Variables

These are **NOT secrets** (they're hardcoded in workflows):

```yaml
# Used in all CI workflows
NEXTAUTH_URL: http://localhost:3000
NEXTAUTH_SECRET: test-secret-for-ci-only  # ⚠️ Only for CI, not production!
NODE_ENV: production
BASE_URL: http://localhost:3000
DATABASE_URL: postgresql://postgres:postgres_test_password@localhost:5432/hierarchy_platform_test
```

**Why these are safe to hardcode:**
- They're only used in CI environment (ephemeral containers)
- Database and Redis are local services (not exposed)
- Secrets are destroyed after workflow completes

---

## Security Best Practices

### ✅ DO:
- Use strong, unique passwords for canary accounts
- Rotate canary credentials periodically (monthly)
- Use read-only accounts for canary tests
- Monitor canary test results for unauthorized access attempts
- Keep Slack webhook private (it can post to your channel)

### ❌ DON'T:
- Use real user credentials for canary tests
- Give canary accounts write permissions
- Share secrets via email/chat
- Commit secrets to repository
- Use production admin accounts for testing

---

## Troubleshooting

### Canary Tests Failing: "Missing credentials"

**Symptoms:**
```
Error: CANARY_USER_EMAIL is not defined
Test skipped
```

**Solution:**
1. Verify secrets are added in GitHub UI
2. Check secret names match exactly (case-sensitive)
3. Re-run workflow after adding secrets

### Canary Tests Failing: "Authentication failed"

**Symptoms:**
```
Login failed: Invalid credentials
```

**Solution:**
1. Verify credentials work in production (manual test)
2. Check if password was changed/expired
3. Verify account is not locked/disabled

### Slack Notifications Not Sending

**Symptoms:**
```
Error: RequestError [HttpError]: Webhook URL not found
```

**Solution:**
1. Verify `SLACK_WEBHOOK` secret is set
2. Check webhook URL is still valid (regenerate if needed)
3. Ensure Slack app has permissions for target channel

---

## Current Status

| Workflow | Status | Missing Secrets |
|----------|--------|-----------------|
| Golden Path Canary | ⚠️ Needs Setup | `CANARY_USER_EMAIL`, `CANARY_PASSWORD` |
| Performance Tests | ✅ Ready | None (uses defaults) |
| CI Tests | ✅ Ready | None (uses local services) |

**Next Steps:**
1. Create read-only canary user in production
2. Add `CANARY_USER_EMAIL` and `CANARY_PASSWORD` secrets
3. (Optional) Configure Slack webhook for alerts
4. Test by manually triggering workflow

---

## Related Documentation

- **GitHub Actions**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Workflow Files**: `.github/workflows/`
- **Canary Tests**: `app/tests/canary/`
- **Bug Log**: `docs/bugs/bugs-current.md` (Bug #19)
