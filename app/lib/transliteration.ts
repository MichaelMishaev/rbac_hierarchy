/**
 * Hebrew to Latin transliteration utility
 * Converts Hebrew city names to URL-safe, database-friendly codes
 *
 * Based on Israeli standard transliteration rules
 */

// Character-by-character transliteration map
const hebrewLetterMap: Record<string, string> = {
  'א': 'a',
  'ב': 'b',
  'ג': 'g',
  'ד': 'd',
  'ה': 'h',
  'ו': 'v',
  'ז': 'z',
  'ח': 'ch',
  'ט': 't',
  'י': 'y',
  'כ': 'k',
  'ך': 'kh',
  'ל': 'l',
  'ם': 'm',
  'מ': 'm',
  'ן': 'n',
  'נ': 'n',
  'ס': 's',
  'ע': '',
  'פ': 'p',
  'ף': 'f',
  'צ': 'tz',
  'ץ': 'tz',
  'ק': 'k',
  'ר': 'r',
  'ש': 'sh',
  'ת': 't',
};

// Official city name mappings (use these when exact match found)
// Based on official Israeli municipality English names
const cityNameMap: Record<string, string> = {
  'אום אל-פחם': 'umm-al-fahm',
  'אופקים': 'ofakim',
  'אור יהודה': 'or-yehuda',
  'אור עקיבא': 'or-akiva',
  'אילת': 'eilat',
  'אלעד': 'elad',
  'אריאל': 'ariel',
  'אשדוד': 'ashdod',
  'אשקלון': 'ashkelon',
  'באקה אל-גרבייה': 'baqa-al-gharbiyye',
  'באר יעקב': 'beer-yaakov',
  'באר שבע': 'beer-sheva',
  'בית שאן': 'beit-shean',
  'בית שמש': 'beit-shemesh',
  'ביתר עילית': 'beitar-illit',
  'בני ברק': 'bnei-brak',
  'בת ים': 'bat-yam',
  'גבעת שמואל': 'givat-shmuel',
  'גבעתיים': 'givatayim',
  'גני תקווה': 'ganei-tikva',
  'דימונה': 'dimona',
  'הוד השרון': 'hod-hasharon',
  'הרצליה': 'herzliya',
  'חדרה': 'hadera',
  'חולון': 'holon',
  'חיפה': 'haifa',
  'חריש': 'harish',
  'טבריה': 'tiberias',
  'טייבה': 'tayibe',
  'טירה': 'tira',
  'טירת כרמל': 'tirat-carmel',
  'טמרה': 'tamra',
  'יבנה': 'yavne',
  'יהוד-מונוסון': 'yehud-monosson',
  'יקנעם עילית': 'yokneam-illit',
  'ירושלים': 'jerusalem',
  'כפר יונה': 'kfar-yona',
  'כפר סבא': 'kfar-saba',
  'כפר קאסם': 'kafr-qasim',
  'כפר קרע': 'kafr-qara',
  'כרמיאל': 'karmiel',
  'לוד': 'lod',
  'מגדל העמק': 'migdal-haemek',
  'מודיעין-מכבים-רעות': 'modiin-maccabim-reut',
  'מודיעין עילית': 'modiin-illit',
  'מע\'אר': 'majd-al-krum',
  'מעלה אדומים': 'maaleh-adumim',
  'מעלות-תרשיחא': 'maalot-tarshiha',
  'נהריה': 'nahariya',
  'נוף הגליל': 'nof-hagalil',
  'נס ציונה': 'nes-ziona',
  'נצרת': 'nazareth',
  'נשר': 'nesher',
  'נתיבות': 'netivot',
  'נתניה': 'netanya',
  'סח\'נין': 'sakhnin',
  'עכו': 'acre',
  'עפולה': 'afula',
  'עראבה': 'arraba',
  'ערד': 'arad',
  'פתח תקווה': 'petah-tikva',
  'צפת': 'tzfat',
  'קלנסווה': 'qalansawe',
  'קריית אונו': 'kiryat-ono',
  'קריית אתא': 'kiryat-ata',
  'קריית ביאליק': 'kiryat-bialik',
  'קריית גת': 'kiryat-gat',
  'קריית ים': 'kiryat-yam',
  'קריית מוצקין': 'kiryat-motzkin',
  'קריית מלאכי': 'kiryat-malakhi',
  'קריית שמונה': 'kiryat-shmona',
  'ראש העין': 'rosh-haayin',
  'ראשון לציון': 'rishon-letzion',
  'רהט': 'rahat',
  'רחובות': 'rehovot',
  'רמלה': 'ramla',
  'רמת גן': 'ramat-gan',
  'רמת השרון': 'ramat-hasharon',
  'רעננה': 'raanana',
  'שדרות': 'sderot',
  'שפרעם': 'shfaram',
  'תל אביב-יפו': 'tel-aviv-yafo',
  'תל אביב': 'tel-aviv',
};

/**
 * Transliterate Hebrew text to Latin characters
 * @param text Hebrew text to transliterate
 * @returns Transliterated text in Latin characters
 */
export function transliterateHebrew(text: string): string {
  if (!text) return '';

  const trimmedText = text.trim();

  // Check if it's already in Latin characters
  if (!/[\u0590-\u05FF]/.test(trimmedText)) {
    // Already Latin, just clean it up
    return trimmedText
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Check for exact city name matches first (official English names)
  const exactMatch = cityNameMap[trimmedText];
  if (exactMatch) {
    return exactMatch;
  }

  // Character-by-character transliteration
  let result = '';
  for (const char of trimmedText) {
    const transliterated = hebrewLetterMap[char];
    if (transliterated !== undefined) {
      result += transliterated;
    } else if (/[a-zA-Z0-9]/.test(char)) {
      // Keep existing Latin characters and numbers
      result += char.toLowerCase();
    } else if (char === ' ' || char === '-') {
      result += '-';
    } else if (char === '\'') {
      // Keep apostrophes for names like "מע'אר"
      result += '';
    }
    // Ignore other characters (punctuation, etc.)
  }

  // Clean up the result
  return result
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * Generate a unique city code from a city name
 * @param cityName City name in Hebrew or English
 * @param existingCodes Array of existing codes to avoid duplicates
 * @returns Unique city code
 */
export function generateCityCode(cityName: string, existingCodes: string[] = []): string {
  if (!cityName) return '';

  // Transliterate and create base code
  const baseCode = transliterateHebrew(cityName);

  // If code doesn't exist, return it
  if (!existingCodes.includes(baseCode)) {
    return baseCode;
  }

  // If code exists, append a number
  let counter = 1;
  let uniqueCode = `${baseCode}-${counter}`;
  while (existingCodes.includes(uniqueCode)) {
    counter++;
    uniqueCode = `${baseCode}-${counter}`;
  }

  return uniqueCode;
}

/**
 * Validate if a code is in proper format (Latin characters, lowercase, hyphens)
 * @param code Code to validate
 * @returns True if valid, false otherwise
 */
export function isValidCityCode(code: string): boolean {
  if (!code) return false;
  return /^[a-z0-9-]+$/.test(code) && !/^-|-$/.test(code) && !/-{2,}/.test(code);
}
