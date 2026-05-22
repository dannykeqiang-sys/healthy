import { useMemo } from 'react';
import type { DayStats } from './AIHealingCard';

interface MacroRhythmBarsProps {
  stats: DayStats[];
  targetCalories: number;
}

interface MacroSummary {
  protein: number;
  carbs: number;
  fat: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

function calcMacroSummary(stats: DayStats[], targetCalories: number): MacroSummary {
  const days = stats.filter(d => d.intake > 0).length || 1;
  const avgProtein = stats.reduce((s, d) => s + d.protein, 0) / days;
  const avgCarbs = stats.reduce((s, d) => s + d.carbs, 0) / days;
  const avgFat = stats.reduce((s, d) => s + d.fat, 0) / days;

  const target = targetCalories > 0 ? targetCalories : 2000;
  const targetProtein = (target * 0.25) / 4;
  const targetCarbs = (target * 0.50) / 4;
  const targetFat = (target * 0.25) / 9;

  return {
    protein: Math.round(avgProtein),
    carbs: Math.round(avgCarbs),
    fat: Math.round(avgFat),
    targetProtein: Math.round(targetProtein),
    targetCarbs: Math.round(targetCarbs),
    targetFat: Math.round(targetFat),
  };
}

function buildTip(protein: number, carbs: number, fat: number, tp: number, tc: number, tf: number): string {
  const pp = tp > 0 ? Math.round((protein / tp) * 100) : 0;
  const cp = tc > 0 ? Math.round((carbs / tc) * 100) : 0;
  const fp = tf > 0 ? Math.round((fat / tf) * 100) : 0;

  if (pp < 70) return `蛋白质摄入 ${pp}%，建议明早加颗蛋或一杯纯牛奶补充约 ${Math.round((tp - protein))}g`;
  if (cp > 120) return `碳水偏高（${cp}%），明天主食减半碗，多吃绿叶菜`;
  if (fp > 120) return `脂肪略超（${fp}%），少选油炸类食物，偏向清蒸或水煮`;
  if (cp < 70) return `碳水不足（${cp}%），能量来源偏少，可加一小把燕麦或杂粮`;
  if (pp >= 90 && cp >= 80 && fp <= 110) return `三大营养素均衡，继续保持这个好节律`;
  return `蛋白 ${pp}% · 碳水 ${cp}% · 脂肪 ${fp}%，营养分配较合理`;
}

interface BarProps {
  label: string;
  unit: string;
  value: number;
  target: number;
  color: string;
  trackColor: string;
  gradientFrom: string;
  gradientTo: string;
}

function MacroBar({ label, unit, value, target, color, trackColor, gradientFrom, gradientTo }: BarProps) {
  const pct = target > 0 ? Math.min(120, (value / target) * 100) : 0;
  const over = pct > 100;
  const displayPct = Math.min(100, pct);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color }}>{label}</span>
        <span className="text-[11px] tabular-nums" style={{ color }}>
          {value}
          <span className="text-muted-foreground font-normal">/{target}{unit}</span>
        </span>
      </div>
      <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: trackColor }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${displayPct}%`,
            background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
            boxShadow: over ? `0 0 6px ${gradientTo}80` : 'none',
          }}
        />
        {over && (
          <div
            className="absolute right-0 top-0 h-full w-1 rounded-r-full"
            style={{ background: `${gradientTo}cc` }}
          />
        )}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground/60">
        <span>0</span>
        <span className={over ? 'text-red-400' : ''}>{over ? `超标 ${Math.round(pct - 100)}%` : `${Math.round(pct)}%`}</span>
        <span>{target}{unit}</span>
      </div>
    </div>
  );
}

export default function MacroRhythmBars({ stats, targetCalories }: MacroRhythmBarsProps) {
  const hasData = stats.some(d => d.intake > 0);

  const macro = useMemo(() => calcMacroSummary(stats, targetCalories), [stats, targetCalories]);
  const tip = useMemo(
    () => buildTip(macro.protein, macro.carbs, macro.fat, macro.targetProtein, macro.targetCarbs, macro.targetFat),
    [macro],
  );

  return (
    <div
      className="rounded-3xl p-4 border border-white/50"
      style={{
        background: 'rgba(255,255,255,0.42)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-foreground">营养节律条</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">日均 P / C / F 摄入 vs 目标</p>
        </div>
        <span className="text-[10px] text-muted-foreground bg-white/60 border border-white/60 rounded-full px-2 py-0.5">
          近 7 天均值
        </span>
      </div>

      {hasData ? (
        <div className="space-y-4">
          <MacroBar
            label="蛋白质 P"
            unit="g"
            value={macro.protein}
            target={macro.targetProtein}
            color="#3B82F6"
            trackColor="rgba(59,130,246,0.10)"
            gradientFrom="#93C5FD"
            gradientTo="#3B82F6"
          />
          <MacroBar
            label="碳水 C"
            unit="g"
            value={macro.carbs}
            target={macro.targetCarbs}
            color="#F59E0B"
            trackColor="rgba(245,158,11,0.10)"
            gradientFrom="#FDE68A"
            gradientTo="#F59E0B"
          />
          <MacroBar
            label="脂肪 F"
            unit="g"
            value={macro.fat}
            target={macro.targetFat}
            color="#F43F5E"
            trackColor="rgba(244,63,94,0.10)"
            gradientFrom="#FDA4AF"
            gradientTo="#F43F5E"
          />

          <div
            className="rounded-2xl px-3.5 py-2.5 border border-white/60 mt-1"
            style={{ background: 'rgba(255,255,255,0.55)' }}
          >
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground/80">AI 补位建议 · </span>
              {tip}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 text-xs text-muted-foreground/40 tracking-wide">
          记录饮食后，将展示三大营养素节律
        </div>
      )}
    </div>
  );
}
