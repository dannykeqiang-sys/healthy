import type { UserProfile, DailyRecord } from '../../types';
import { calcTargetCalories } from '../../utils/calculations';
import { TrendingUp, TrendingDown, Minus, Flame, Dumbbell, Apple } from 'lucide-react';

interface CalorieDashboardProps {
  profile: UserProfile | null;
  record: DailyRecord;
  dateLabel?: string;
}

function RingChart({ value, max, color, size = 140 }: { value: number; max: number; color: string; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(value / Math.max(max, 1), 1);
  const strokeDashoffset = circumference * (1 - ratio);

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E8E3DC" strokeWidth={10} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  unit: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-2xl p-4 border border-border ${bg} flex items-center gap-4`}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{unit}</p>
      </div>
    </div>
  );
}

export default function CalorieDashboard({ profile, record, dateLabel = '今日' }: CalorieDashboardProps) {
  const totalIntake = Object.values(record.meals).flat().reduce((sum, f) => sum + f.calories, 0);
  const totalBurn = record.exercises.reduce((sum, e) => sum + e.calories, 0);
  const targetCalories = profile ? calcTargetCalories(profile) : 2000;
  const netCalories = totalIntake - totalBurn;
  const surplus = netCalories - targetCalories;
  const surplusAbs = Math.abs(surplus);
  const isOver = surplus > 0;
  const isBalance = Math.abs(surplus) < 50;

  const getSurplusInfo = () => {
    if (isBalance) return { icon: Minus, color: '#A3B899', label: '热量平衡', text: `你${dateLabel}的热量管理非常棒！维持现状就是成功！`, bg: 'bg-primary/5' };
    if (isOver) return { icon: TrendingUp, color: '#EBB193', label: '热量盈余', text: `${dateLabel}盈余 ${surplusAbs} 大卡，适当增加运动消耗效果更好`, bg: 'bg-secondary/5' };
    return { icon: TrendingDown, color: '#7CB9E8', label: '热量缺口', text: `${dateLabel}缺口 ${surplusAbs} 大卡，你正在向目标体重迈进！`, bg: 'bg-blue-50' };
  };

  const surplusInfo = getSurplusInfo();
  const SurplusIcon = surplusInfo.icon;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-border p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative flex-shrink-0">
            <RingChart value={totalIntake} max={targetCalories} color="#A3B899" size={140} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Flame className="w-5 h-5 text-secondary mb-1" />
              <p className="text-2xl font-bold text-foreground leading-none">{totalIntake}</p>
              <p className="text-xs text-muted-foreground">/ {targetCalories}</p>
              <p className="text-xs text-muted-foreground">kcal</p>
            </div>
          </div>

          <div className="flex-1 w-full space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{dateLabel}摄入</span>
                <span className="font-semibold text-primary">{totalIntake} kcal</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((totalIntake / targetCalories) * 100, 100)}%`,
                    background: 'linear-gradient(to right, #A3B899, #8aab7e)',
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">运动消耗</span>
                <span className="font-semibold text-blue-500">{totalBurn} kcal</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((totalBurn / targetCalories) * 100, 100)}%`,
                    background: 'linear-gradient(to right, #7CB9E8, #5aa0d4)',
                  }}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className={`rounded-2xl border border-border p-4 flex items-start gap-3 ${surplusInfo.bg}`}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${surplusInfo.color}20` }}>
          <SurplusIcon className="w-4 h-4" style={{ color: surplusInfo.color }} />
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: surplusInfo.color }}>
            {surplusInfo.label}：{surplusAbs} kcal
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{surplusInfo.text}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={Apple} label={`${dateLabel}摄入`} value={totalIntake} unit="大卡" color="#A3B899" bg="bg-primary/5" />
        <StatCard icon={Dumbbell} label="运动消耗" value={totalBurn} unit="大卡" color="#7CB9E8" bg="bg-blue-50" />
        <StatCard icon={Flame} label="目标热量" value={targetCalories} unit="大卡/天" color="#EBB193" bg="bg-secondary/5" />
      </div>
    </div>
  );
}
