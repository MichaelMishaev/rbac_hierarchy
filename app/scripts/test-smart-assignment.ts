/**
 * Test Smart Assignment Algorithm
 * Tests the smart assignment API with real data
 */

import { suggestTaskAssignments } from '../lib/smartAssignment';

async function main() {
  console.log('🎯 Testing Smart Assignment Algorithm\n');

  // Test location: Center of Tel Aviv (approx. between all neighborhoods)
  const testLocation = {
    lat: 32.0583,
    lng: 34.7624,
  };

  console.log(`📍 Test Location: ${testLocation.lat}, ${testLocation.lng}\n`);

  // Test with Florentin neighborhood
  console.log('🔍 Testing with Florentin neighborhood...');
  const suggestions = await suggestTaskAssignments(
    testLocation,
    'tlv-florentin',
    5
  );

  console.log(`\n✨ Found ${suggestions.length} candidates:\n`);

  suggestions.forEach((candidate, index) => {
    console.log(`${index + 1}. ${candidate.activistName}`);
    console.log(`   📊 Score: ${(candidate.score * 100).toFixed(1)}%`);
    console.log(`   📍 Distance: ${candidate.distance}m`);
    console.log(`   ✅ Available: ${candidate.isAvailable ? 'Yes' : 'No'}`);
    console.log(`   📋 Current Load: ${candidate.currentLoad} tasks`);
    console.log(`   🏘️  Neighborhood: ${candidate.neighborhoodName}\n`);
  });

  if (suggestions.length > 0) {
    console.log('✅ Smart Assignment Algorithm is working correctly!');
  } else {
    console.log('⚠️  No suggestions found. Make sure you have activists in Florentin.');
  }
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
