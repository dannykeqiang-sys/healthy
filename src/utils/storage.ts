import type { UserProfile, DailyRecord, MealRecord } from '../types';

const PROFILE_KEY = 'calorie_user_profile';
const RECORDS_KEY = 'calorie_daily_records';

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadAllRecords(): Record<string, DailyRecord> {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function loadTodayRecord(): DailyRecord {
  const all = loadAllRecords();
  const today = getTodayKey();
  return all[today] || {
    date: today,
    meals: { breakfast: [], lunch: [], dinner: [], snack: [] } as MealRecord,
    exercises: [],
  };
}

export function saveTodayRecord(record: DailyRecord): void {
  const all = loadAllRecords();
  all[record.date] = record;
  localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
}
