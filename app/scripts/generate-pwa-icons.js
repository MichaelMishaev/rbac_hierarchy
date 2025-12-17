/**
 * Generate PWA icons using canvas
 * Requires: canvas package (already in dependencies for html2canvas)
 */

const fs = require('fs');
const path = require('path');

// Try to use canvas if available, otherwise provide instructions
try {
  const { createCanvas } = require('canvas');
  
  function createIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background - brand color #6161FF
    ctx.fillStyle = '#6161FF';
    ctx.fillRect(0, 0, size, size);
    
    // Add rounded corners effect
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    const radius = size * 0.2;
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
    
    // White circle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(size/2, size/2, size*0.35, 0, 2 * Math.PI);
    ctx.fill();
    
    // Hebrew letter ק (Qof) - for קמפיין (Campaign)
    ctx.fillStyle = '#6161FF';
    ctx.font = `bold ${size*0.45}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ק', size/2, size/2 + size*0.02);
    
    return canvas;
  }
  
  // Generate icons
  const publicDir = path.join(__dirname, '..', 'public');
  
  // 192x192
  const canvas192 = createIcon(192);
  const buffer192 = canvas192.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), buffer192);
  console.log('✅ Generated icon-192x192.png');
  
  // 512x512
  const canvas512 = createIcon(512);
  const buffer512 = canvas512.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), buffer512);
  console.log('✅ Generated icon-512x512.png');
  
  console.log('\n🎉 PWA icons generated successfully!');
  
} catch (error) {
  console.error('❌ canvas package not available');
  console.log('\nPlease generate icons manually:');
  console.log('1. Visit https://www.pwabuilder.com/imageGenerator');
  console.log('2. Upload a 512x512 icon with your logo');
  console.log('3. Download the generated icons');
  console.log('4. Replace icon-192x192.png and icon-512x512.png in app/public/');
  console.log('\nOr install canvas package: npm install canvas');
  process.exit(1);
}
