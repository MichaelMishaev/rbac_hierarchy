/**
 * Script to check for missing translations
 *
 * This script scans all components for translation keys (t('key') or t('section.key'))
 * and verifies that they exist in both he.json and en.json files.
 *
 * Run: npx tsx scripts/check-missing-translations.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Load translation files
const heTranslations = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../messages/he.json'), 'utf-8')
);
const enTranslations = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../messages/en.json'), 'utf-8')
);

// Track all translation keys used in components
const usedKeys = new Set<string>();
const missingKeys = {
  he: new Set<string>(),
  en: new Set<string>(),
};

// Function to extract translation keys from a file
function extractTranslationKeys(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const keys: string[] = [];

  // Match patterns: t('key'), t("key"), t(`key`)
  const regex = /\bt\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    keys.push(match[1]);
  }

  return keys;
}

// Function to check if a key exists in translations
function checkKeyExists(key: string, translations: any, section?: string): boolean {
  // If no section provided, try to infer from file context
  if (!section && key.includes('.')) {
    const [sec, ...rest] = key.split('.');
    return checkKeyExists(rest.join('.'), translations, sec);
  }

  if (section) {
    return translations[section] && translations[section][key] !== undefined;
  }

  // Check all sections
  for (const sec of Object.keys(translations)) {
    if (translations[sec][key] !== undefined) {
      return true;
    }
  }

  return false;
}

// Function to get context section from file path
function getSectionFromPath(filePath: string): string | undefined {
  if (filePath.includes('/activists/')) return 'workers';
  if (filePath.includes('/users/')) return 'users';
  if (filePath.includes('/cities/')) return 'citys';
  if (filePath.includes('/neighborhoods/')) return 'sites';
  if (filePath.includes('/areas/')) return 'areas';
  if (filePath.includes('/dashboard/')) return 'dashboard';
  if (filePath.includes('/invitations/')) return 'invitations';
  if (filePath.includes('/tasks/')) return 'tasks';
  return undefined;
}

// Recursively scan directory for component files
function scanDirectory(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const keys = extractTranslationKeys(filePath);
      const section = getSectionFromPath(filePath);

      for (const key of keys) {
        usedKeys.add(key);

        // Check if key exists in Hebrew translations
        if (!checkKeyExists(key, heTranslations, section)) {
          missingKeys.he.add(`${section ? section + '.' : ''}${key} (in ${filePath})`);
        }

        // Check if key exists in English translations
        if (!checkKeyExists(key, enTranslations, section)) {
          missingKeys.en.add(`${section ? section + '.' : ''}${key} (in ${filePath})`);
        }
      }
    }
  }
}

// Main execution
console.log('🔍 Scanning for missing translations...\n');

// Scan components and pages
const appDir = path.join(__dirname, '../app');
scanDirectory(appDir);

console.log(`✅ Found ${usedKeys.size} unique translation keys in use\n`);

// Report missing translations
if (missingKeys.he.size > 0) {
  console.log('❌ Missing Hebrew translations:');
  missingKeys.he.forEach((key) => console.log(`   - ${key}`));
  console.log('');
}

if (missingKeys.en.size > 0) {
  console.log('❌ Missing English translations:');
  missingKeys.en.forEach((key) => console.log(`   - ${key}`));
  console.log('');
}

if (missingKeys.he.size === 0 && missingKeys.en.size === 0) {
  console.log('✅ All translation keys are present in both languages!\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  Found ${missingKeys.he.size} missing Hebrew and ${missingKeys.en.size} missing English translations\n`);
  console.log('💡 Add these keys to messages/he.json and messages/en.json\n');
  process.exit(1);
}
