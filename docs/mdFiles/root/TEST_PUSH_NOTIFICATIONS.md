# Push Notifications Test Guide - Quick Start

## ⚡ 5-Minute Test

### Prerequisites
- ✅ Railway production deployed (https://app.rbac.shop)
- ✅ VAPID keys configured (already done!)
- ✅ 2 mobile devices OR 1 mobile + 1 desktop

---

## Test Steps

### Step 1: Receiver Device (Mobile)
1. Open https://app.rbac.shop on mobile browser (Safari/Chrome)
2. Login with any user account
3. Tap Settings icon (⚙️) in navigation bar
4. Find "התראות דחיפה" (Push Notifications) section
5. Toggle the switch to **ON** (green)
6. Browser will prompt: "Allow notifications?" → Tap **Allow**
7. Should see: ✅ "ההרשמה להתראות הצליחה!" (Subscription successful)
8. **Keep this device/tab open** (or lock screen - notifications work even when locked)

### Step 2: Sender Device (Mobile/Desktop)
1. Open https://app.rbac.shop in different browser/device
2. Login as SuperAdmin, Area Manager, or City Coordinator
3. Go to **Tasks** page (📋 icon in navbar)
4. Click **"+ משימה חדשה"** (New Task)
5. Fill form:
   - **תיאור משימה** (Task body): "בדיקת התראות - טסט" (min 10 chars)
   - **תאריך ביצוע** (Execution date): Tomorrow
   - **שלח אל** (Send to): Choose "נבחרים ספציפיים" (Selected recipients)
   - **נמענים** (Recipients): Select the receiver user from Step 1
6. Click **"שלח משימה"** (Send Task)
7. Wait 2-3 seconds...

### Step 3: Verify Notification
**On Receiver Device:**
- 🔔 Push notification should appear!
- **Title**: "משימה חדשה" (New Task)
- **Body**: Shows sender name, date, and task preview
- **Actions**: "פתח" (Open) / "סגור" (Close)

**Tap notification** → Should open app at `/tasks/inbox` with new task

---

## ✅ Success Criteria

- [ ] Receiver enabled push notifications in Settings (green toggle)
- [ ] Sender created task with receiver as recipient
- [ ] Receiver's mobile showed push notification within 3 seconds
- [ ] Notification displays Hebrew text (RTL)
- [ ] Tapping notification opens `/tasks/inbox`
- [ ] Task appears in inbox with "unread" badge

---

## 🔍 Debugging

### If No Notification Appears

#### Check 1: Railway Logs
Go to Railway dashboard → Logs, search for:
```
[Push Send] Sending to
[Task Created] Sent X push notifications
```

**If you see**: ❌ `VAPID keys not configured`
- **Solution**: VAPID keys are configured (verified above), redeploy app

**If you see**: ✅ `Sent 1/1 notifications`
- Push was sent successfully, check receiver device settings

#### Check 2: Receiver Device Settings
**iOS (Safari):**
- Settings → Safari → [Your Site] → Notifications → Check "Allow"
- Notification Center → Check "Campaign" app

**Android (Chrome):**
- Settings → Apps → Chrome → Notifications → Check enabled
- Site Settings → Notifications → Check app.rbac.shop is allowed

#### Check 3: Browser Console (Receiver Device)
Open DevTools → Console, look for:
```
[Push] Subscribed to push notifications
[Push] Subscription saved to backend
```

**If you see**: ❌ `Failed to subscribe`
- Check notification permission: Settings → Site Settings
- Try toggle OFF then ON again

#### Check 4: Database Check
In Railway Postgres, run:
```sql
-- Check if receiver is subscribed
SELECT id, user_id, endpoint, created_at, last_used_at
FROM push_subscriptions
WHERE user_id = '[receiver_user_id]'
ORDER BY created_at DESC;
```

Should return at least 1 row with recent `created_at`.

**If empty:**
- Receiver hasn't enabled push notifications in Settings
- Ask receiver to toggle push notifications ON

---

## 🧪 Advanced Testing

### Test 1: Multiple Devices
Enable push on 2+ devices for same user → All devices should receive notification

### Test 2: Background/Locked
Lock receiver's phone → Notification should still appear on lock screen

### Test 3: Notification Click
Tap notification → Should open app at `/tasks/inbox` with task visible

### Test 4: "Broadcast to All"
Create task with "כולם תחתיי" (Send to all) → All users under sender get notification

### Test 5: Expired Subscription
Wait 31 days without using → Subscription auto-deleted (last_used_at > 30 days)

---

## 📱 Platform Notes

### iOS (Safari)
- ⚠️ **Must add to Home Screen first** (PWA install)
- Push permission only appears **after** PWA install
- Notifications show in iOS Notification Center
- Works on iOS 16.4+

### Android (Chrome)
- ✅ No PWA install required
- Push permission appears directly
- Notifications show in Android notification shade
- Works on all recent Android versions

### Desktop
- ✅ Chrome, Edge, Firefox support push
- Notifications show in OS notification center
- Safari 16+ required for macOS

---

## 📊 Expected Logs (Success)

**Railway Logs (after creating task):**
```
[Push Send] Sending to 1 user(s)
[Push Send] Sending to 1 device(s) for user abc-123-def
[Push Send] Sent 1/1 notifications to user abc-123-def
[Task Created] Sent 1 push notifications for task 42
```

**Browser Console (receiver, when toggling ON):**
```
[Push] Service worker registered successfully
[Push] Subscribed to push notifications: PushSubscription {...}
[Push] Subscription saved to backend
```

**Browser Console (receiver, when notification arrives):**
```
[Service Worker] Push notification received
[Service Worker] Showing notification: משימה חדשה
```

---

## 🎯 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "התראות דחיפה לא נתמכות בדפדפן זה" | Use Safari (iOS) or Chrome (Android) |
| "הרשאות נדחו" | Settings → Site Settings → Reset permissions |
| Toggle stays OFF | Check browser supports push (iOS 16.4+) |
| No notification appears | Check Do Not Disturb / Focus mode |
| Notification in wrong language | Hebrew is hardcoded, check code |
| "VAPID keys not configured" | Already configured, redeploy app |

---

## ✅ Test Results Template

Copy this and fill in your test results:

```
## Push Notification Test Results
Date: 2025-12-17
Tester: [Your Name]

### Configuration
- [x] VAPID keys in Railway
- [x] Service Worker registered
- [x] PWA icons updated

### Receiver Setup
- Device: [iOS/Android]
- Browser: [Safari/Chrome]
- User: [email/id]
- Push enabled: [Yes/No]
- Subscription in DB: [Yes/No]

### Sender Setup
- Device: [Mobile/Desktop]
- User: [email/id]
- Role: [SuperAdmin/AreaManager/CityCoordinator]

### Test Execution
- Task created: [Yes/No]
- Server logs show push sent: [Yes/No]
- Notification received: [Yes/No]
- Time delay: [X seconds]
- Notification clicked: [Yes/No]
- Inbox opened: [Yes/No]

### Issues Found
[None / List issues here]

### Notes
[Any additional observations]
```

---

## 📞 Need Help?

If push notifications still don't work after following this guide:
1. Share Railway logs (filter for "Push")
2. Share browser console logs (receiver device)
3. Share database query result (push_subscriptions)
4. Specify device/browser/OS versions

---

**Last Updated**: 2025-12-17
**Status**: ✅ Ready for testing
