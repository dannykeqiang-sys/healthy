import { useState, useEffect } from 'react';
import { Sparkles, ChevronRight, Calendar, Flame, Droplets, Dumbbell } from 'lucide-react';
import type { UserProfile, DailyRecord } from '../../types';
import { idbGetRecord } from '../../utils/indexedDB';
import { loadAllRecords } from '../../utils/storage';
import CalorieDashboard from './CalorieDashboard';
import BMICard from './BMICard';
import TodayNutritionCard from './TodayNutritionCard';
import type { DayStats } from './AIHealingCard';
import WeeklyStatsModal from './WeeklyStatsModal';

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

function getWeekRange(): string {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const fmt = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;
  return `${fmt(start)} — ${fmt(end)}`;
}

export default function AnalyticsPanel({ profile, record, journalDate }: AnalyticsPanelProps) {
  const dateLabel = makeDateLabel(journalDate);
  const [stats, setStats] = useState<DayStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

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
            water: pureWater + foodWater,
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

  const weekMetrics = [
    { label: '记录', value: activeDays.length, icon: Calendar, color: '#8B5CF6' },
    { label: '达标', value: daysOnTarget, icon: Flame, color: '#F97316' },
    { label: '运动', value: exerciseDays, icon: Dumbbell, color: '#22C55E' },
    { label: '补水', value: waterDays, icon: Droplets, color: '#0EA5E9' },
  ];

  return (
    <div className="space-y-4">
      <CalorieDashboard profile={profile} record={record} dateLabel={dateLabel} />
      {profile && <BMICard profile={profile} />}
      <TodayNutritionCard record={record} />

      <button
        onClick={() => setModalOpen(true)}
        className="w-full text-left cursor-pointer group"
        disabled={loading}
      >
        <div
          className="relative rounded-2xl overflow-hidden transition-transform active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #A3B899 0%, #7CB9E8 55%, #C084FC 100%)',
            padding: '20px',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 85% 15%, rgba(255,255,255,0.2) 0%, transparent 50%)',
            }}
          />
          <div
            className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 65%)' }}
          />

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.25)' }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">本周旅程</p>
                  <p className="text-white/65 text-[10px] mt-0.5">{getWeekRange()}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-white/80 text-xs font-medium">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>翻开手账 <ChevronRight className="w-4 h-4" /></>
                )}
              </div>
            </div>

            {!loading && (
              <div className="grid grid-cols-4 gap-2">
                {weekMetrics.map(m => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.label}
                      className="flex flex-col items-center gap-1 py-2 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.18)' }}
                    >
                      <Icon className="w-3.5 h-3.5 text-white/80" />
                      <p className="text-white font-bold text-base leading-none">{m.value}</p>
                      <p className="text-white/65 text-[10px]">{m.label}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {loading && (
              <div className="h-16 flex items-center justify-center">
                <p className="text-white/60 text-xs">正在加载本周数据...</p>
              </div>
            )}
          </div>
        </div>
      </button>

      <WeeklyStatsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        stats={stats}
        profile={profile}
        activeDaysCount={activeDays.length}
        waterDays={waterDays}
        exerciseDays={exerciseDays}
        daysOnTarget={daysOnTarget}
        targetCalories={targetCalories}
        tdee={tdee}
        baseWeight={baseWeight}
      />
    </div>
  );
}
