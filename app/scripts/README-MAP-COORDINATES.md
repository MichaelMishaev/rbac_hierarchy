# Map Coordinates System - Quick Reference

## ✅ Implementation Complete

All Israeli areas (regions) and cities now have geographic coordinates for map display at `/map`.

---

## 📊 What Was Added

### Database Schema Updates
- **`City` model**: Added `centerLatitude` and `centerLongitude` (Float, nullable)
- **`AreaManager` model**: Added `centerLatitude` and `centerLongitude` (Float, nullable)

### Seed Data
- **7 Israeli Districts/Regions** with coordinates
- **65+ Major Israeli Cities** with accurate city center coordinates

---

## 🗺️ Israeli Regions (Districts)

| Region Code | Hebrew Name | Coordinates |
|-------------|-------------|-------------|
| `IL-CENTER` | מחוז המרכז | 32.0879, 34.8906 |
| `IL-HAIFA` | מחוז חיפה | 32.7940, 34.9896 |
| `IL-NORTH` | מחוז הצפון | 32.9566, 35.5322 |
| `IL-JERUSALEM` | מחוז ירושלים | 31.7683, 35.2137 |
| `IL-SOUTH` | מחוז הדרום | 31.2518, 34.7913 |
| `IL-TELAV` | מחוז תל אביב | 32.0853, 34.7818 |
| `IL-JUDEA-SAMARIA` | יהודה ושומרון | 32.0, 35.3 |

---

## 🏙️ Major Cities (Examples)

| City | Code | Region | Lat, Lng |
|------|------|--------|----------|
| תל אביב-יפו | TLV | IL-TELAV | 32.0853, 34.7818 |
| ירושלים | JRS | IL-JERUSALEM | 31.7683, 35.2137 |
| חיפה | HFA | IL-HAIFA | 32.7940, 34.9896 |
| באר שבע | BS7 | IL-SOUTH | 31.2518, 34.7913 |
| נצרת | NAZ | IL-NORTH | 32.7019, 35.2976 |

*See full list: 65 cities in `scripts/seed-israel-regions-cities.js`*

---

## 🚀 How to Use

### View the Map
```bash
# 1. Make sure dev server is running
cd app && npm run dev

# 2. Open browser
open http://localhost:3200/map
```

### Re-seed Database
```bash
cd app
node scripts/seed-israel-regions-cities.js
```

### Add New City Manually
```javascript
await prisma.city.create({
  data: {
    code: 'NEW',
    name: 'עיר חדשה',
    centerLatitude: 32.0, // Google Maps lat
    centerLongitude: 35.0, // Google Maps lng
    areaManagerId: '<region-uuid>',
    isActive: true,
    settings: {},
  },
});
```

---

## 📍 How Coordinates Work

### Priority Order (API Logic)

1. **Database Coordinates** (preferred) → from `centerLatitude`/`centerLongitude`
2. **Geocoding API** (fallback) → Google Maps Geocoding API
3. **Hardcoded Fallbacks** (last resort) → in `lib/geocoding.ts`

### Map Markers

The `/map` page displays:
- **📍 Purple pins** → Neighborhoods (from `neighborhoods.latitude/longitude`)
- **🏛️ Green pins** → Cities (from `cities.centerLatitude/centerLongitude`)
- **👥 Orange pins** → Activist Coordinators (positioned at their neighborhoods)
- **🌍 Blue pins** → Area Managers (from `area_managers.centerLatitude/centerLongitude`)

---

## 🔧 How to Find Coordinates

### Method 1: Google Maps (Recommended)
1. Search city name in Google Maps
2. Right-click city center → "What's here?"
3. Copy coordinates (e.g., `32.0853, 34.7818`)

### Method 2: GPS Coordinates Website
- Visit: https://latitudelongitude.org/il/
- Search city name
- Copy decimal coordinates

---

## 📂 Files Modified

### Schema
- `app/prisma/schema.prisma` - Added `centerLatitude`/`centerLongitude` to City and AreaManager

### API
- `app/app/api/map-data/route.ts` - Updated to prioritize database coordinates

### Seeds
- `app/scripts/seed-israel-regions-cities.js` - All Israeli regions and cities

### Map Component
- No changes needed! `LeafletMap.tsx` already supports entity coordinates

---

## 💡 Tips

### Adding New Neighborhoods
Neighborhoods already support coordinates:
```sql
UPDATE neighborhoods
SET latitude = 32.0853, longitude = 34.7818
WHERE id = '<neighborhood-uuid>';
```

### Updating City Coordinates
```sql
UPDATE cities
SET center_latitude = 32.0853, center_longitude = 34.7818
WHERE code = 'TLV';
```

### Testing
```bash
# Open map
open http://localhost:3200/map

# Check browser console for:
# "[Map API] Using database coordinates for city..."
```

---

## 🎯 Next Steps (Optional)

1. **Add neighborhood coordinates** - Most neighborhoods don't have GPS yet
2. **Auto-geocode on city creation** - Add webhook to geocode when creating city
3. **Admin UI for coordinates** - Let admins set coordinates via UI instead of SQL

---

## ❓ FAQ

**Q: Can I delete a region?**
A: No! Cities depend on regions. Set `isActive = false` instead.

**Q: What if coordinates are missing?**
A: API falls back to geocoding, then hardcoded city centers.

**Q: Can I use this for other countries?**
A: Yes! Just add new region codes (e.g., `US-WEST`) and cities with coordinates.

---

**✅ Implementation Complete - Ready to Use!**
