// 祝日・土日判定ユーティリティ

/**
 * 春分の日を計算（より正確な版）
 */
const getVernalEquinox = (year: number): Date => {
  // より正確な計算式
  let day = 20;
  if (year >= 2000 && year <= 2030) {
    if (year % 4 === 0) {
      day = 20;
    } else {
      day = 21;
    }
  } else if (year >= 1980 && year <= 1999) {
    day = 20;
  } else {
    day = 20; // デフォルト
  }
  
  // 特定年の調整
  if (year === 2025) day = 20;
  if (year === 2026) day = 20;
  
  return new Date(year, 2, day);
};

/**
 * 秋分の日を計算（より正確な版）
 */
const getAutumnalEquinox = (year: number): Date => {
  // より正確な計算式
  let day = 23;
  if (year >= 2000 && year <= 2030) {
    if (year % 4 === 0) {
      day = 22;
    } else {
      day = 23;
    }
  } else {
    day = 23; // デフォルト
  }
  
  // 特定年の調整
  if (year === 2025) day = 23;
  if (year === 2026) day = 23;
  
  return new Date(year, 8, day);
};

/**
 * 振替休日を計算
 */
const getSubstituteHolidays = (holidays: { [key: string]: string }): { [key: string]: string } => {
  const substituteHolidays: { [key: string]: string } = {};
  
  Object.entries(holidays).forEach(([dateStr, name]) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    
    // 日曜日の祝日の場合、翌日以降の平日を振替休日にする
    if (dayOfWeek === 0) {
      let nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      // 翌日以降で祝日でない平日を探す
      while (true) {
        const nextDateStr = nextDate.toISOString().slice(0, 10);
        const nextDayOfWeek = nextDate.getDay();
        
        // 既に祝日として登録されていない、かつ平日の場合
        if (!(nextDateStr in holidays) && !(nextDateStr in substituteHolidays) && nextDayOfWeek !== 0 && nextDayOfWeek !== 6) {
          substituteHolidays[nextDateStr] = '振替休日';
          break;
        }
        
        nextDate = new Date(nextDate.getTime() + 24 * 60 * 60 * 1000);
      }
    }
  });
  
  return substituteHolidays;
};

/**
 * 国民の祝日を計算
 */
const calculateHolidays = (year: number): { [key: string]: string } => {
  const holidays: { [key: string]: string } = {};
  
  // 正確な祝日データ（年別）
  if (year === 2024) {
    holidays['2024-01-01'] = '元日';
    holidays['2024-01-08'] = '成人の日';
    holidays['2024-02-11'] = '建国記念の日';
    holidays['2024-02-12'] = '振替休日';
    holidays['2024-02-23'] = '天皇誕生日';
    holidays['2024-03-20'] = '春分の日';
    holidays['2024-04-29'] = '昭和の日';
    holidays['2024-05-03'] = '憲法記念日';
    holidays['2024-05-04'] = 'みどりの日';
    holidays['2024-05-05'] = 'こどもの日';
    holidays['2024-05-06'] = '振替休日';
    holidays['2024-07-15'] = '海の日';
    holidays['2024-08-11'] = '山の日';
    holidays['2024-08-12'] = '振替休日';
    holidays['2024-09-16'] = '敬老の日';
    holidays['2024-09-22'] = '秋分の日';
    holidays['2024-09-23'] = '振替休日';
    holidays['2024-10-14'] = 'スポーツの日';
    holidays['2024-11-03'] = '文化の日';
    holidays['2024-11-04'] = '振替休日';
    holidays['2024-11-23'] = '勤労感謝の日';
    return holidays;
  }
  
  if (year === 2025) {
    // 2025年の正確な祝日データ（内閣府公式）
    holidays['2025-01-01'] = '元日';
    holidays['2025-01-13'] = '成人の日';
    holidays['2025-02-11'] = '建国記念の日';
    holidays['2025-02-23'] = '天皇誕生日';
    holidays['2025-02-24'] = '振替休日';  // 天皇誕生日が日曜のため
    holidays['2025-03-20'] = '春分の日';
    holidays['2025-04-29'] = '昭和の日';
    holidays['2025-05-03'] = '憲法記念日';
    holidays['2025-05-04'] = 'みどりの日';
    holidays['2025-05-05'] = 'こどもの日';
    holidays['2025-05-06'] = '振替休日';  // みどりの日が日曜のため
    holidays['2025-07-21'] = '海の日';
    holidays['2025-08-11'] = '山の日';
    holidays['2025-09-15'] = '敬老の日';
    holidays['2025-09-23'] = '秋分の日';
    holidays['2025-10-13'] = 'スポーツの日';
    holidays['2025-11-03'] = '文化の日';
    holidays['2025-11-23'] = '勤労感謝の日';
    holidays['2025-11-24'] = '振替休日';  // 勤労感謝の日が日曜のため
    return holidays;
  }
  
  if (year === 2026) {
    holidays['2026-01-01'] = '元日';
    holidays['2026-01-12'] = '成人の日';
    holidays['2026-02-11'] = '建国記念の日';
    holidays['2026-02-23'] = '天皇誕生日';
    holidays['2026-03-21'] = '春分の日';
    holidays['2026-04-29'] = '昭和の日';
    holidays['2026-05-03'] = '憲法記念日';
    holidays['2026-05-04'] = 'みどりの日';
    holidays['2026-05-05'] = 'こどもの日';
    holidays['2026-07-20'] = '海の日';
    holidays['2026-08-11'] = '山の日';
    holidays['2026-09-21'] = '敬老の日';
    holidays['2026-09-22'] = '国民の休日';
    holidays['2026-09-23'] = '秋分の日';
    holidays['2026-10-12'] = 'スポーツの日';
    holidays['2026-11-03'] = '文化の日';
    holidays['2026-11-23'] = '勤労感謝の日';
    return holidays;
  }
  
  // 固定祝日（その他の年）
  holidays[`${year}-01-01`] = '元日';
  holidays[`${year}-02-11`] = '建国記念の日';
  holidays[`${year}-04-29`] = '昭和の日';
  holidays[`${year}-05-03`] = '憲法記念日';
  holidays[`${year}-05-04`] = 'みどりの日';
  holidays[`${year}-05-05`] = 'こどもの日';
  holidays[`${year}-11-03`] = '文化の日';
  holidays[`${year}-11-23`] = '勤労感謝の日';
  
  // 天皇誕生日（2019年以降は2月23日）
  if (year >= 2019) {
    holidays[`${year}-02-23`] = '天皇誕生日';
  }
  
  // 移動祝日
  // 成人の日（1月の第2月曜日）
  const firstDay = new Date(year, 0, 1);
  const firstMonday = new Date(year, 0, 1 + (1 - firstDay.getDay() + 7) % 7);
  const secondMonday = new Date(firstMonday.getTime() + 7 * 24 * 60 * 60 * 1000);
  holidays[secondMonday.toISOString().slice(0, 10)] = '成人の日';
  
  // 海の日（7月の第3月曜日）
  const julyFirst = new Date(year, 6, 1);
  const julyFirstMonday = new Date(year, 6, 1 + (1 - julyFirst.getDay() + 7) % 7);
  const thirdMondayJuly = new Date(julyFirstMonday.getTime() + 14 * 24 * 60 * 60 * 1000);
  holidays[thirdMondayJuly.toISOString().slice(0, 10)] = '海の日';
  
  // 山の日（8月11日、2021年以降は8月11日、2020年は8月10日）
  if (year === 2020) {
    holidays[`${year}-08-10`] = '山の日';
  } else {
    holidays[`${year}-08-11`] = '山の日';
  }
  
  // 敬老の日（9月の第3月曜日）
  const septFirst = new Date(year, 8, 1);
  const septFirstMonday = new Date(year, 8, 1 + (1 - septFirst.getDay() + 7) % 7);
  const thirdMondaySept = new Date(septFirstMonday.getTime() + 14 * 24 * 60 * 60 * 1000);
  holidays[thirdMondaySept.toISOString().slice(0, 10)] = '敬老の日';
  
  // スポーツの日（10月の第2月曜日）
  const octFirst = new Date(year, 9, 1);
  const octFirstMonday = new Date(year, 9, 1 + (1 - octFirst.getDay() + 7) % 7);
  const secondMondayOct = new Date(octFirstMonday.getTime() + 7 * 24 * 60 * 60 * 1000);
  holidays[secondMondayOct.toISOString().slice(0, 10)] = 'スポーツの日';
  
  // 春分の日
  const vernalEquinox = getVernalEquinox(year);
  holidays[vernalEquinox.toISOString().slice(0, 10)] = '春分の日';
  
  // 秋分の日
  const autumnalEquinox = getAutumnalEquinox(year);
  holidays[autumnalEquinox.toISOString().slice(0, 10)] = '秋分の日';
  
  // 振替休日を追加
  const substituteHolidays = getSubstituteHolidays(holidays);
  
  return { ...holidays, ...substituteHolidays };
};

// 祝日キャッシュ
const holidayCache: { [year: number]: { [key: string]: string } } = {};

/**
 * 指定年の祝日を取得
 */
export const getHolidaysForYear = (year: number): { [key: string]: string } => {
  if (!holidayCache[year]) {
    holidayCache[year] = calculateHolidays(year);
  }
  return holidayCache[year];
};

/**
 * 土日判定
 */
export const isWeekend = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDay();
  return day === 0 || day === 6; // 0=日曜, 6=土曜
};

/**
 * 日曜日判定
 */
export const isSunday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDay() === 0;
};

/**
 * 土曜日判定
 */
export const isSaturday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDay() === 6;
};

/**
 * 祝日判定
 */
export const isHoliday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const holidays = getHolidaysForYear(year);
  const dateStr = d.toISOString().slice(0, 10);
  return dateStr in holidays;
};

/**
 * 祝日名取得
 */
export const getHolidayName = (date: Date | string): string | null => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const holidays = getHolidaysForYear(year);
  const dateStr = d.toISOString().slice(0, 10);
  return holidays[dateStr] || null;
};

/**
 * 平日判定（土日祝日以外）
 */
export const isWorkingDay = (date: Date | string): boolean => {
  return !isWeekend(date) && !isHoliday(date);
};

/**
 * 日付の種別を取得
 */
export const getDayType = (date: Date | string): 'holiday' | 'weekend' | 'workday' => {
  if (isHoliday(date)) return 'holiday';
  if (isWeekend(date)) return 'weekend';
  return 'workday';
};

/**
 * 日本の曜日名を取得
 */
export const getJapaneseDayName = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  return dayNames[d.getDay()];
};

/**
 * 日付の表示用スタイルを取得
 */
export const getDateStyle = (date: Date | string): React.CSSProperties => {
  const holidayName = getHolidayName(date);
  
  if (holidayName) {
    // 祝日: 赤色
    return { color: '#ff6b6b', fontWeight: 'bold' };
  }
  
  if (isSunday(date)) {
    // 日曜日: 赤色
    return { color: '#ff6b6b', fontWeight: 'bold' };
  }
  
  if (isSaturday(date)) {
    // 土曜日: 青色
    return { color: '#4dabf7', fontWeight: 'bold' };
  }
  
  // 平日: 通常色
  return { color: '#333' };
};

/**
 * 月の祝日一覧を取得
 */
export const getMonthHolidays = (year: number, month: number): { [key: string]: string } => {
  const holidays = getHolidaysForYear(year);
  const monthHolidays: { [key: string]: string } = {};
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  
  Object.entries(holidays).forEach(([date, name]) => {
    if (date.startsWith(monthStr)) {
      monthHolidays[date] = name;
    }
  });
  
  return monthHolidays;
};

/**
 * 年の祝日数を取得
 */
export const getYearHolidayCount = (year: number): number => {
  const holidays = getHolidaysForYear(year);
  return Object.keys(holidays).length;
};

/**
 * 同期版祝日判定（メモリから即座に判定）
 */
export const isHolidaySync = (date: Date | string): boolean => {
  return isHoliday(date);
};

/**
 * 同期版祝日名取得
 */
export const getHolidayNameSync = (date: Date | string): string | null => {
  return getHolidayName(date);
};

/**
 * 指定年の祝日一覧を取得（デバッグ用）
 */
export const getAllHolidaysForYear = (year: number): { [key: string]: string } => {
  return getHolidaysForYear(year);
};

/**
 * 指定年月の祝日一覧を取得（デバッグ用）
 */
export const getHolidaysForMonth = (year: number, month: number): { [key: string]: string } => {
  const holidays = getHolidaysForYear(year);
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const monthHolidays: { [key: string]: string } = {};
  
  Object.entries(holidays).forEach(([date, name]) => {
    if (date.startsWith(monthStr)) {
      monthHolidays[date] = name;
    }
  });
  
  return monthHolidays;
};

/**
 * 祝日計算結果をコンソールに出力（デバッグ用）
 */
export const debugHolidays = (year: number, month?: number): void => {
  if (month) {
    const holidays = getHolidaysForMonth(year, month);
    console.log(`${year}年${month}月の祝日:`, holidays);
  } else {
    const holidays = getAllHolidaysForYear(year);
    console.log(`${year}年の祝日:`, holidays);
  }
};

