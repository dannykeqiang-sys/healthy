import { useState } from 'react';

const CX = 90;
const CY = 90;
const R_PROTEIN = 65;
const R_CARBS = 50;
const R_FAT = 35;
const RING_SW = 12;

const C_PROTEIN = 2 * Math.PI * R_PROTEIN;
const C_CARBS = 2 * Math.PI * R_CARBS;
const C_FAT = 2 * Math.PI * R_FAT;

type HoverState = null | 'protein' | 'carbs' | 'fat';

interface MacroRingChartProps {
  intake: number;
  targetCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  hasData: boolean;
  compact?: boolean;
}

function calColor(pct: number): string {
  if (pct < 0.75) return '#22C55E';
  if (pct < 0.95) return '#F97316';
  return '#EF4444';
}

function macroColor(pct: number, base: string): string {
  return pct > 1.05 ? '#EF4444' : base;
}

function toRad(deg: number) { return (deg * Math.PI) / 180; }

interface LeaderLabelProps {
  ringR: number;
  attachAngle: number;
  labelY: number;
  name: string;
  actual: number;
  target: number;
  color: string;
  hasData: boolean;
  hovered: boolean;
}

function LeaderLabel({ ringR, attachAngle, labelY, name, actual, target, color, hasData, hovered }: LeaderLabelProps) {
  const outerEdge = ringR + RING_SW / 2 + 3;
  const px = CX + outerEdge * Math.cos(toRad(attachAngle));
  const py = CY + outerEdge * Math.sin(toRad(attachAngle));
  const elbowX = 163;
  const textX = 168;
  const diff = Math.round(actual - target);

  const nameSize = hovered ? 10.5 : 7.5;
  const valueSize = hovered ? 9.5 : 7;
  const diffSize = hovered ? 8.5 : 6.5;
  const lineW = hovered ? 1.5 : 0.75;
  const lineOp = hovered ? 0.9 : 0.45;

  return (
    <g opacity={hasData ? 1 : 0.4} style={{ transition: 'opacity 0.2s' }}>
      <line x1={px} y1={py} x2={elbowX} y2={labelY}
        stroke={color} strokeWidth={lineW}
        strokeOpacity={lineOp} strokeDasharray="2 2" />
      <line x1={elbowX} y1={labelY} x2={elbowX + 4} y2={labelY}
        stroke={color} strokeWidth={lineW} strokeOpacity={lineOp} />
      <text x={textX} y={labelY - 9} fill={color} fontSize={nameSize} fontWeight="700"
        style={{ transition: 'font-size 0.15s' }}>{name}</text>
      <text x={textX} y={labelY + 2} fill={hovered ? '#4B5563' : '#9CA3AF'} fontSize={valueSize}
        style={{ transition: 'font-size 0.15s' }}>
        {hasData ? `${actual}g / ${target}g` : `— / ${target}g`}
      </text>
      {hasData && (
        <text x={textX} y={labelY + 13} fill={diff > 0 ? '#EF4444' : '#22C55E'} fontSize={diffSize} fontWeight="600"
          style={{ transition: 'font-size 0.15s' }}>
          {diff > 0 ? `超 ${diff}g` : diff < 0 ? `还差 ${-diff}g` : '恰好达标'}
        </text>
      )}
    </g>
  );
}

export default function MacroRingChart({
  intake,
  targetCalories,
  protein,
  carbs,
  fat,
  proteinTarget,
  carbsTarget,
  fatTarget,
  hasData,
  compact = false,
}: MacroRingChartProps) {
  const [hovered, setHovered] = useState<HoverState>(null);

  const calPct = targetCalories > 0 ? Math.min(intake / targetCalories, 1) : 0;
  const cc = calColor(calPct);
  const calRemain = targetCalories - intake;

  const proteinPct = proteinTarget > 0 ? protein / proteinTarget : 0;
  const carbsPct = carbsTarget > 0 ? carbs / carbsTarget : 0;
  const fatPct = fatTarget > 0 ? fat / fatTarget : 0;

  const proteinFill = Math.min(proteinPct, 1) * C_PROTEIN;
  const carbsFill = Math.min(carbsPct, 1) * C_CARBS;
  const fatFill = Math.min(fatPct, 1) * C_FAT;

  const pc = macroColor(proteinPct, '#F97316');
  const cc2 = macroColor(carbsPct, '#6366F1');
  const fc = macroColor(fatPct, '#0EA5E9');

  const svgWidth = compact ? 180 : 258;

  const hoverProps = (key: HoverState) => ({
    onMouseEnter: () => setHovered(key),
    onMouseLeave: () => setHovered(null),
    onTouchStart: () => setHovered(prev => prev === key ? null : key),
    style: { cursor: 'pointer' },
  });

  const centerDisplay = () => {
    if (!hasData) {
      return (
        <text x={CX} y={CY + 6} textAnchor="middle" fill="#D1D5DB" fontSize={18} fontWeight="700">—</text>
      );
    }
    if (hovered === 'protein') {
      return (
        <>
          <text x={CX} y={CY + 4} textAnchor="middle" fill={pc} fontSize={22} fontWeight="900">{protein}</text>
          <text x={CX} y={CY + 17} textAnchor="middle" fill={pc} fontSize={9} fontWeight="600">g</text>
        </>
      );
    }
    if (hovered === 'carbs') {
      return (
        <>
          <text x={CX} y={CY + 4} textAnchor="middle" fill={cc2} fontSize={22} fontWeight="900">{carbs}</text>
          <text x={CX} y={CY + 17} textAnchor="middle" fill={cc2} fontSize={9} fontWeight="600">g</text>
        </>
      );
    }
    if (hovered === 'fat') {
      return (
        <>
          <text x={CX} y={CY + 4} textAnchor="middle" fill={fc} fontSize={22} fontWeight="900">{fat}</text>
          <text x={CX} y={CY + 17} textAnchor="middle" fill={fc} fontSize={9} fontWeight="600">g</text>
        </>
      );
    }
    return (
      <>
        <text x={CX} y={CY + 4} textAnchor="middle" fill="#1F2937" fontSize={22} fontWeight="900">{intake}</text>
        <text x={CX} y={CY + 17} textAnchor="middle" fill={cc} fontSize={9} fontWeight="600">kcal</text>
      </>
    );
  };

  return (
    <div className="flex flex-col items-center w-full">
      <svg
        viewBox={`0 0 ${svgWidth} 180`}
        style={{ overflow: 'visible', width: svgWidth, maxWidth: '100%', height: 'auto', display: 'block' }}
      >
        {/* 蛋白质环（最外） */}
        <circle cx={CX} cy={CY} r={R_PROTEIN} fill="none" stroke="#F3F4F6" strokeWidth={RING_SW}
          {...hoverProps('protein')} />
        {hasData && proteinFill > 0 && (
          <circle cx={CX} cy={CY} r={R_PROTEIN} fill="none"
            stroke={pc} strokeWidth={hovered === 'protein' ? RING_SW + 2 : RING_SW} strokeLinecap="round"
            strokeDasharray={`${proteinFill} ${C_PROTEIN}`}
            transform={`rotate(-90 ${CX} ${CY})`}
            {...hoverProps('protein')}
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1), stroke-width 0.15s, stroke 0.3s', cursor: 'pointer' }}
          />
        )}

        {/* 碳水环（中） */}
        <circle cx={CX} cy={CY} r={R_CARBS} fill="none" stroke="#F3F4F6" strokeWidth={RING_SW}
          {...hoverProps('carbs')} />
        {hasData && carbsFill > 0 && (
          <circle cx={CX} cy={CY} r={R_CARBS} fill="none"
            stroke={cc2} strokeWidth={hovered === 'carbs' ? RING_SW + 2 : RING_SW} strokeLinecap="round"
            strokeDasharray={`${carbsFill} ${C_CARBS}`}
            transform={`rotate(-90 ${CX} ${CY})`}
            {...hoverProps('carbs')}
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1), stroke-width 0.15s, stroke 0.3s', cursor: 'pointer' }}
          />
        )}

        {/* 脂肪环（最内） */}
        <circle cx={CX} cy={CY} r={R_FAT} fill="none" stroke="#F3F4F6" strokeWidth={RING_SW}
          {...hoverProps('fat')} />
        {hasData && fatFill > 0 && (
          <circle cx={CX} cy={CY} r={R_FAT} fill="none"
            stroke={fc} strokeWidth={hovered === 'fat' ? RING_SW + 2 : RING_SW} strokeLinecap="round"
            strokeDasharray={`${fatFill} ${C_FAT}`}
            transform={`rotate(-90 ${CX} ${CY})`}
            {...hoverProps('fat')}
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1), stroke-width 0.15s, stroke 0.3s', cursor: 'pointer' }}
          />
        )}

        {centerDisplay()}

        {/* 引线标签（非紧凑模式） */}
        {!compact && (
          <>
            <LeaderLabel ringR={R_PROTEIN} attachAngle={-45} labelY={32}
              name="蛋白质" actual={protein} target={proteinTarget} color={pc} hasData={hasData} hovered={hovered === 'protein'} />
            <LeaderLabel ringR={R_CARBS} attachAngle={3} labelY={90}
              name="碳水" actual={carbs} target={carbsTarget} color={cc2} hasData={hasData} hovered={hovered === 'carbs'} />
            <LeaderLabel ringR={R_FAT} attachAngle={50} labelY={148}
              name="脂肪" actual={fat} target={fatTarget} color={fc} hasData={hasData} hovered={hovered === 'fat'} />
          </>
        )}
      </svg>

      {/* 总热量进度条（非紧凑模式） */}
      {!compact && (
        <div className="px-3 mt-1 space-y-1" style={{ width: svgWidth, maxWidth: '100%' }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground font-medium">总热量</span>
            <span className="text-[10px] tabular-nums text-foreground/80 font-semibold">
              {intake}
              <span className="font-normal text-muted-foreground"> / {targetCalories} kcal</span>
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-gray-100">
            {hasData ? (
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(calPct * 100, 100)}%`, backgroundColor: cc }}
              />
            ) : null}
          </div>
          {hasData && (
            <p className="text-right text-[9px] font-semibold tabular-nums" style={{ color: calRemain < 0 ? '#EF4444' : '#22C55E' }}>
              {calRemain < 0 ? `超出 ${-calRemain}` : `还可摄入 ${calRemain}`} kcal
            </p>
          )}
        </div>
      )}

      {/* 图例点（紧凑模式） */}
      {compact && (
        <div className="flex items-center gap-3 -mt-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: '#F97316' }} />
            <span className="text-[10px] text-muted-foreground">蛋白质</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: '#6366F1' }} />
            <span className="text-[10px] text-muted-foreground">碳水</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: '#0EA5E9' }} />
            <span className="text-[10px] text-muted-foreground">脂肪</span>
          </div>
        </div>
      )}
    </div>
  );
}
