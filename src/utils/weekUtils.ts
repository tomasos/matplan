import { DayOfWeek, WeekInfo } from '../types';

const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function getWeekNumber(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

export function getDateOfWeek(year: number, week: number, dayOfWeek: DayOfWeek): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  
  const dayIndex = DAYS_OF_WEEK.indexOf(dayOfWeek);
  const date = new Date(ISOweekStart);
  date.setDate(ISOweekStart.getDate() + dayIndex);
  return date;
}

export function getWeekInfo(year: number, week: number, weekPlan: { [dayKey: string]: string | null }): WeekInfo {
  const days = DAYS_OF_WEEK.map((day) => {
    const date = getDateOfWeek(year, week, day);
    const dayKey = `${year}-W${week}-${day}`;
    return {
      day,
      date,
      mealId: weekPlan[dayKey] || null,
    };
  });

  return {
    year,
    week,
    days,
  };
}

export function getDayKey(year: number, week: number, day: DayOfWeek): string {
  return `${year}-W${week}-${day}`;
}

export function parseDayKey(dayKey: string): { year: number; week: number; day: DayOfWeek } | null {
  const match = dayKey.match(/^(\d+)-W(\d+)-(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    week: parseInt(match[2], 10),
    day: match[3] as DayOfWeek,
  };
}

