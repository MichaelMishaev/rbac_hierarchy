/**
 * Natural Language Task Parser (Hebrew)
 *
 * Parses natural language input into structured task data
 *
 * Examples:
 * - "לדפוק דלתות בפלורנטין ביום רביעי בבוקר"
 * - "להתקשר למצביעים לא מחליטים מחר בערב"
 * - "לארגן אירוע בנווה צדק ב-15/12 בשעה 19:00"
 */

import { predictOptimalAssignments } from './smartAssignment';

interface ParsedTask {
  action: string;
  location?: string;
  neighborhoodId?: string;
  date?: Date;
  time?: string;
  priority?: 'low' | 'medium' | 'high';
  taskType: string;
  suggestedActivists?: Array<{
    id: string;
    name: string;
    confidence: number;
  }>;
  confidence: number; // How confident the parser is
}

/**
 * Simple Hebrew NLP parser (regex-based)
 *
 * For production, consider:
 * - OpenAI GPT-4 API for better accuracy
 * - Custom Hebrew NLP model
 * - Google Cloud Natural Language API
 */
export async function parseTaskFromNaturalLanguage(
  input: string,
  cityId: string
): Promise<ParsedTask> {
  const cleanInput = input.trim().toLowerCase();

  // Parse action (what to do)
  const action = extractAction(cleanInput);
  const taskType = inferTaskType(action);

  // Parse location
  const location = extractLocation(cleanInput);

  // Parse date/time
  const date = extractDate(cleanInput);
  const time = extractTime(cleanInput);

  // Parse priority
  const priority = extractPriority(cleanInput);

  // If we have location, get neighborhood ID and suggest activists
  let neighborhoodId: string | undefined;
  let suggestedActivists: ParsedTask['suggestedActivists'];

  if (location) {
    // TODO: Implement neighborhood lookup by name
    // For now, use mock data
    neighborhoodId = 'mock-neighborhood-id';

    // Get smart assignment suggestions
    try {
      const predictions = await predictOptimalAssignments({
        neighborhoodId,
        cityId,
        taskType,
        priority: priority || 'medium'
      }, 3);

      suggestedActivists = predictions.map(p => ({
        id: p.activistId,
        name: p.activistName,
        confidence: p.score
      }));
    } catch (error) {
      console.error('Failed to get activist suggestions:', error);
    }
  }

  // Calculate parsing confidence
  const confidence = calculateConfidence({
    hasAction: !!action,
    hasLocation: !!location,
    hasDate: !!date,
    hasTime: !!time
  });

  return {
    action,
    location,
    neighborhoodId,
    date,
    time,
    priority,
    taskType,
    suggestedActivists,
    confidence
  };
}

/**
 * Extract action from text
 */
function extractAction(text: string): string {
  // Common action verbs in Hebrew
  const actionPatterns = [
    /לדפוק דלתות/,
    /דפיקות דלתות/,
    /להתקשר/,
    /שיחות טלפון/,
    /לארגן אירוע/,
    /לאסוף חתימות/,
    /לחלק עלונים/,
    /לבדוק נוכחות/
  ];

  for (const pattern of actionPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  // Fallback: take first 5 words
  return text.split(' ').slice(0, 5).join(' ');
}

/**
 * Extract location/neighborhood from text
 */
function extractLocation(text: string): string | undefined {
  // Common Tel Aviv neighborhoods
  const neighborhoods = [
    'פלורנטין',
    'נווה צדק',
    'רוטשילד',
    'שכונת התקווה',
    'יפו',
    'צפון תל אביב',
    'דרום תל אביב',
    'מרכז העיר'
  ];

  for (const neighborhood of neighborhoods) {
    if (text.includes(neighborhood.toLowerCase())) {
      return neighborhood;
    }
  }

  // Look for "ב-" prefix (in Hebrew)
  const locationPattern = /ב-?([א-ת\s]+?)(?:\s|$)/;
  const match = text.match(locationPattern);
  if (match) {
    return match[1].trim();
  }

  return undefined;
}

/**
 * Extract date from text
 */
function extractDate(text: string): Date | undefined {
  const now = new Date();

  // Relative dates
  if (text.includes('מחר')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  if (text.includes('היום')) {
    return now;
  }

  // Day of week
  const daysOfWeek = [
    { name: 'ראשון', offset: 0 },
    { name: 'שני', offset: 1 },
    { name: 'שלישי', offset: 2 },
    { name: 'רביעי', offset: 3 },
    { name: 'חמישי', offset: 4 },
    { name: 'שישי', offset: 5 },
    { name: 'שבת', offset: 6 }
  ];

  for (const day of daysOfWeek) {
    if (text.includes(day.name)) {
      const target = new Date(now);
      const currentDay = target.getDay();
      const daysUntil = (day.offset - currentDay + 7) % 7 || 7; // Next occurrence
      target.setDate(target.getDate() + daysUntil);
      return target;
    }
  }

  // Specific date format: DD/MM or DD/MM/YYYY
  const datePattern = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/;
  const match = text.match(datePattern);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1; // JS months are 0-indexed
    const year = match[3] ? parseInt(match[3]) : now.getFullYear();

    return new Date(year, month, day);
  }

  return undefined;
}

/**
 * Extract time from text
 */
function extractTime(text: string): string | undefined {
  // Relative times
  if (text.includes('בבוקר')) return '09:00';
  if (text.includes('בצהריים')) return '12:00';
  if (text.includes('אחר הצהריים')) return '15:00';
  if (text.includes('בערב')) return '18:00';
  if (text.includes('בלילה')) return '21:00';

  // Specific time: HH:MM or "בשעה HH"
  const timePattern = /(?:בשעה\s)?(\d{1,2}):?(\d{2})?/;
  const match = text.match(timePattern);
  if (match) {
    const hours = match[1].padStart(2, '0');
    const minutes = match[2] || '00';
    return `${hours}:${minutes}`;
  }

  return undefined;
}

/**
 * Extract priority from text
 */
function extractPriority(text: string): 'low' | 'medium' | 'high' | undefined {
  if (text.includes('דחוף') || text.includes('חשוב')) return 'high';
  if (text.includes('לא דחוף') || text.includes('נמוך')) return 'low';
  return 'medium';
}

/**
 * Infer task type from action
 */
function inferTaskType(action: string): string {
  const typeMapping: Record<string, string> = {
    'לדפוק דלתות': 'door_knocking',
    'דפיקות דלתות': 'door_knocking',
    'להתקשר': 'phone_banking',
    'שיחות טלפון': 'phone_banking',
    'לארגן אירוע': 'event_setup',
    'לאסוף חתימות': 'signature_collection',
    'לחלק עלונים': 'flyer_distribution',
    'לבדוק נוכחות': 'attendance_check'
  };

  for (const [pattern, type] of Object.entries(typeMapping)) {
    if (action.includes(pattern)) {
      return type;
    }
  }

  return 'general';
}

/**
 * Calculate overall parsing confidence
 */
function calculateConfidence(params: {
  hasAction: boolean;
  hasLocation: boolean;
  hasDate: boolean;
  hasTime: boolean;
}): number {
  let score = 0;

  if (params.hasAction) score += 0.4; // Action is most important
  if (params.hasLocation) score += 0.3;
  if (params.hasDate) score += 0.2;
  if (params.hasTime) score += 0.1;

  return score;
}

/**
 * Format parsed task for display
 */
export function formatParsedTask(parsed: ParsedTask): string {
  let formatted = `🤖 הבנתי:\n\n`;

  formatted += `📋 פעולה: ${parsed.action}\n`;

  if (parsed.location) {
    formatted += `📍 מיקום: ${parsed.location}\n`;
  }

  if (parsed.date) {
    formatted += `📅 תאריך: ${parsed.date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}\n`;
  }

  if (parsed.time) {
    formatted += `⏰ שעה: ${parsed.time}\n`;
  }

  if (parsed.priority) {
    const priorityEmoji = parsed.priority === 'high' ? '🔴' : parsed.priority === 'medium' ? '🟡' : '🟢';
    formatted += `${priorityEmoji} עדיפות: ${parsed.priority}\n`;
  }

  if (parsed.suggestedActivists && parsed.suggestedActivists.length > 0) {
    formatted += `\n👥 פעילים מומלצים:\n`;
    parsed.suggestedActivists.forEach((activist, i) => {
      formatted += `${i + 1}. ${activist.name} (${Math.round(activist.confidence * 100)}%)\n`;
    });
  }

  formatted += `\nרמת ביטחון בניתוח: ${Math.round(parsed.confidence * 100)}%`;

  return formatted;
}
