import { JobCategory } from '../types';

export interface ThaiHoliday {
  date: string; // 'YYYY-MM-DD' or 'MM-DD'
  name: string;
  isSubstitution?: boolean;
}

// Database of Official Thai Public Holidays (covering standard annual dates + substitution days)
export const THAI_PUBLIC_HOLIDAYS_FIXED: Record<string, string> = {
  '01-01': 'วันขึ้นปีใหม่ (New Year\'s Day)',
  '01-02': 'วันหยุดชดเชยวันขึ้นปีใหม่',
  '04-06': 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช และวันที่ระลึกมหาจักรีบรมราชวงศ์ (Chakri Day)',
  '04-13': 'วันสงกรานต์ (Songkran Festival)',
  '04-14': 'วันสงกรานต์ (Songkran Festival)',
  '04-15': 'วันสงกรานต์ (Songkran Festival)',
  '04-16': 'วันหยุดชดเชยวันสงกรานต์',
  '05-01': 'วันแรงงานแห่งชาติ (National Labour Day)',
  '05-04': 'วันฉัตรมงคล (Coronation Day)',
  '06-03': 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี',
  '07-28': 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว',
  '08-12': 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง และวันแม่แห่งชาติ',
  '10-13': 'วันนวมินทรมหาราช (King Bhumibol Adulyadej Memorial Day)',
  '10-23': 'วันปิยมหาราช (Chulalongkorn Memorial Day)',
  '12-05': 'วันคล้ายวันพระบรมราชสมภพ ร.9 วันชาติ และวันพ่อแห่งชาติ',
  '12-10': 'วันรัฐธรรมนูญ (Constitution Day)',
  '12-31': 'วันสิ้นปี (New Year\'s Eve)',
};

// Variable Buddhist lunar holidays by year (2025 - 2027)
export const THAI_LUNAR_HOLIDAYS: Record<string, string> = {
  // 2025
  '2025-02-12': 'วันมาฆบูชา (Makha Bucha Day)',
  '2025-05-11': 'วันวิสาขบูชา (Visakha Bucha Day)',
  '2025-05-12': 'วันหยุดชดเชยวันวิสาขบูชา',
  '2025-07-10': 'วันอาสาฬหบูชา (Asanha Bucha Day)',
  '2025-07-11': 'วันเข้าพรรษา (Buddhist Lent Day)',
  // 2026
  '2026-03-03': 'วันมาฆบูชา (Makha Bucha Day)',
  '2026-05-31': 'วันวิสาขบูชา (Visakha Bucha Day)',
  '2026-06-01': 'วันหยุดชดเชยวันวิสาขบูชา',
  '2026-07-29': 'วันอาสาฬหบูชา (Asanha Bucha Day)',
  '2026-07-30': 'วันเข้าพรรษา (Buddhist Lent Day)',
  // 2027
  '2027-02-21': 'วันมาฆบูชา (Makha Bucha Day)',
  '2027-02-22': 'วันหยุดชดเชยวันมาฆบูชา',
  '2027-05-20': 'วันวิสาขบูชา (Visakha Bucha Day)',
  '2027-07-18': 'วันอาสาฬหบูชา (Asanha Bucha Day)',
  '2027-07-19': 'วันเข้าพรรษา (Buddhist Lent Day)',
  '2027-07-20': 'วันหยุดชดเชยวันอาสาฬหบูชา',
};

/**
 * Check if a given Date is a Thai Public Holiday
 */
export function getThaiHolidayName(date: Date): string | null {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const fullKey = `${yyyy}-${mm}-${dd}`;
  const monthDayKey = `${mm}-${dd}`;

  if (THAI_LUNAR_HOLIDAYS[fullKey]) {
    return THAI_LUNAR_HOLIDAYS[fullKey];
  }

  if (THAI_PUBLIC_HOLIDAYS_FIXED[monthDayKey]) {
    return THAI_PUBLIC_HOLIDAYS_FIXED[monthDayKey];
  }

  return null;
}

/**
 * Calculate additional working days based on Category & Quantity tier
 */
export function calculateQuantityLeadTimeDays(category: JobCategory, quantity: number): {
  additionalDays: number;
  tierDescription: string;
} {
  const qty = Math.max(1, Math.floor(quantity || 1));

  if (category === 'modify_general') {
    if (qty >= 1 && qty <= 10) return { additionalDays: 1, tierDescription: '1–10 ชิ้น (+1 วันทำการ)' };
    if (qty >= 11 && qty <= 20) return { additionalDays: 2, tierDescription: '11–20 ชิ้น (+2 วันทำการ)' };
    if (qty >= 21 && qty <= 50) return { additionalDays: 3, tierDescription: '21–50 ชิ้น (+3 วันทำการ)' };
    if (qty >= 51 && qty <= 100) return { additionalDays: 7, tierDescription: '51–100 ชิ้น (+7 วันทำการ)' };
    if (qty >= 101 && qty <= 200) return { additionalDays: 10, tierDescription: '101–200 ตัว (+10 วันทำการ)' };
    return { additionalDays: 15, tierDescription: '201 ชิ้นขึ้นไป (+15 วันทำการ)' };
  }

  if (category === 'paint') {
    if (qty >= 1 && qty <= 10) return { additionalDays: 3, tierDescription: '1–10 ชิ้น (+3 วันทำการ)' };
    if (qty >= 11 && qty <= 20) return { additionalDays: 2, tierDescription: '11–20 ชิ้น (+2 วันทำการ)' };
    if (qty >= 21 && qty <= 50) return { additionalDays: 5, tierDescription: '21–50 ชิ้น (+5 วันทำการ)' };
    if (qty >= 51 && qty <= 100) return { additionalDays: 10, tierDescription: '51–100 ชิ้น (+10 วันทำการ)' };
    if (qty >= 101 && qty <= 200) return { additionalDays: 10, tierDescription: '101–200 ตัว (+10 วันทำการ)' };
    return { additionalDays: 20, tierDescription: '201 ชิ้นขึ้นไป (+20 วันทำการ)' };
  }

  // custom_fabrication
  if (qty >= 1 && qty <= 10) return { additionalDays: 5, tierDescription: '1–10 ชิ้น (+5 วันทำการ)' };
  if (qty >= 11 && qty <= 20) return { additionalDays: 2, tierDescription: '11–20 ชิ้น (+2 วันทำการ)' };
  if (qty >= 21 && qty <= 50) return { additionalDays: 7, tierDescription: '21–50 ชิ้น (+7 วันทำการ)' };
  if (qty >= 51 && qty <= 100) return { additionalDays: 10, tierDescription: '51–100 ชิ้น (+10 วันทำการ)' };
  if (qty >= 101 && qty <= 200) return { additionalDays: 13, tierDescription: '101–200 ตัว (+13 วันทำการ)' };
  return { additionalDays: 15, tierDescription: '201 ชิ้นขึ้นไป (+15 วันทำการ)' };
}

export interface DayProgressionItem {
  index: number;
  dateStr: string; // 'YYYY-MM-DD'
  thaiDateFormatted: string; // 'จันทร์ 7 ก.ย. 2026'
  dayOfWeek: string; // 'จันทร์', 'อังคาร', ...
  dayNumber: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  isWorkingDay: boolean;
  workingDayIndex: number | null; // 1 to totalWorkingDays
  phase: 'so_received' | 'base_10_days' | 'quantity_addition' | 'weekend_skip' | 'holiday_skip';
  phaseTitle: string;
  reason: string;
}

export interface LeadTimeCalculationResult {
  category: JobCategory;
  soReceivedDate: string; // 'YYYY-MM-DD'
  quantity: number;
  baseWorkingDays: number; // 10
  additionalWorkingDays: number;
  totalWorkingDays: number;
  tierDescription: string;
  estimatedFinishDate: string; // 'YYYY-MM-DD'
  totalCalendarDays: number;
  totalWeekendsSkipped: number;
  totalHolidaysSkipped: number;
  totalOffDaysSkipped: number;
  progression: DayProgressionItem[];
}

const THAI_DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const THAI_MONTH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export function formatThaiDateString(d: Date): string {
  const dayName = THAI_DAY_NAMES[d.getDay()];
  const dateNum = d.getDate();
  const monthName = THAI_MONTH_SHORT[d.getMonth()];
  const yearBE = d.getFullYear() + 543;
  return `วัน${dayName}ที่ ${dateNum} ${monthName} ${yearBE}`;
}

export function formatDateISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Main Lead Time Engine:
 * Formula: SO Received Date + 10 working days (Base) + Quantity add-on working days
 * Strictly skips Saturdays, Sundays, and Thai Public Holidays.
 */
export function calculateLeadTime(
  category: JobCategory,
  soReceivedDateStr: string,
  quantity: number
): LeadTimeCalculationResult {
  const baseWorkingDays = 10;
  const { additionalDays, tierDescription } = calculateQuantityLeadTimeDays(category, quantity);
  const totalWorkingDays = baseWorkingDays + additionalDays;

  const progression: DayProgressionItem[] = [];

  // Parse start date
  const [startYear, startMonth, startDay] = soReceivedDateStr.split('-').map(Number);
  const startDate = new Date(startYear, startMonth - 1, startDay, 12, 0, 0);

  let currentCursor = new Date(startDate.getTime());
  let accumulatedWorkingDays = 0;
  let skippedWeekends = 0;
  let skippedHolidays = 0;
  let stepIndex = 0;

  // Record SO Received Date Day 0
  const startDayOfWeek = currentCursor.getDay();
  const startHoliday = getThaiHolidayName(currentCursor);
  const isStartWeekend = startDayOfWeek === 0 || startDayOfWeek === 6;

  progression.push({
    index: stepIndex++,
    dateStr: formatDateISO(currentCursor),
    thaiDateFormatted: formatThaiDateString(currentCursor),
    dayOfWeek: THAI_DAY_NAMES[startDayOfWeek],
    dayNumber: startDayOfWeek,
    isWeekend: isStartWeekend,
    isHoliday: !!startHoliday,
    holidayName: startHoliday,
    isWorkingDay: false,
    workingDayIndex: null,
    phase: 'so_received',
    phaseTitle: 'วันที่ได้รับ SO (Start Point)',
    reason: `รับใบสั่งขาย SO เข้าระบบ (เริ่มนับวันทำการถัดไป)`,
  });

  // Step forward day by day until we fulfill all totalWorkingDays
  while (accumulatedWorkingDays < totalWorkingDays) {
    currentCursor.setDate(currentCursor.getDate() + 1);

    const dayNum = currentCursor.getDay();
    const isWeekend = dayNum === 0 || dayNum === 6;
    const holidayName = getThaiHolidayName(currentCursor);
    const isHoliday = !!holidayName;

    if (isWeekend) {
      skippedWeekends++;
      progression.push({
        index: stepIndex++,
        dateStr: formatDateISO(currentCursor),
        thaiDateFormatted: formatThaiDateString(currentCursor),
        dayOfWeek: THAI_DAY_NAMES[dayNum],
        dayNumber: dayNum,
        isWeekend: true,
        isHoliday: false,
        holidayName: null,
        isWorkingDay: false,
        workingDayIndex: null,
        phase: 'weekend_skip',
        phaseTitle: `วันหยุดสุดสัปดาห์ (${THAI_DAY_NAMES[dayNum]})`,
        reason: 'ข้ามวันเสาร์-อาทิตย์ (ไม่นับเป็นวันทำการ)',
      });
    } else if (isHoliday) {
      skippedHolidays++;
      progression.push({
        index: stepIndex++,
        dateStr: formatDateISO(currentCursor),
        thaiDateFormatted: formatThaiDateString(currentCursor),
        dayOfWeek: THAI_DAY_NAMES[dayNum],
        dayNumber: dayNum,
        isWeekend: false,
        isHoliday: true,
        holidayName: holidayName,
        isWorkingDay: false,
        workingDayIndex: null,
        phase: 'holiday_skip',
        phaseTitle: `วันหยุดนักขัตฤกษ์: ${holidayName}`,
        reason: `ข้ามวันหยุดราชการ/ประเพณี (${holidayName})`,
      });
    } else {
      accumulatedWorkingDays++;
      const isBasePhase = accumulatedWorkingDays <= baseWorkingDays;

      progression.push({
        index: stepIndex++,
        dateStr: formatDateISO(currentCursor),
        thaiDateFormatted: formatThaiDateString(currentCursor),
        dayOfWeek: THAI_DAY_NAMES[dayNum],
        dayNumber: dayNum,
        isWeekend: false,
        isHoliday: false,
        holidayName: null,
        isWorkingDay: true,
        workingDayIndex: accumulatedWorkingDays,
        phase: isBasePhase ? 'base_10_days' : 'quantity_addition',
        phaseTitle: isBasePhase
          ? `ฐาน 10 วันทำการ (วันที่ ${accumulatedWorkingDays}/10)`
          : `เพิ่มตามจำนวนชิ้นงาน (วันที่ ${accumulatedWorkingDays - baseWorkingDays}/${additionalDays})`,
        reason: isBasePhase
          ? `วันทำการที่ ${accumulatedWorkingDays} ของฐานงาน 10 วัน`
          : `วันทำการที่ ${accumulatedWorkingDays} (บวกเพิ่มตามยอด ${quantity} ชิ้น)`,
      });
    }
  }

  const estimatedFinishDate = formatDateISO(currentCursor);
  const totalCalendarDays = Math.round(
    (currentCursor.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    category,
    soReceivedDate: soReceivedDateStr,
    quantity,
    baseWorkingDays,
    additionalWorkingDays: additionalDays,
    totalWorkingDays,
    tierDescription,
    estimatedFinishDate,
    totalCalendarDays,
    totalWeekendsSkipped: skippedWeekends,
    totalHolidaysSkipped: skippedHolidays,
    totalOffDaysSkipped: skippedWeekends + skippedHolidays,
    progression,
  };
}
