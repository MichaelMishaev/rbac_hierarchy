# 🚀 Mobile Testing - Quick Start Guide

## ⚡ 30-Second Start

```bash
cd app

# Run all mobile tests
npm run test:mobile

# Or use UI mode (recommended)
npm run test:mobile:ui
```

---

## 📱 Common Commands

```bash
# Test all mobile devices
npm run test:mobile

# Test specific suite
npm run test:mobile:breakpoints    # Responsive breakpoints
npm run test:mobile:visual         # Visual regression
npm run test:mobile:specific       # Mobile features

# Test single device
npm run test:mobile:iphone         # iPhone 14
npm run test:mobile:pixel          # Pixel 7
npm run test:mobile:ipad           # iPad Air

# Visual debugging
npm run test:mobile:ui             # Best for debugging

# Update visual baselines (after UI changes)
npm run test:mobile:update-snapshots
```

---

## 🎯 What Gets Tested?

### ✅ 8 Device Configurations
- iPhone 14 (390x844)
- iPhone 14 Pro Max (430x932)
- iPhone 14 Landscape (844x390)
- Pixel 7 (412x915)
- Samsung Galaxy S9+ (412x846)
- iPad (gen 7) (768x1024)
- iPad Pro 11 (834x1194)
- Desktop Chrome (1920x1080)

### ✅ 3 Test Suites (100% Free)

#### 1. Breakpoint Testing
- Mobile (< 600px)
- Small Tablet (600-900px)
- Tablet (900-1200px)
- Desktop (1200-1536px)
- Large Desktop (> 1536px)

#### 2. Visual Regression
- Automated screenshot comparison
- Detects unintended UI changes
- Covers all pages and components

#### 3. Mobile-Specific
- Touch interactions
- Orientation changes
- Mobile keyboards
- Gestures (swipe, tap)
- Form validation

---

## 🐛 Debugging Failed Tests

### Option 1: UI Mode (Best)
```bash
npm run test:mobile:ui
```
- Click through test steps
- See screenshots at each step
- Inspect elements
- Time-travel debugging

### Option 2: Headed Mode
```bash
npm run test:e2e:headed tests/e2e/responsive
```
- Watch tests run in real browser

### Option 3: Debug Mode
```bash
npm run test:e2e:debug tests/e2e/responsive/breakpoints.spec.ts
```
- Step through line by line

---

## 📸 Visual Regression Testing

### First Time Setup
```bash
# Generate baseline screenshots
npm run test:mobile:visual
```

Creates baselines in `tests/e2e/responsive/__screenshots__/`

### Check for Visual Changes
```bash
# Run tests (compares against baselines)
npm run test:mobile:visual
```

### After Intentional UI Changes
```bash
# Update baselines
npm run test:mobile:update-snapshots
```

### Review Diffs
Failed tests save comparison images to `test-results/`:
- `*-actual.png` - Current screenshot
- `*-expected.png` - Baseline
- `*-diff.png` - Pixel differences highlighted

---

## 🎨 Manual Testing (Free Tools)

### Chrome DevTools
1. Open DevTools (F12)
2. Click device icon (Ctrl+Shift+M)
3. Select: iPhone 14, iPad, etc.
4. Toggle portrait/landscape
5. Test touch interactions

### Test on Real Device
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Create tunnel
npx ngrok http 3200

# Open ngrok URL on your phone
```

---

## 📊 Example Test Run

```bash
$ npm run test:mobile

Running 47 tests using 8 workers

  ✓ breakpoints.spec.ts (18 tests) - 45s
    ✓ Mobile layout (390x844) - 2.1s
    ✓ Tablet layout (768x1024) - 1.8s
    ✓ Desktop layout (1920x1080) - 1.5s
    ✓ RTL consistency - 3.2s
    ...

  ✓ visual-regression.spec.ts (15 tests) - 38s
    ✓ Dashboard snapshots - 8 devices - 5.2s
    ✓ Table rendering - 8 devices - 4.8s
    ...

  ✓ mobile-specific.spec.ts (14 tests) - 32s
    ✓ Orientation changes - 2.5s
    ✓ Touch targets (WCAG) - 1.9s
    ...

  47 passed (2.0m)
```

---

## ✅ Pre-Deployment Checklist

Before deploying mobile features:

- [ ] `npm run test:mobile` passes
- [ ] `npm run test:mobile:visual` passes (no unexpected changes)
- [ ] Test on real device via ngrok
- [ ] Check both portrait and landscape
- [ ] Verify Hebrew/RTL rendering
- [ ] Verify touch targets ≥ 48px
- [ ] Test critical user flows on mobile

---

## 🆘 Troubleshooting

### Tests Fail with "Element not found"
→ Element might be hidden on mobile
```typescript
// Check viewport-specific visibility
if (viewport.width < 900) {
  await expect(mobileElement).toBeVisible();
} else {
  await expect(desktopElement).toBeVisible();
}
```

### Visual tests fail with minor pixel diffs
→ Increase tolerance in test:
```typescript
await expect(page).toHaveScreenshot('name.png', {
  maxDiffPixels: 200 // Allow more variance
});
```

### Tests timeout on CI
→ Add more time for slower environments:
```typescript
test.setTimeout(60000); // 60 seconds
```

---

## 📚 Full Documentation

For complete details, see: `tests/e2e/responsive/README.md`

---

## 💡 Tips

1. **Always use UI mode for debugging**
   ```bash
   npm run test:mobile:ui
   ```

2. **Test orientation changes**
   ```typescript
   await page.setViewportSize({ width: 390, height: 844 }); // Portrait
   await page.setViewportSize({ width: 844, height: 390 }); // Landscape
   ```

3. **Update snapshots after UI changes**
   ```bash
   npm run test:mobile:update-snapshots
   ```

4. **Run specific device only**
   ```bash
   npx playwright test --project=mobile-iphone-14 tests/e2e/responsive
   ```

5. **Check test coverage**
   ```bash
   npx playwright test --list tests/e2e/responsive
   ```

---

## 🎉 You're Ready!

Start testing:
```bash
cd app
npm run test:mobile:ui
```

Happy testing! 🚀📱
