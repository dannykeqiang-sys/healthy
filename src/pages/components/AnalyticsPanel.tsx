import { useState, useEffect } from 'react';
import type { UserProfile, DailyRecord } from '../../types';
import { idbGetRecord } from '../../utils/indexedDB';
import { loadAllRecords } from '../../utils/storage';

interface AnalyticsPanelProps {
  profile: UserProfile | null;
}

interface DayStats {
  date: string;
  label: string;
  intake: number;
  burn: number;
  water: number;
  net: number;
}

const ACTIVITY_FACTOR: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

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

function LineChart({
  data,
  targetCalories,
}: {
  data: DayStats[];
  targetCalories: number;
}) {
  if (data.length === 0) return null;
  const W = 320;
  const H = 150;
  const PAD = { t: 20, r: 14, b: 28, l: 36 };
  const cw = W - PAD.l - PAD.r;
  const ch = H - PAD.t - PAD.b;
  const maxV = Math.max(...data.map(d => d.intake), targetCalories, 500);
  const xStep = cw / Math.max(data.length - 1, 1);
  const toX = (i: number) => PAD.l + i * xStep;
  const toY = (v: number) => PAD.t + ch * (1 - v / maxV);

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.intake)}`).join(' ');
  const areaPath = [
    `M ${toX(0)} ${PAD.t + ch}`,
    ...data.map((d, i) => `L ${toX(i)} ${toY(d.intake)}`),
    `L ${toX(data.length - 1)} ${PAD.t + ch}`,
    'Z',
  ].join(' ');
  const targetY = toY(targetCalories);
  const yTicks = [0, Math.round(maxV * 0.5), maxV];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {yTicks.map(v => (
        <g key={v}>
          <line
            x1={PAD.l} y1={toY(v)} x2={PAD.l + cw} y2={toY(v)}
            stroke="#e5e7eb" strokeWidth="0.6" strokeDasharray="3,3"
          />
          <text x={PAD.l - 4} y={toY(v) + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
            {v}
          </text>
        </g>
      ))}

      <line
        x1={PAD.l} y1={targetY} x2={PAD.l + cw} y2={targetY}
        stroke="#22C55E" strokeWidth="1.2" strokeDasharray="5,4" opacity="0.75"
      />
      <text x={PAD.l + cw + 3} y={targetY + 4} fontSize="8" fill="#22C55E" opacity="0.85">
        目标
      </text>

      <path d={areaPath} fill="url(#ag)" />
      <path
        d={linePath}
        fill="none"
        stroke="#F97316"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {data.map((d, i) => (
        <g key={d.date}>
          <circle cx={toX(i)} cy={toY(d.intake)} r="3" fill={d.intake > 0 ? '#F97316' : '#e5e7eb'} />
          {d.intake > 0 && (
            <text x={toX(i)} y={toY(d.intake) - 7} textAnchor="middle" fontSize="8" fill="#F97316">
              {d.intake}
            </text>
          )}
          <text
            x={toX(i)}
            y={PAD.t + ch + 16}
            textAnchor="middle"
            fontSize="9"
            fill="#9ca3af"
            fontWeight={d.label === '今' ? '700' : '400'}
          >
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function WaterBarChart({ data }: { data: DayStats[] }) {
  if (data.length === 0) return null;
  const W = 320;
  const H = 120;
  const PAD = { t: 14, r: 14, b: 26, l: 32 };
  const cw = W - PAD.l - PAD.r;
  const ch = H - PAD.t - PAD.b;
  const GOAL = 2000;
  const maxV = Math.max(...data.map(d => d.water), GOAL, 500);
  const slotW = cw / data.length;
  const barW = slotW * 0.55;
  const toH = (v: number) => (v / maxV) * ch;
  const toX = (i: number) => PAD.l + i * slotW + (slotW - barW) / 2;
  const goalY = PAD.t + ch * (1 - GOAL / maxV);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <line
        x1={PAD.l} y1={goalY} x2={PAD.l + cw} y2={goalY}
        stroke="#0EA5E9" strokeWidth="1" strokeDasharray="4,3" opacity="0.65"
      />
      <text x={PAD.l + cw + 3} y={goalY + 3} fontSize="8" fill="#0EA5E9" opacity="0.75">
        目标
      </text>

      {data.map((d, i) => {
        const h = toH(d.water);
        const x = toX(i);
        const y = PAD.t + ch - h;
        return (
          <g key={d.date}>
            <rect
              x={x} y={y} width={barW} height={Math.max(h, 2)}
              rx="3"
              fill={d.water >= GOAL ? '#0EA5E9' : '#BAE6FD'}
            />
            {d.water > 0 && (
              <text x={x + barW / 2} y={Math.max(y - 3, PAD.t + 8)} textAnchor="middle" fontSize="8" fill="#0EA5E9">
                {d.water >= 1000 ? `${(d.water / 1000).toFixed(1)}L` : d.water}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={PAD.t + ch + 15}
              textAnchor="middle"
              fontSize="9"
              fill="#9ca3af"
              fontWeight={d.label === '今' ? '700' : '400'}
            >
              {d.label}
            </text>
          </g>
        );
      })}

      {[0, Math.round(maxV * 0.5), maxV].map(v => (
        <text
          key={v}
          x={PAD.l - 3}
          y={PAD.t + ch * (1 - v / maxV) + 4}
          textAnchor="end"
          fontSize="8"
          fill="#9ca3af"
        >
          {v >= 1000 ? `${(v / 1000).toFixed(1)}L` : v}
        </text>
      ))}
    </svg>
  );
}

export default function AnalyticsPanel({ profile }: AnalyticsPanelProps) {
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
          const intake = Object.values(rec.meals).flat().reduce((s, f) => s + f.calories, 0);
          const burn = rec.exercises.reduce((s, e) => s + e.calories, 0);
          const water = (rec.water || []).reduce((s, w) => s + w.amount, 0);
          computed.push({ date, label: weekdayLabel(date), intake, burn, water, net: intake - burn });
        } else {
          computed.push({ date, label: weekdayLabel(date), intake: 0, burn: 0, water: 0, net: 0 });
        }
      }

      setStats(computed);
      setLoading(false);
    }
    load();
  }, []);

  const targetCalories = profile ? calcTarget(profile) : 2000;
  const activeDays = stats.filter(d => d.intake > 0);
  const avgIntake = activeDays.length > 0
    ? Math.round(activeDays.reduce((s, d) => s + d.intake, 0) / activeDays.length)
    : 0;
  const avgWater = activeDays.length > 0
    ? Math.round(activeDays.reduce((s, d) => s + d.water, 0) / activeDays.length)
    : 0;
  const daysOnTarget = stats.filter(d => d.intake > 0 && d.net <= targetCalories).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasData = activeDays.length > 0;

  return (
    <div className="space-y-4">
      {!profile && (
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground text-center">
          完善个人信息后可获得专属目标热量对比
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white border border-border p-3 text-center">
          <p className="text-[10px] text-muted-foreground">日均摄入</p>
          <p className="text-xl font-black text-orange-500 mt-1 tabular-nums leading-none">
            {hasData ? avgIntake : '--'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">kcal</p>
        </div>
        <div className="rounded-2xl bg-white border border-border p-3 text-center">
          <p className="text-[10px] text-muted-foreground">均衡天数</p>
          <p className="text-xl font-black text-primary mt-1 tabular-nums leading-none">
            {hasData ? daysOnTarget : '--'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">/ 7 天</p>
        </div>
        <div className="rounded-2xl bg-white border border-border p-3 text-center">
          <p className="text-[10px] text-muted-foreground">日均饮水</p>
          <p className="text-xl font-black text-sky-500 mt-1 tabular-nums leading-none">
            {hasData
              ? avgWater >= 1000
                ? `${(avgWater / 1000).toFixed(1)}L`
                : avgWater
              : '--'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">ml</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-foreground">热量摄入趋势</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">近7天摄入 vs 目标</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-orange-400 rounded inline-block" />
              摄入
            </span>
            <span className="flex items-center gap-1 text-green-500">
              <span className="w-3 h-px border-t border-dashed border-green-400 inline-block" />
              目标
            </span>
          </div>
        </div>
        {hasData ? (
          <LineChart data={stats} targetCalories={targetCalories} />
        ) : (
          <div className="flex items-center justify-center h-28 text-xs text-muted-foreground/40">
            开始记录后，这里将展示摄入趋势
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-border p-4">
        <div className="mb-3">
          <p className="text-sm font-semibold text-foreground">饮水趋势</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">近7天每日饮水量</p>
        </div>
        {hasData ? (
          <WaterBarChart data={stats} />
        ) : (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/40">
            开始记录后，这里将展示饮水趋势
          </div>
        )}
      </div>
    </div>
  );
}
