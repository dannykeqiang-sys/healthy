import { useEffect } from 'react';
import { X, Calendar, Flame, Droplets, Dumbbell } from 'lucide-react';
import type { UserProfile } from '../../types';
import AIHealingCard, { type DayStats } from './AIHealingCard';
import DualCurveChart from './DualCurveChart';
import MacroRhythmBars from './MacroRhythmBars';
import WaterWeightChart from './WaterWeightChart';

interface WeeklyStatsModalProps {
  open: boolean;
  onClose: () => void;
  stats: DayStats[];
  profile: UserProfile | null;
  activeDaysCount: number;
  waterDays: number;
  exerciseDays: number;
  daysOnTarget: number;
  targetCalories: number;
  tdee: number;
  baseWeight: number;
}

function getWeekRange(): string {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const fmt = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;
  return `${fmt(start)} — ${fmt(end)}`;
}

function getHeadline(name: string, activeDays: number, daysOnTarget: number, exerciseDays: number): string {
  if (activeDays === 0) return `${name}，翻开这里，是你旅程的第一步`;
  if (activeDays >= 7 && daysOnTarget >= 6) return `${name}，这是真正属于你的完美一周`;
  if (activeDays >= 6) return `${name}，这周的你很闪光`;
  if (exerciseDays >= 4 && daysOnTarget >= 4) return `${name}，自律让你更美`;
  if (daysOnTarget >= 5) return `${name}，你这周的节制令人心疼地美`;
  if (activeDays >= 4) return `${name}，每一天的记录都是爱自己`;
  return `${name}，你一直都在路上`;
}

function getSubline(activeDays: number, exerciseDays: number, waterDays: number): string {
  const parts: string[] = [];
  if (activeDays > 0) parts.push(`记录了 ${activeDays} 天`);
  if (exerciseDays > 0) parts.push(`运动了 ${exerciseDays} 天`);
  if (waterDays > 0) parts.push(`${waterDays} 天认真补水`);
  if (parts.length === 0) return '开启你的健康旅程吧';
  return parts.join('，');
}

export default function WeeklyStatsModal({
  open,
  onClose,
  stats,
  profile,
  activeDaysCount,
  waterDays,
  exerciseDays,
  daysOnTarget,
  targetCalories,
  tdee,
  baseWeight,
}: WeeklyStatsModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const name = profile?.name || '你';
  const headline = getHeadline(name, activeDaysCount, daysOnTarget, exerciseDays);
  const subline = getSubline(activeDaysCount, exerciseDays, waterDays);
  const weekRange = getWeekRange();

  const metrics = [
    { label: '记录', value: activeDaysCount, icon: Calendar, color: '#8B5CF6' },
    { label: '达标', value: daysOnTarget, icon: Flame, color: '#F97316' },
    { label: '运动', value: exerciseDays, icon: Dumbbell, color: '#22C55E' },
    { label: '补水', value: waterDays, icon: Droplets, color: '#0EA5E9' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        style={{ animation: 'wsmFadeIn 0.25s ease' }}
        onClick={onClose}
      />

      <div
        className="relative w-full sm:max-w-lg sm:mx-4 sm:rounded-3xl rounded-t-3xl flex flex-col overflow-hidden"
        style={{
          maxHeight: '92vh',
          background: 'linear-gradient(170deg, #FFF9F5 0%, #F5F2FF 50%, #F0F8FF 100%)',
          animation: 'wsmSlideUp 0.32s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div
          className="flex-shrink-0 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #A3B899 0%, #7CB9E8 55%, #C084FC 100%)',
            padding: '28px 20px 48px',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.22) 0%, transparent 55%)',
            }}
          />
          <div
            className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 65%)' }}
          />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all"
            style={{ background: 'rgba(255,255,255,0.22)' }}
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="relative">
            <p className="text-white/65 text-[11px] font-medium tracking-widest uppercase mb-2">
              {weekRange}
            </p>
            <h2
              className="text-white text-xl font-bold leading-snug mb-1"
              style={{ fontFamily: '"Noto Serif SC", "Songti SC", serif' }}
            >
              {headline}
            </h2>
            <p className="text-white/75 text-sm">{subline}</p>
          </div>
        </div>

        <div className="flex-shrink-0 px-4 -mt-6 relative z-10">
          <div
            className="rounded-2xl grid grid-cols-4 gap-1 p-3"
            style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            }}
          >
            {metrics.map(m => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="flex flex-col items-center gap-1.5 py-1">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${m.color}15` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: m.color }} />
                  </div>
                  <p className="text-xl font-bold text-foreground leading-none">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6 space-y-4">
          <AIHealingCard
            stats={stats}
            profile={profile}
            activeDaysCount={activeDaysCount}
            waterDays={waterDays}
            exerciseDays={exerciseDays}
            daysOnTarget={daysOnTarget}
          />

          <DualCurveChart stats={stats} tdee={tdee} targetCalories={targetCalories} />

          <MacroRhythmBars stats={stats} targetCalories={targetCalories} />

          <WaterWeightChart stats={stats} baseWeight={baseWeight} />
        </div>
      </div>

      <style>{`
        @keyframes wsmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wsmSlideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
