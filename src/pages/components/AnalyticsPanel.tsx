import { useState, useEffect } from 'react';
import type { UserProfile, DailyRecord } from '../../types';
import { idbGetRecord } from '../../utils/indexedDB';
import { loadAllRecords } from '../../utils/storage';
import CalorieDashboard from './CalorieDashboard';
import BMICard from './BMICard';
import AIHealingCard, { type DayStats } from './AIHealingCard';
import DualCurveChart from './DualCurveChart';
import MacroRhythmBars from './MacroRhythmBars';
import WaterWeightChart from './WaterWeightChart';

interface AnalyticsPanelProps {
  profile: UserProfile | null;
  record: DailyRecord;
  journalDate?: string;
}

const ACTIVITY_FACTOR: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const PURE_WATER_KW = ['水', '矿泉', '开水', '温水', '凉水', '白水', '饮用', '纯净', '蒸馏', '自来'];

function isPureWater(note: string): boolean {
  if (!note || note.trim() === '') return true;
  return PURE_WATER_KW.some(kw => note.includes(kw));
}

function calcTarget(profile: UserProfile): number {
  const bmr =
    profile.gender === 'male'
      ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
      : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  const tdee = bmr * (ACTIVITY_FACTOR[profile.activityLevel] ?? 1.55);
  return Math.round(
    profile.goal === 'lose' ? tdee - 500 : profile.goal === 'gain' ? tdee + 300 : tdee,
  );
}

function calcTDEE(profile: UserProfile): number {
  const bmr =
    profile.gender === 'male'
      ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
      : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  return Math.round(bmr * (ACTIVITY_FACTOR[profile.activityLevel] ?? 1.55));
}

function getWeekdays(): string[] {
  const result: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

function weekdayLabel(date: string): string {
  const today = new Date().toISOString().split('T')[0];
  if (date === today) return '今';
  const d = new Date(date + 'T00:00:00');
  return ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
}

function makeDateLabel(journalDate?: string): string {
  const today = new Date().toISOString().split('T')[0];
  if (!journalDate || journalDate === today) return '今日';
  const d = new Date(journalDate + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function AnalyticsPanel({ profile, record, journalDate }: AnalyticsPanelProps) {
  const dateLabel = makeDateLabel(journalDate);
  const [stats, setStats] = useState<DayStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const dates = getWeekdays();
      const allLS = loadAllRecords();
      const computed: DayStats[] = [];

      for (const date of dates) {
        let rec: DailyRecord | null = null;
        try {
          rec = await idbGetRecord(date);
        } catch {}
        if (!rec && allLS[date]) {
          rec = { ...allLS[date], water: allLS[date].water ?? [] };
        }
        if (rec) {
          const allFoods = Object.values(rec.meals).flat();
          const intake = allFoods.reduce((s, f) => s + f.calories, 0);
          const burn = rec.exercises.reduce((s, e) => s + e.calories, 0);

          let pureWater = 0;
          let foodWater = 0;
          for (const w of rec.water || []) {
            if (isPureWater(w.note)) pureWater += w.amount;
            else foodWater += w.amount;
          }
          const water = pureWater + foodWater;

          const protein = Math.round(allFoods.reduce((s, f) => s + (f.protein ?? 0), 0));
          const carbs = Math.round(allFoods.reduce((s, f) => s + (f.carbs ?? 0), 0));
          const fat = Math.round(allFoods.reduce((s, f) => s + (f.fat ?? 0), 0));

          const exercises = (rec.exercises || []).map(e => ({
            name: e.name,
            duration: e.duration,
            calories: e.calories,
          }));

          computed.push({
            date,
            label: weekdayLabel(date),
            intake,
            burn,
            water,
            pureWater,
            foodWater,
            net: intake - burn,
            protein,
            carbs,
            fat,
            exercises,
          });
        } else {
          computed.push({
            date,
            label: weekdayLabel(date),
            intake: 0,
            burn: 0,
            water: 0,
            pureWater: 0,
            foodWater: 0,
            net: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            exercises: [],
          });
        }
      }

      setStats(computed);
      setLoading(false);
    }
    load();
  }, []);

  const targetCalories = profile ? calcTarget(profile) : 2000;
  const tdee = profile ? calcTDEE(profile) : 0;
  const activeDays = stats.filter(d => d.intake > 0);
  const daysOnTarget = stats.filter(d => d.intake > 0 && d.intake <= targetCalories).length;
  const waterDays = stats.filter(d => d.water >= 1500).length;
  const exerciseDays = stats.filter(d => d.burn > 0).length;
  const baseWeight = profile?.weight ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <CalorieDashboard profile={profile} record={record} dateLabel={dateLabel} />
      {profile && <BMICard profile={profile} />}

      <AIHealingCard
        stats={stats}
        profile={profile}
        activeDaysCount={activeDays.length}
        waterDays={waterDays}
        exerciseDays={exerciseDays}
        daysOnTarget={daysOnTarget}
      />

      <DualCurveChart
        stats={stats}
        tdee={tdee}
        targetCalories={targetCalories}
      />

      <MacroRhythmBars
        stats={stats}
        targetCalories={targetCalories}
      />

      <WaterWeightChart
        stats={stats}
        baseWeight={baseWeight}
      />
    </div>
  );
}
