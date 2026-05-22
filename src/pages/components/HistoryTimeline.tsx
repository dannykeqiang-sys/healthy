import { useState, useEffect } from 'react';
import { idbGetAllRecords } from '../../utils/indexedDB';
import { calcTargetCalories } from '../../utils/calculations';
import type { DailyRecord, UserProfile } from '../../types';
import { CalendarDays, Flame, Dumbbell, TrendingUp, TrendingDown, Minus, BookOpen } from 'lucide-react';

interface HistoryTimelineProps {
  profile: UserProfile | null;
}

function getTotalIntake(record: DailyRecord): number {
  return Object.values(record.meals).flat().reduce((s, f) => s + f.calories, 0);
}

function getTotalBurn(record: DailyRecord): number {
  return record.exercises.reduce((s, e) => s + e.calories, 0);
}

function formatDateLabel(dateStr: string): { month: string; day: string; weekday: string } {
  const d = new Date(dateStr + 'T00:00:00');
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return {
    month: `${d.getMonth() + 1}月`,
    day: `${d.getDate()}`,
    weekday: weekdays[d.getDay()],
  };
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0];
}

interface MiniLineChartProps {
  records: DailyRecord[];
  target: number;
}

function MiniLineChart({ records, target }: MiniLineChartProps) {
  if (records.length < 2) return null;

  const W = 320;
  const H = 80;
  const PAD_X = 16;
  const PAD_Y = 10;

  const values = records.map(r => getTotalIntake(r));
  const allValues = [...values, target];
  const minV = Math.max(0, Math.min(...allValues) - 100);
  const maxV = Math.max(...allValues) + 100;

  const toX = (i: number) => PAD_X + (i / (records.length - 1)) * (W - PAD_X * 2);
  const toY = (v: number) => PAD_Y + (1 - (v - minV) / (maxV - minV)) * (H - PAD_Y * 2);

  const points = values.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const areaPoints = `${toX(0)},${H - PAD_Y} ${points} ${toX(records.length - 1)},${H - PAD_Y}`;

  const targetY = toY(target);

  return (
    <div className="rounded-xl border border-border bg-white p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">近期热量趋势</span>
        <span className="text-xs text-muted-foreground ml-auto">最近 {records.length} 天</span>
      </div>
      <div className="flex gap-4 items-end">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="flex-1">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A3B899" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#A3B899" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <line
            x1={PAD_X}
            y1={targetY}
            x2={W - PAD_X}
            y2={targetY}
            stroke="#EBB193"
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.7"
          />
          <polygon points={areaPoints} fill="url(#areaGrad)" />
          <polyline
            points={points}
            fill="none"
            stroke="#A3B899"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {values.map((v, i) => (
            <circle
              key={i}
              cx={toX(i)}
              cy={toY(v)}
              r="3.5"
              fill="white"
              stroke="#A3B899"
              strokeWidth="2"
            />
          ))}
        </svg>
        <div className="flex flex-col gap-2 text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-primary rounded" />
            <span className="text-muted-foreground">实际摄入</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 border-t border-dashed border-secondary" />
            <span className="text-muted-foreground">目标热量</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DayCardProps {
  record: DailyRecord;
  target: number;
  isLast: boolean;
}

function DayCard({ record, target, isLast }: DayCardProps) {
  const intake = getTotalIntake(record);
  const burn = getTotalBurn(record);
  const net = intake - burn;
  const surplus = net - target;
  const today = isToday(record.date);
  const label = formatDateLabel(record.date);

  const mealCount = Object.values(record.meals).filter(m => m.length > 0).length;
  const allFoods = Object.values(record.meals).flat();

  const getSurplusInfo = () => {
    if (Math.abs(surplus) < 50) return { icon: Minus, color: '#A3B899', text: '热量平衡' };
    if (surplus > 0) return { icon: TrendingUp, color: '#EBB193', text: `盈余 ${Math.abs(surplus)} kcal` };
    return { icon: TrendingDown, color: '#7CB9E8', text: `缺口 ${Math.abs(surplus)} kcal` };
  };

  const info = getSurplusInfo();
  const InfoIcon = info.icon;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0 shadow-sm ${today ? 'bg-primary' : 'bg-muted-foreground/40'}`}
        >
          <span className="text-xs leading-none font-bold">{label.day}</span>
          <span className="text-xs leading-none opacity-80">{label.weekday.slice(1)}</span>
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>

      <div className={`flex-1 mb-3 rounded-2xl border p-4 ${today ? 'border-primary/30 bg-primary/5' : 'border-border bg-white'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{label.month}{label.day}日 {label.weekday}</span>
            {today && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary text-white font-medium">今天</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: info.color }}>
            <InfoIcon className="w-3 h-3" />
            <span>{info.text}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-xl bg-muted/50 p-2.5 text-center">
            <Flame className="w-3.5 h-3.5 text-secondary mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground">{intake}</p>
            <p className="text-xs text-muted-foreground">摄入</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2.5 text-center">
            <Dumbbell className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground">{burn}</p>
            <p className="text-xs text-muted-foreground">运动</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2.5 text-center">
            <CalendarDays className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
            <p className="text-sm font-bold text-foreground">{mealCount}</p>
            <p className="text-xs text-muted-foreground">餐次</p>
          </div>
        </div>

        {allFoods.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allFoods.slice(0, 6).map(f => (
              <span
                key={f.id}
                className="text-xs px-2 py-0.5 rounded-full bg-white border border-border text-muted-foreground"
              >
                {f.name} <span className="text-primary font-medium">{f.calories}</span>
              </span>
            ))}
            {allFoods.length > 6 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-border text-muted-foreground">
                +{allFoods.length - 6} 项
              </span>
            )}
          </div>
        )}

        {record.exercises.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {record.exercises.map(e => (
              <span
                key={e.id}
                className="text-xs px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-500"
              >
                {e.name} {e.duration}分钟
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryTimeline({ profile }: HistoryTimelineProps) {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    idbGetAllRecords()
      .then(all => {
        const sorted = all
          .filter(r => {
            const intake = getTotalIntake(r);
            const burn = getTotalBurn(r);
            return intake > 0 || burn > 0;
          })
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 14);
        setRecords(sorted);
      })
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  const target = profile ? calcTargetCalories(profile) : 2000;
  const chartRecords = [...records].reverse();

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">加载历史记录中...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center">
        <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm font-semibold text-foreground">还没有历史记录</p>
        <p className="text-xs text-muted-foreground mt-1">开始记录今天的饮食和运动，时光轴将在这里展开</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {chartRecords.length >= 2 && (
        <MiniLineChart records={chartRecords} target={target} />
      )}
      <div className="rounded-2xl border border-border bg-white p-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">健康手帐</span>
          <span className="text-xs text-muted-foreground">最近 {records.length} 天</span>
        </div>
        <div>
          {records.map((r, i) => (
            <DayCard
              key={r.date}
              record={r}
              target={target}
              isLast={i === records.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
