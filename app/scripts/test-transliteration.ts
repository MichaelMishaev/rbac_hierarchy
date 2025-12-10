/**
 * Quick test script for Hebrew transliteration
 * Run: npx tsx scripts/test-transliteration.ts
 */

import { generateCityCode, transliterateHebrew } from '../lib/transliteration';

// Test cases
const testCities = [
  'תל אביב-יפו',
  'ירושלים',
  'חיפה',
  'באר שבע',
  'ראשון לציון',
  'פתח תקווה',
  'אשדוד',
  'נתניה',
  'בני ברק',
  'רמת גן',
  'באר יעקב',
  'גני תקווה',
  'חריש',
  'כפר קרע',
  'מע\'אר',
];

console.log('🧪 Testing Hebrew to Latin transliteration\n');
console.log('City Name (Hebrew) → Transliterated Code\n');
console.log('═'.repeat(60));

testCities.forEach(city => {
  const code = generateCityCode(city);
  console.log(`${city.padEnd(25)} → ${code}`);
});

console.log('═'.repeat(60));
console.log('\n✅ All tests completed!');
console.log('\n📝 Notes:');
console.log('- Codes are in lowercase Latin characters');
console.log('- Spaces become hyphens');
console.log('- Hebrew characters are transliterated');
console.log('- Codes are URL-safe and database-optimized');
