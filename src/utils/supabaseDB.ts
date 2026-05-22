import { getPostgrest } from './supabase';
import { getUserInfo } from '../lib/utils';
import type { UserProfile, DailyRecord } from '../types';

const PROFILE_TABLE = 'calorie_user_profiles';
const RECORD_TABLE = 'calorie_daily_records';

export async function syncProfileToCloud(profile: UserProfile): Promise<void> {
  const db = await getPostgrest();
  if (!db) return;

  const userInfo = await getUserInfo();
  if (!userInfo?.workid) return;

  const now = new Date().toISOString();
  const payload = {
    workid: userInfo.workid,
    cname: userInfo.cname,
    avatar: userInfo.avatar,
    name: profile.name,
    height: profile.height,
    weight: profile.weight,
    age: profile.age,
    gender: profile.gender,
    goal: profile.goal,
    activity_level: profile.activityLevel,
    updated_at: now,
  };

  const { data: existing } = await db.from(PROFILE_TABLE).select('id').eq('workid', userInfo.workid).limit(1);

  if (existing && existing.length > 0) {
    await db.from(PROFILE_TABLE).update(payload).eq('workid', userInfo.workid);
  } else {
    await db.from(PROFILE_TABLE).insert(payload);
  }
}

export async function syncRecordToCloud(record: DailyRecord): Promise<void> {
  const db = await getPostgrest();
  if (!db) return;

  const userInfo = await getUserInfo();
  if (!userInfo?.workid) return;

  const now = new Date().toISOString();
  const payload = {
    workid: userInfo.workid,
    cname: userInfo.cname,
    avatar: userInfo.avatar,
    record_date: record.date,
    meals_data: record.meals,
    exercises_data: record.exercises,
    updated_at: now,
  };

  const { data: existing } = await db
    .from(RECORD_TABLE)
    .select('id')
    .eq('workid', userInfo.workid)
    .eq('record_date', record.date)
    .limit(1);

  if (existing && existing.length > 0) {
    await db.from(RECORD_TABLE).update(payload).eq('workid', userInfo.workid).eq('record_date', record.date);
  } else {
    await db.from(RECORD_TABLE).insert(payload);
  }
}
