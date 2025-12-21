/**
 * Generate Empty Voter Template
 * Creates an Excel template with headers only (no sample data)
 */

import { utils, write } from 'xlsx';
import fs from 'fs';
import path from 'path';

// Template structure (Hebrew RTL)
const headers = ['מייל', 'עיר', 'טלפון', 'שם משפחה', 'שם'];

// Create empty template with headers only
const worksheetData = [headers];

// Create worksheet from data
const worksheet = utils.aoa_to_sheet(worksheetData);

// Set column widths
worksheet['!cols'] = [
  { wch: 30 }, // מייל
  { wch: 15 }, // עיר
  { wch: 15 }, // טלפון
  { wch: 15 }, // שם משפחה
  { wch: 15 }, // שם
];

// Create workbook
const workbook = utils.book_new();
utils.book_append_sheet(workbook, worksheet, 'רשימת בוחרים');

// Write to file
const outputPath = path.join(process.cwd(), 'public', 'samples', 'voter-template.xlsx');
const buffer = write(workbook, { type: 'buffer', bookType: 'xlsx' });
fs.writeFileSync(outputPath, buffer);

console.log('✅ Empty voter template generated successfully at:', outputPath);
