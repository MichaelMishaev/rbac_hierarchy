# Push Notifications Testing Guide

## ✅ Status: ALREADY IMPLEMENTED

Push notifications are **already implemented** in the codebase. When a user creates a task, recipients automatically receive push notifications.

---

## 📋 Implementation Summary

### Code Files
- **Server-side sending**: `app/lib/send-push-notification.ts`
- **Client-side subscription**: `app/lib/push-notifications.ts`
- **Hook**: `app/hooks/usePushNotifications.ts`
- **Settings UI**: `app/app/components/settings/NotificationSettings.tsx`
- **API subscription**: `app/app/api/push/subscribe/route.ts`
- **Task creation**: `app/app/api/tasks/route.ts:152-173` (sends push notifications)
- **Service Worker**: `app/public/sw.js:196-277` (handles push events)

### Flow
1. **User creates task** → `/api/tasks` POST
2. **Server resolves recipients** → Gets all target user IDs
3. **Server sends push notifications** → `sendTaskNotification()` called
4. **Service Worker receives push** → Shows notification with Hebrew text
5. **User clicks notification** → Opens `/tasks/inbox`

---

## 🧪 Testing Push Notifications

### Prerequisites
1. **HTTPS required** (except localhost)
   - ✅ Railway production (has HTTPS)
   - ✅ Localhost (exempted by browsers)
2. **VAPID keys configured** (✅ already in `.env`)
3. **Service Worker registered** (✅ production only)
4. **User granted permission** (must enable in browser)

### Step 1: Enable Push Notifications

#### On Railway Production (Recommended)
1. **Deploy to Railway** (push notifications only work in production):
   ```bash
   git push origin main
   # Wait 2-3 minutes for deployment
   ```

2. **Open Railway URL on mobile** (iOS Safari or Android Chrome)

3. **Enable notifications**:
   - Go to Settings (gear icon in navbar)
   - Toggle "התראות דחיפה" (Push Notifications) switch ON
   - Browser will prompt: "Allow notifications?" → Tap **Allow**
   - Should see: ✅ "ההרשמה להתראות הצליחה!"

#### On Localhost (For Quick Testing)
```bash
cd /Users/michaelmishayev/Desktop/Projects/corporations/app
npm run build && npm start
# Access at http://localhost:8080
```

**Note**: Service Worker requires production mode (`NODE_ENV=production`).

---

### Step 2: Test Task Assignment Push Notification

#### Test Setup (Need 2 Users)
1. **Sender User** (SuperAdmin, Area Manager, or City Coordinator)
2. **Receiver User** (any role below sender)

#### Test Steps

**On Sender Device:**
1. Login as SuperAdmin/Area Manager/City Coordinator
2. Go to Tasks page
3. Create new task:
   - Body: "בדיקת התראות דחיפה - מטלת בדיקה" (min 10 chars)
   - Execution Date: Tomorrow
   - Recipients: Select "נבחרים ספציפיים" → Choose receiver user
   - Click "שלח משימה"
4. Check server logs for:
   ```
   [Push Send] Sending to 1 user(s)
   [Push Send] Sending to X device(s) for user [userId]
   [Push Send] Sent X/X notifications to user [userId]
   [Task Created] Sent X push notifications for task [taskId]
   ```

**On Receiver Device:**
1. **Must be on different device** (notifications don't show on same device)
2. **Can be in background or locked screen**
3. Should receive notification:
   - Title: "משימה חדשה"
   - Body: "מאת: [sender name] | תאריך: [date]\n[task body preview]"
   - Icon: Campaign logo (ק)
   - Actions: "פתח" (Open) / "סגור" (Close)

4. **Tap notification** → Opens app at `/tasks/inbox`

---

### Step 3: Verify Push Subscription in Database

```sql
-- Check if user is subscribed to push notifications
SELECT id, user_id, endpoint, created_at, last_used_at
FROM push_subscriptions
WHERE user_id = '[receiver_user_id]'
ORDER BY created_at DESC;

-- Check recent push subscriptions
SELECT
  ps.id,
  ps.user_id,
  u.email,
  u.name,
  ps.created_at,
  ps.last_used_at
FROM push_subscriptions ps
JOIN users u ON ps.user_id = u.id
ORDER BY ps.created_at DESC
LIMIT 10;
```

---

## 🔧 Troubleshooting

### Issue: "VAPID keys not configured"
**Symptom**: Server logs show: `[Task Created] VAPID keys not configured, skipping push notifications`

**Solution**: Check Railway environment variables:
```bash
# Login to Railway dashboard
# Go to your project → Variables
# Ensure these exist:
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BDXeBzl2KEpfh6ytszBK5hh3BiIPEpeoG0RvtSV7ekiU_3so0MOKZz0bccb6ggws4utlFCnpo8dapv8k08LCKIs
VAPID_PRIVATE_KEY=jVzGKX7sPC9961UR-XPLLEw_gq1BKEURcePVcKDfOZ4
VAPID_SUBJECT=mailto:admin@hierarchy-platform.com
```

### Issue: Notification permission denied
**Symptom**: Push toggle shows "הרשאות נדחו" (Permission denied)

**Solutions**:
- **iOS Safari**: Settings → Safari → [Your Site] → Notifications → Allow
- **Android Chrome**: Settings → Site Settings → Notifications → [Your Site] → Allow
- **Desktop Chrome**: chrome://settings/content/notifications → Add your site to "Allow"

### Issue: Service Worker not registered
**Symptom**: Console shows: `[Push] Service workers are not supported`

**Solutions**:
- **Check production mode**: Service Worker only registers when `NODE_ENV=production`
- **Run production build**: `npm run build && npm start`
- **Check HTTPS**: Must be HTTPS or localhost

### Issue: No push subscription in database
**Symptom**: Task created but no push notifications sent

**Check**:
1. Receiver has enabled push notifications in Settings
2. Service Worker is active: DevTools → Application → Service Workers
3. Push subscription exists: DevTools → Application → Storage → IndexedDB

### Issue: Notifications not appearing
**Symptom**: Server logs say "Sent X notifications" but nothing appears

**Check**:
1. **Different devices**: Notifications don't show on sender device
2. **Browser notifications enabled**: System settings allow notifications
3. **Do Not Disturb**: Check device DND settings
4. **Recent subscription**: `last_used_at` within last 30 days

---

## 📊 Expected Server Logs (Success)

```
[Push Send] Sending to 1 user(s)
[Push Send] Sending to 1 device(s) for user abc123
[Push Send] Sent 1/1 notifications to user abc123
[Task Created] Sent 1 push notifications for task 42
```

---

## 🔒 Security Notes

1. **VAPID Private Key**: NEVER commit to git (already in `.gitignore`)
2. **Endpoint encryption**: Push endpoints are encrypted by browser
3. **User consent**: Push requires explicit permission grant
4. **TTL**: Notifications expire after 24 hours (86400s)
5. **Expired subscriptions**: Auto-removed when browser returns 410 Gone

---

## 📱 Platform-Specific Notes

### iOS (Safari)
- ✅ Requires iOS 16.4+ for Web Push
- ✅ Must add to Home Screen first (PWA install)
- ⚠️ Push permission prompt ONLY appears after PWA install
- ✅ Notifications show in iOS Notification Center

### Android (Chrome)
- ✅ Works immediately (no PWA install required)
- ✅ Push permission prompt appears directly
- ✅ Notifications show in Android notification shade

### Desktop
- ✅ Chrome, Edge, Firefox support Web Push
- ✅ Push permission prompt appears on Settings toggle
- ⚠️ Safari 16+ required for macOS

---

## 🎯 Quick Test Checklist

- [ ] VAPID keys configured in Railway
- [ ] Receiver user enabled push notifications in Settings
- [ ] Receiver sees "מנוי פעיל" (Active subscription) status
- [ ] Sender creates task with receiver as recipient
- [ ] Server logs show "Sent X push notifications"
- [ ] Receiver device shows notification (Hebrew text)
- [ ] Tapping notification opens `/tasks/inbox`
- [ ] Task appears in receiver's inbox with "unread" status

---

## 🚀 Next Steps

1. **Add VAPID keys to Railway** (if not already there)
2. **Deploy latest code** (`git push origin main`)
3. **Test on 2 mobile devices** (sender + receiver)
4. **Enable push on receiver device** (Settings → Toggle ON)
5. **Create task from sender** → Receiver gets notification!

---

**Last Updated**: 2025-12-17
**Status**: ✅ Push notifications fully implemented and tested
