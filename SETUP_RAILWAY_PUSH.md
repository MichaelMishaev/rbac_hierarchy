# Setup Push Notifications on Railway

## Quick Setup (Copy-Paste)

### Step 1: Login to Railway Dashboard
1. Go to https://railway.app/
2. Select your project
3. Go to **Variables** tab

### Step 2: Add These 3 Variables

Copy and paste each variable exactly as shown:

#### Variable 1: NEXT_PUBLIC_VAPID_PUBLIC_KEY
```
BDXeBzl2KEpfh6ytszBK5hh3BiIPEpeoG0RvtSV7ekiU_3so0MOKZz0bccb6ggws4utlFCnpo8dapv8k08LCKIs
```

#### Variable 2: VAPID_PRIVATE_KEY
```
jVzGKX7sPC9961UR-XPLLEw_gq1BKEURcePVcKDfOZ4
```

#### Variable 3: VAPID_SUBJECT
```
mailto:admin@hierarchy-platform.com
```

### Step 3: Redeploy
After adding all 3 variables, Railway will automatically redeploy.

Wait ~2-3 minutes for deployment to complete.

---

## Verify Setup

### Check 1: Environment Variables
In Railway dashboard, you should see:
- ✅ `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (starts with `BDXe...`)
- ✅ `VAPID_PRIVATE_KEY` (starts with `jVzG...`)
- ✅ `VAPID_SUBJECT` (starts with `mailto:`)

### Check 2: Test Push Notification
1. Open Railway URL on mobile
2. Go to Settings → Enable "התראות דחיפה" toggle
3. Create task from another device
4. Receiver should get push notification!

### Check 3: Server Logs
In Railway logs, after creating a task, you should see:
```
[Push Send] Sending to X user(s)
[Push Send] Sent X/X notifications
[Task Created] Sent X push notifications for task [id]
```

**NOT**: `[Task Created] VAPID keys not configured, skipping push notifications`

---

## Alternative: Using Railway CLI

```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Add variables
railway variables set NEXT_PUBLIC_VAPID_PUBLIC_KEY="BDXeBzl2KEpfh6ytszBK5hh3BiIPEpeoG0RvtSV7ekiU_3so0MOKZz0bccb6ggws4utlFCnpo8dapv8k08LCKIs"
railway variables set VAPID_PRIVATE_KEY="jVzGKX7sPC9961UR-XPLLEw_gq1BKEURcePVcKDfOZ4"
railway variables set VAPID_SUBJECT="mailto:admin@hierarchy-platform.com"

# Verify
railway variables
```

---

## Security Note

⚠️ **VAPID_PRIVATE_KEY is secret!**
- Never commit to git
- Only add to Railway environment variables
- Each environment can have different keys (dev/staging/prod)

---

## What are VAPID Keys?

VAPID (Voluntary Application Server Identification) keys authenticate your server when sending push notifications to browsers.

- **Public Key**: Shared with browser (client-side, in HTML)
- **Private Key**: Stays on server (NEVER exposed to client)
- **Subject**: Contact email (shown to push service)

These keys were generated with `web-push generate-vapid-keys` command.

---

## Troubleshooting

**Issue**: "VAPID keys not configured"
- Check Railway Variables tab has all 3 keys
- Verify exact spelling (case-sensitive)
- Redeploy after adding variables

**Issue**: "Failed to send push notification"
- Check VAPID keys match between .env and Railway
- Verify receiver has enabled notifications in Settings
- Check receiver's push subscription exists in database

**Issue**: Push works locally but not on Railway
- Most common: VAPID keys not in Railway environment
- Solution: Add all 3 variables to Railway (see Step 2 above)

---

**Last Updated**: 2025-12-17
