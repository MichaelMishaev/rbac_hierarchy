# 🐤 Golden Path Canary Tests

## Purpose

These tests run **hourly in production** to verify system health with real data. They are the last line of defense against production issues.

## Tests

### GP-1: Authentication Flow (`auth-flow.canary.ts`)
**Tests:** Login, dashboard access, Hebrew RTL rendering
**Invariants:** INV-003 (Hebrew/RTL-Only)
**Frequency:** Every hour
**Alert:** Slack + GitHub Issue on failure

### GP-2: Multi-City Isolation (`isolation.canary.ts`)
**Tests:** Cross-city data leakage, RBAC boundaries
**Invariants:** INV-001 (Multi-City Isolation), INV-002 (RBAC)
**Frequency:** Every hour
**Alert:** Slack + GitHub Issue on failure

### GP-3: Hebrew/RTL Rendering (`rtl.canary.ts`)
**Tests:** HTML attributes, Hebrew text, visual regression
**Invariants:** INV-003 (Hebrew/RTL-Only)
**Frequency:** Every hour
**Alert:** Slack + GitHub Issue on failure

## Environment Variables

Required in GitHub Secrets:

```bash
CANARY_USER_EMAIL                   # Read-only test account (any role)
CANARY_PASSWORD                     # Shared password for all canary accounts
CANARY_CITY_COORDINATOR_EMAIL       # City Coordinator test account
CANARY_ACTIVIST_COORDINATOR_EMAIL   # Activist Coordinator test account
CANARY_CITY_NAME                    # Expected city name (e.g., "תל אביב")
CANARY_FORBIDDEN_CITY               # City that should NOT be visible (e.g., "ירושלים")
SLACK_WEBHOOK                       # Slack webhook for alerts
```

## Running Locally

```bash
# Set environment variables
export CANARY_USER_EMAIL="canary@test.com"
export CANARY_PASSWORD="canary123"
export CANARY_CITY_COORDINATOR_EMAIL="city.coordinator@test.com"
export CANARY_ACTIVIST_COORDINATOR_EMAIL="activist.coordinator@test.com"
export CANARY_CITY_NAME="תל אביב"
export CANARY_FORBIDDEN_CITY="ירושלים"

# Run canary tests
npm run test:canary
```

## What Happens on Failure?

1. **Slack Alert** → `#alerts` channel receives notification
2. **GitHub Issue** → Automatically created with "critical" label
3. **Email** → On-call engineer notified (via GitHub notifications)
4. **Investigation** → Check logs, recent deployments, infrastructure

## Success Criteria

- ✅ All canary tests pass
- ✅ Response times < 5 seconds
- ✅ No invariant violations detected
- ✅ Hebrew/RTL rendering correct

## Failure Examples

**Scenario 1: Authentication broken**
```
GP-1 FAILED: Cannot login
→ ALERT: Production login broken
→ ACTION: Check auth service, recent deployments
```

**Scenario 2: Data leakage**
```
GP-2 FAILED: City Coordinator can see other city data
→ ALERT: CRITICAL - INV-001 violated (data leakage)
→ ACTION: Rollback immediately, investigate RBAC
```

**Scenario 3: RTL broken**
```
GP-3 FAILED: HTML dir="ltr" instead of "rtl"
→ ALERT: Hebrew RTL rendering broken
→ ACTION: Check i18n configuration, recent UI changes
```

## Adding New Canary Tests

1. Create test file in `tests/canary/`
2. Follow naming pattern: `[feature].canary.ts`
3. Add test ownership header:
   ```typescript
   /**
    * INVARIANTS TESTED: INV-XXX
    * @owner [team-name]
    * @created YYYY-MM-DD
    */
   ```
4. Test MUST complete within 5 seconds
5. Use production canary accounts only (read-only)
6. Document in this README

## Notes

- **Read-only accounts:** Canary tests NEVER mutate production data
- **Hourly schedule:** Catches issues within 1 hour of deployment
- **No retries:** First failure = alert (no flaky test tolerance)
- **Visual regression:** Screenshots stored as artifacts
- **Production-only:** These tests run against real production environment

## Maintenance

- **Weekly:** Review canary test coverage
- **Monthly:** Update canary account credentials
- **Quarterly:** Add new canary tests for new features
- **On alert:** Investigate immediately (treat as P0 incident)
