import { useState, useRef } from 'react';
import type { DayStats } from './AIHealingCard';

interface WaterWeightChartProps {
  stats: DayStats[];
  baseWeight: number;
}

function formatDate(date: string): string {
  const d = new Date(date + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface WeightPoint {
  date: string;
  weight: number | null;
}

function loadWeightLog(dates: string[], baseWeight: number): WeightPoint[] {
  return dates.map(date => {
    const raw = localStorage.getItem(`weight_log_${date}`);
    if (raw) {
      const v = parseFloat(raw);
      return { date, weight: isNaN(v) ? null : v };
    }
    return { date, weight: null };
  });
}

function WaterLegend() {
  return (
    <div className="flex flex-col gap-1 items-end">
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span className="w-3 h-2.5 rounded-sm inline-block" style={{ background: '#0EA5E9' }} />
        纯水
      </span>
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span className="w-3 h-2.5 rounded-sm inline-block" style={{ background: '#BAE6FD' }} />
        食物水
      </span>
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span className="w-4 h-0.5 rounded-full inline-block" style={{ background: '#22C55E' }} />
        体重
      </span>
    </div>
  );
}

export default function WaterWeightChart({ stats, baseWeight }: WaterWeightChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tipIdx, setTipIdx] = useState<number | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasWater = stats.some(d => d.water > 0);

  const dates = stats.map(d => d.date);
  const weightLog = loadWeightLog(dates, baseWeight);

  const W = 320;
  const H = 180;
  const PAD = { t: 20, r: 18, b: 32, l: 42 };
  const cw = W - PAD.l - PAD.r;
  const ch = H - PAD.t - PAD.b;

  const n = stats.length;
  const xStep = n > 1 ? cw / (n - 1) : cw;
  const barW = Math.max(10, xStep * 0.55);
  const toX = (i: number) => PAD.l + i * xStep;

  const maxWater = Math.max(...stats.map(d => d.water), 800, 1);
  const waterGoal = 1500;
  const toWY = (v: number) => PAD.t + ch * (1 - Math.min(v, maxWater * 1.1) / (maxWater * 1.1));
  const goalY = toWY(waterGoal);

  const validWeights = weightLog.filter(w => w.weight !== null).map(w => w.weight as number);
  const base = baseWeight > 0 ? baseWeight : 60;
  const allWeights = validWeights.length > 0 ? validWeights : [base];
  const minW = Math.min(...allWeights, base) - 1.5;
  const maxW = Math.max(...allWeights, base) + 1.5;
  const healthMin = base * 0.98;
  const healthMax = base * 1.02;

  const toWeightY = (v: number) => PAD.t + ch * (1 - (v - minW) / (maxW - minW));

  const weightPts: [number, number][] = weightLog
    .map((w, i) => (w.weight !== null ? ([toX(i), toWeightY(w.weight)] as [number, number]) : null))
    .filter((p): p is [number, number] => p !== null);

  function weightPath(pts: [number, number][]): string {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0][0]},${pts[0][1]}`;
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i - 1][0] + pts[i][0]) / 2;
      d += ` C ${cpx},${pts[i - 1][1]} ${cpx},${pts[i][1]} ${pts[i][0]},${pts[i][1]}`;
    }
    return d;
  }

  const showTip = (i: number) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setTipIdx(i);
  };
  const hideTip = () => {
    hideTimer.current = setTimeout(() => setTipIdx(null), 180);
  };

  const yTicks = [0, Math.round(maxWater * 0.55), Math.round(maxWater)].map(v => ({
    v,
    y: toWY(v),
    label: v >= 1000 ? `${(v / 1000).toFixed(1)}L` : `${v}`,
  }));

  const healthBandY1 = toWeightY(healthMax);
  const healthBandY2 = toWeightY(healthMin);

  return (
    <div
      className="rounded-3xl p-4 border border-white/50"
      style={{
        background: 'rgba(255,255,255,0.42)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-foreground">水分与体重节律</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">纯水 + 食物水分 · 体重趋势</p>
        </div>
        <WaterLegend />
      </div>

      {hasWater ? (
        <div className="relative">
          <svg
            ref={svgRef}
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            style={{ overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="pureWaterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="foodWaterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {yTicks.map(({ v, y, label }) => (
              <g key={v}>
                <line
                  x1={PAD.l} y1={y} x2={PAD.l + cw} y2={y}
                  stroke="#e5e7eb" strokeWidth="0.6" strokeDasharray="3,3"
                />
                <text x={PAD.l - 4} y={y + 3.5} textAnchor="end" fontSize="8.5" fill="#9ca3af">
                  {label}
                </text>
              </g>
            ))}

            <line
              x1={PAD.l} y1={goalY} x2={PAD.l + cw} y2={goalY}
              stroke="#0EA5E9" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.5"
            />
            <text x={PAD.l + cw + 2} y={goalY + 3} fontSize="7.5" fill="#0EA5E9" opacity="0.7">目标</text>

            <rect
              x={PAD.l}
              y={healthBandY1}
              width={cw}
              height={Math.max(0, healthBandY2 - healthBandY1)}
              fill="rgba(34,197,94,0.10)"
              rx="2"
            />

            {stats.map((d, i) => {
              const bx = toX(i) - barW / 2;
              const totalH = ch - (toWY(d.water) - PAD.t);
              const pureRatio = d.water > 0 ? d.pureWater / d.water : 0;
              const pureH = totalH * pureRatio;
              const foodH = totalH * (1 - pureRatio);
              const foodY = PAD.t + ch - totalH;
              const pureY = foodY + foodH;
              return (
                <g key={d.date}>
                  {d.foodWater > 0 && (
                    <rect
                      x={bx} y={foodY}
                      width={barW} height={Math.max(0, foodH)}
                      fill="url(#foodWaterGrad)"
                      rx="2"
                    />
                  )}
                  {d.pureWater > 0 && (
                    <rect
                      x={bx} y={pureY}
                      width={barW} height={Math.max(0, pureH)}
                      fill="url(#pureWaterGrad)"
                      rx="2"
                    />
                  )}
                  <rect
                    x={bx} y={PAD.t} width={barW} height={ch}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => showTip(i)}
                    onMouseLeave={hideTip}
                    onTouchStart={e => { e.preventDefault(); showTip(i); }}
                    onTouchEnd={hideTip}
                  />
                  {d.water > 0 && (
                    <text
                      x={toX(i)} y={toWY(d.water) - 4}
                      textAnchor="middle" fontSize="7" fill="#0EA5E9" fontWeight="600"
                    >
                      {d.water >= 1000 ? `${(d.water / 1000).toFixed(1)}L` : d.water}
                    </text>
                  )}
                </g>
              );
            })}

            {weightPts.length > 1 && (
              <path
                d={weightPath(weightPts)}
                fill="none"
                stroke="#22C55E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
            )}

            {weightLog.map((w, i) => {
              if (w.weight === null) return null;
              return (
                <circle
                  key={w.date}
                  cx={toX(i)}
                  cy={toWeightY(w.weight)}
                  r="3"
                  fill="#22C55E"
                  stroke="white"
                  strokeWidth="1.5"
                />
              );
            })}

            {stats.map((d, i) => (
              <text
                key={d.date}
                x={toX(i)} y={PAD.t + ch + 18}
                textAnchor="middle" fontSize="9" fill="#9ca3af"
                fontWeight={d.label === '今' ? '700' : '400'}
              >
                {d.label}
              </text>
            ))}
          </svg>

          {tipIdx !== null && (
            <div
              className="absolute pointer-events-none z-30"
              style={{
                left: `${(toX(tipIdx) / W) * 100}%`,
                top: 0,
                transform: 'translate(-50%, -8px)',
              }}
            >
              <div
                className="rounded-xl border border-white/70 shadow-xl text-xs min-w-[120px] overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(14px)' }}
              >
                <div className="px-3 py-1.5 border-b border-black/5 text-center">
                  <p className="font-bold text-foreground text-[10px]">
                    {stats[tipIdx].label} · {formatDate(stats[tipIdx].date)}
                  </p>
                </div>
                <div className="px-3 py-2 space-y-1">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground text-[10px]">纯水</span>
                    <span className="text-[10px] font-semibold tabular-nums" style={{ color: '#0EA5E9' }}>
                      {stats[tipIdx].pureWater}ml
                    </span>
                  </div>
                  {stats[tipIdx].foodWater > 0 && (
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground text-[10px]">食物水</span>
                      <span className="text-[10px] font-semibold tabular-nums" style={{ color: '#7DD3FC' }}>
                        +{stats[tipIdx].foodWater}ml
                      </span>
                    </div>
                  )}
                  {weightLog[tipIdx]?.weight !== null && (
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground text-[10px]">体重</span>
                      <span className="text-[10px] font-semibold tabular-nums" style={{ color: '#22C55E' }}>
                        {weightLog[tipIdx].weight}kg
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-28 text-xs text-muted-foreground/40 tracking-wide">
          开始记录饮水后，将展示水分与体重节律
        </div>
      )}

      <div
        className="rounded-2xl px-3.5 py-2.5 border border-white/60 mt-3"
        style={{ background: 'rgba(255,255,255,0.55)' }}
      >
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground/80">绿色区间 · </span>
          {baseWeight > 0
            ? `体重健康波动范围 ${(baseWeight * 0.98).toFixed(1)}–${(baseWeight * 1.02).toFixed(1)} kg`
            : '设置体重后将显示健康波动区间'}
        </p>
      </div>
    </div>
  );
}
