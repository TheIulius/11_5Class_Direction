/**
 * Asia/Tbilisi Date and Time Utilities for Komarovi 11/5 Platform
 * Enforces school timezone consistently across client and server.
 */

export const TBILISI_TIMEZONE = 'Asia/Tbilisi';

export interface TbilisiDateInfo {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  weekday: number; // 1 = Monday, 7 = Sunday (ISO standard)
  hour: number; // 0-23
  minute: number; // 0-59
  second: number; // 0-59
  dateString: string; // "YYYY-MM-DD"
  weekdayGeorgian: string;
  monthGeorgian: string;
  formattedDisplay: string; // e.g. "9 ნოემბერი, ორშაბათი"
}

const GEORGIAN_WEEKDAYS = [
  'კვირა', // 0
  'ორშაბათი', // 1
  'სამშაბათი', // 2
  'ოთხშაბათი', // 3
  'ხუთშაბათი', // 4
  'პარასკევი', // 5
  'შაბათი', // 6
];

const GEORGIAN_MONTHS = [
  'იანვარი',
  'თებერვალი',
  'მარტი',
  'აპრილი',
  'მაისი',
  'ივნისი',
  'ივლისი',
  'აგვისტო',
  'სექტემბერი',
  'ოქტომბერი',
  'ნოემბერი',
  'დეკემბერი',
];

const GEORGIAN_MONTHS_GENITIVE = [
  'იანვარს',
  'თებერვალს',
  'მარტს',
  'აპრილს',
  'მაისს',
  'ივნისს',
  'ივლისს',
  'აგვისტოს',
  'სექტემბერს',
  'ოქტომბერს',
  'ნოემბერს',
  'დეკემბერს',
];

/**
 * Get the current time and date in Asia/Tbilisi timezone.
 */
export function getTbilisiNow(): TbilisiDateInfo {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TBILISI_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  let year = 2026;
  let month = 11;
  let day = 9;
  let hour = 12;
  let minute = 0;
  let second = 0;
  let weekdayStr = 'Mon';

  for (const part of parts) {
    if (part.type === 'year') year = parseInt(part.value, 10);
    else if (part.type === 'month') month = parseInt(part.value, 10);
    else if (part.type === 'day') day = parseInt(part.value, 10);
    else if (part.type === 'hour') hour = parseInt(part.value, 10);
    else if (part.type === 'minute') minute = parseInt(part.value, 10);
    else if (part.type === 'second') second = parseInt(part.value, 10);
    else if (part.type === 'weekday') weekdayStr = part.value;
  }

  // ISO weekday: Monday = 1 ... Sunday = 7
  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  const weekday = weekdayMap[weekdayStr] || 1;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const dateString = `${year}-${pad(month)}-${pad(day)}`;

  const geoWeekdayIndex = weekday === 7 ? 0 : weekday;
  const weekdayGeorgian = GEORGIAN_WEEKDAYS[geoWeekdayIndex] || 'ორშაბათი';
  const monthGeorgian = GEORGIAN_MONTHS[month - 1] || 'ნოემბერი';

  const formattedDisplay = `${day} ${monthGeorgian}, ${weekdayGeorgian}`;

  return {
    year,
    month,
    day,
    weekday,
    hour,
    minute,
    second,
    dateString,
    weekdayGeorgian,
    monthGeorgian,
    formattedDisplay,
  };
}

/**
 * Get today's "YYYY-MM-DD" string in Tbilisi timezone.
 */
export function getTbilisiTodayString(): string {
  return getTbilisiNow().dateString;
}

/**
 * Safely parse a date-only "YYYY-MM-DD" string into year, month (1-12), and day
 * without any UTC midnight offset issues.
 */
export function parseDateOnly(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const match = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    day: parseInt(match[3], 10),
  };
}

/**
 * Compare two "YYYY-MM-DD" strings: returns negative if a < b, 0 if equal, positive if a > b.
 */
export function compareDateStrings(a: string, b: string): number {
  return a.localeCompare(b);
}

/**
 * Format a "YYYY-MM-DD" string into Georgian display format (e.g. "9 ნოემბერი" or "2026 წლის 9 ნოემბერი").
 */
export function formatGeorgianDate(dateStr: string, includeYear = false): string {
  const parsed = parseDateOnly(dateStr);
  if (!parsed) return dateStr;
  const monthName = GEORGIAN_MONTHS[parsed.month - 1] || '';
  if (includeYear) {
    return `${parsed.year} წლის ${parsed.day} ${monthName}`;
  }
  return `${parsed.day} ${monthName}`;
}

/**
 * Standard School Lesson Periods at Komarovi:
 * Period 1: 08:30 - 09:15
 * Period 2: 09:20 - 10:05
 * Period 3: 10:10 - 10:55
 * Period 4: 11:20 - 12:05 (big break between period 3 and 4)
 * Period 5: 12:10 - 12:55
 * Period 6: 13:05 - 13:50
 * Period 7: 13:55 - 14:40
 */
export interface LessonPeriodTime {
  period: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  timeRange: string;
}

export const LESSON_PERIOD_TIMES: LessonPeriodTime[] = [
  { period: 1, startHour: 8, startMinute: 30, endHour: 9, endMinute: 15, timeRange: '8:30 – 9:15' },
  { period: 2, startHour: 9, startMinute: 20, endHour: 10, endMinute: 5, timeRange: '9:20 – 10:05' },
  { period: 3, startHour: 10, startMinute: 10, endHour: 10, endMinute: 55, timeRange: '10:10 – 10:55' },
  { period: 4, startHour: 11, startMinute: 20, endHour: 12, endMinute: 5, timeRange: '11:20 – 12:05' },
  { period: 5, startHour: 12, startMinute: 10, endHour: 12, endMinute: 55, timeRange: '12:10 – 12:55' },
  { period: 6, startHour: 13, startMinute: 5, endHour: 13, endMinute: 50, timeRange: '13:05 – 13:50' },
  { period: 7, startHour: 13, startMinute: 55, endHour: 14, endMinute: 40, timeRange: '13:55 – 14:40' },
];

/**
 * Determine which period is currently active in Tbilisi right now.
 * Returns null if it's weekend, before school, or after school.
 */
export function getCurrentActivePeriod(): number | null {
  const now = getTbilisiNow();
  // Only Monday to Friday (1-5)
  if (now.weekday < 1 || now.weekday > 5) return null;

  const currentMinutes = now.hour * 60 + now.minute;
  for (const p of LESSON_PERIOD_TIMES) {
    const start = p.startHour * 60 + p.startMinute;
    const end = p.endHour * 60 + p.endMinute;
    if (currentMinutes >= start && currentMinutes <= end) {
      return p.period;
    }
  }
  return null;
}
