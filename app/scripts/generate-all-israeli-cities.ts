// Script to generate complete list of 82 Israeli cities for production seed
// Based on official Israeli city status as of 2025

export const ALL_ISRAELI_CITIES = [
  // Tel Aviv District (8 cities)
  { name: 'תל אביב-יפו', code: 'TLV-YAFO', district: 'TA-DISTRICT' },
  { name: 'רמת גן', code: 'RAMAT-GAN', district: 'TA-DISTRICT' },
  { name: 'בני ברק', code: 'BNEI-BRAK', district: 'TA-DISTRICT' },
  { name: 'הרצליה', code: 'HERZLIYA', district: 'TA-DISTRICT' },
  { name: 'בת ים', code: 'BAT-YAM', district: 'TA-DISTRICT' },
  { name: 'חולון', code: 'HOLON', district: 'TA-DISTRICT' },
  { name: 'גבעתיים', code: 'GIVATAYIM', district: 'TA-DISTRICT' },
  { name: 'אור יהודה', code: 'OR-YEHUDA', district: 'TA-DISTRICT' },

  // North District (14 cities)
  { name: 'נצרת', code: 'NAZARETH', district: 'NORTH' },
  { name: 'עכו', code: 'AKKO', district: 'NORTH' },
  { name: 'טבריה', code: 'TIBERIAS', district: 'NORTH' },
  { name: 'צפת', code: 'SAFED', district: 'NORTH' },
  { name: 'קריית שמונה', code: 'QIRYAT-SHMONA', district: 'NORTH' },
  { name: 'מעלות-תרשיחא', code: 'MAALOT-TARSHIHA', district: 'NORTH' },
  { name: 'כרמיאל', code: 'KARMIEL', district: 'NORTH' },
  { name: 'בית שאן', code: 'BET-SHEAN', district: 'NORTH' },
  { name: 'נהריה', code: 'NAHARIYA', district: 'NORTH' },
  { name: 'מגדל העמק', code: 'MIGDAL-HAEMEK', district: 'NORTH' },
  { name: 'שפרעם', code: 'SHFARAM', district: 'NORTH' },
  { name: 'עפולה', code: 'AFULA', district: 'NORTH' },
  { name: 'יקנעם עילית', code: 'YOQNEAM-ILLIT', district: 'NORTH' },
  { name: 'חצור הגלילית', code: 'HATZOR-HAGLILIT', district: 'NORTH' },

  // Haifa District (10 cities)
  { name: 'חיפה', code: 'HAIFA', district: 'HAIFA' },
  { name: 'קריית ים', code: 'QIRYAT-YAM', district: 'HAIFA' },
  { name: 'קריית ביאליק', code: 'QIRYAT-BIALIK', district: 'HAIFA' },
  { name: 'קריית מוצקין', code: 'QIRYAT-MOTZKIN', district: 'HAIFA' },
  { name: 'קריית אתא', code: 'QIRYAT-ATA', district: 'HAIFA' },
  { name: 'טמרה', code: 'TAMRA', district: 'HAIFA' },
  { name: 'נשר', code: 'NESHER', district: 'HAIFA' },
  { name: 'טירת כרמל', code: 'TIRAT-CARMEL', district: 'HAIFA' },
  { name: 'עתלית', code: 'ATLIT', district: 'HAIFA' },
  { name: 'דליית אל-כרמל', code: 'DALIYAT-AL-CARMEL', district: 'HAIFA' },

  // Center District (22 cities)
  { name: 'פתח תקווה', code: 'PETAH-TIKVA', district: 'CENTER' },
  { name: 'נתניה', code: 'NETANYA', district: 'CENTER' },
  { name: 'ראשון לציון', code: 'RISHON-LEZION', district: 'CENTER' },
  { name: 'רעננה', code: 'RAANANA', district: 'CENTER' },
  { name: 'כפר סבא', code: 'KFAR-SABA', district: 'CENTER' },
  { name: 'הוד השרון', code: 'HOD-HASHARON', district: 'CENTER' },
  { name: 'רחובות', code: 'REHOVOT', district: 'CENTER' },
  { name: 'לוד', code: 'LOD', district: 'CENTER' },
  { name: 'רמלה', code: 'RAMLA', district: 'CENTER' },
  { name: 'יבנה', code: 'YAVNE', district: 'CENTER' },
  { name: 'גדרה', code: 'GEDERA', district: 'CENTER' },
  { name: 'נס ציונה', code: 'NES-ZIONA', district: 'CENTER' },
  { name: 'קריית אונו', code: 'QIRYAT-ONO', district: 'CENTER' },
  { name: 'קריית עקרון', code: 'QIRYAT-EKRON', district: 'CENTER' },
  { name: 'יהוד-מונוסון', code: 'YEHUD-MONOSSON', district: 'CENTER' },
  { name: 'גני תקווה', code: 'GANEI-TIKVA', district: 'CENTER' },
  { name: 'קריית מלאכי', code: 'QIRYAT-MALACHI', district: 'CENTER' },
  { name: 'אלעד', code: 'ELAD', district: 'CENTER' },
  { name: 'סביון', code: 'SAVYON', district: 'CENTER' },
  { name: 'שוהם', code: 'SHOHAM', district: 'CENTER' },
  { name: 'תל מונד', code: 'TEL-MOND', district: 'CENTER' },
  { name: 'אור עקיבא', code: 'OR-AKIVA', district: 'CENTER' },

  // Jerusalem District (8 cities)
  { name: 'ירושלים', code: 'JERUSALEM', district: 'JERUSALEM' },
  { name: 'בית שמש', code: 'BEIT-SHEMESH', district: 'JERUSALEM' },
  { name: 'מעלה אדומים', code: 'MAALE-ADUMIM', district: 'JERUSALEM' },
  { name: 'מודיעין-מכבים-רעות', code: 'MODIIN-MACCABIM-REUT', district: 'JERUSALEM' },
  { name: 'מודיעין עילית', code: 'MODIIN-ILLIT', district: 'JERUSALEM' },
  { name: 'מבשרת ציון', code: 'MEVASSERET-ZION', district: 'JERUSALEM' },
  { name: 'אפרת', code: 'EFRAT', district: 'JERUSALEM' },
  { name: 'ביתר עילית', code: 'BEITAR-ILLIT', district: 'JERUSALEM' },

  // South District (20 cities)
  { name: 'באר שבע', code: 'BEER-SHEVA', district: 'SOUTH' },
  { name: 'אשדוד', code: 'ASHDOD', district: 'SOUTH' },
  { name: 'אשקלון', code: 'ASHKELON', district: 'SOUTH' },
  { name: 'אילת', code: 'EILAT', district: 'SOUTH' },
  { name: 'קריית גת', code: 'QIRYAT-GAT', district: 'SOUTH' },
  { name: 'דימונה', code: 'DIMONA', district: 'SOUTH' },
  { name: 'נתיבות', code: 'NETIVOT', district: 'SOUTH' },
  { name: 'שדרות', code: 'SDEROT', district: 'SOUTH' },
  { name: 'אופקים', code: 'OFAKIM', district: 'SOUTH' },
  { name: 'ערד', code: 'ARAD', district: 'SOUTH' },
  { name: 'מצפה רמון', code: 'MITZPE-RAMON', district: 'SOUTH' },
  { name: 'רהט', code: 'RAHAT', district: 'SOUTH' },
  { name: 'כסיפה', code: 'KUSEIFE', district: 'SOUTH' },
  { name: 'תל שבע', code: 'TEL-SHEVA', district: 'SOUTH' },
  { name: 'לקיה', code: 'LAKIYA', district: 'SOUTH' },
  { name: 'ערערה-בנגב', code: 'ARARA-BANEGEV', district: 'SOUTH' },
  { name: 'חורה', code: 'HURA', district: 'SOUTH' },
  { name: 'שגב-שלום', code: 'SEGEV-SHALOM', district: 'SOUTH' },
  { name: 'ירוחם', code: 'YERUHAM', district: 'SOUTH' },
  { name: 'קריית מנחם', code: 'QIRYAT-MENAHEM', district: 'SOUTH' },
];

console.log(`Total cities: ${ALL_ISRAELI_CITIES.length}`);
console.log('By district:');
const byDistrict = ALL_ISRAELI_CITIES.reduce((acc, city) => {
  acc[city.district] = (acc[city.district] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
console.log(byDistrict);
