#!/usr/bin/env node
/**
 * Generate Voter Template Excel File
 * Creates a sample Excel file with proper Hebrew headers and example data
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Sample data matching the expected format
const sampleData = [
  {
    'שם': 'דוד',
    'שם משפחה': 'כהן',
    'טלפון': '050-1234567',
    'עיר': 'תל אביב',
    'מייל': 'david.cohen@example.com'
  },
  {
    'שם': 'שרה',
    'שם משפחה': 'לוי',
    'טלפון': '052-9876543',
    'עיר': 'ירושלים',
    'מייל': 'sarah.levi@example.com'
  },
  {
    'שם': 'משה',
    'שם משפחה': 'אברהם',
    'טלפון': '054-5555555',
    'עיר': 'חיפה',
    'מייל': 'moshe.avraham@example.com'
  }
];

// Create workbook
const workbook = XLSX.utils.book_new();

// Create worksheet from data
const worksheet = XLSX.utils.json_to_sheet(sampleData);

// Set column widths for better readability
worksheet['!cols'] = [
  { wch: 15 }, // שם
  { wch: 15 }, // שם משפחה
  { wch: 15 }, // טלפון
  { wch: 15 }, // עיר
  { wch: 30 }  // מייל
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'רשימת בוחרים');

// Output path
const outputPath = path.join(__dirname, '..', 'public', 'samples', 'voter-template.xlsx');

// Ensure directory exists
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Write file
XLSX.writeFile(workbook, outputPath);

console.log('✅ Voter template created successfully at:', outputPath);
console.log('📊 Sample contains', sampleData.length, 'rows');
console.log('📝 Columns: שם, שם משפחה, טלפון, עיר, מייל');
