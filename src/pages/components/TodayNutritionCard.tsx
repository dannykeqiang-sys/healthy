import { Activity, Zap } from 'lucide-react';
import type { DailyRecord, FoodItem } from '../../types';

const ANTI_KW = [
  '蔬菜', '菠菜', '西兰花', '芹菜', '胡萝卜', '番茄', '西红柿', '黄瓜', '生菜',
  '牛油果', '鳄梨', '三文鱼', '金枪鱼', '鳕鱼', '沙丁鱼', '带鱼', '深海鱼',
  '核桃', '杏仁', '腰果', '亚麻籽', '蓝莓', '草莓', '橙子', '苹果', '猕猴桃',
  '豆腐', '豆浆', '燕麦', '全麦', '红豆', '黑豆', '绿茶', '橄榄油',
];

const PRO_KW = [
  '炸鸡', '薯条', '炸薯', '汉堡', '披萨', '饼干', '蛋糕', '奶油', '甜甜圈',
  '可乐', '雪碧', '含糖饮料', '奶茶', '香肠', '培根', '腊肉', '腊肠', '烤串', '火腿肠',
];

function calcInflammationScore(foods: FoodItem[]): number {
  if (foods.length === 0) return -1;
  let score = 50;
  for (const food of foods) {
    const n = food.name;
    if (ANTI_KW.some(kw => n.includes(kw))) score += 6;
    if (PRO_KW.some(kw => n.includes(kw))) score -= 10;
  }
  const totalCal = foods.reduce((s, f) => s + f.calories, 0);
  if (totalCal > 100) {
    const carbCal = foods.reduce((s, f) => s + (f.carbs ?? 0) * 4, 0);
    const carbRatio = carbCal / totalCal;
    if (carbRatio > 0.65) score -= 8;
    if (carbRatio < 0.4) score += 5;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getScoreInfo(score: number): { label: string; color: string; desc: string } {
  if (score < 0) return { label: '暂无数据', color: '#9CA3AF', desc: '记录今日饮食后查看你的炎症指数' };
  if (score >= 75) return { label: '优秀抗炎', color: '#16A34A', desc: '今日饮食以抗炎食物为主，身体在悄悄感谢你' };
  if (score >= 55) return { label: '较好抗炎', color: '#65A30D', desc: '饮食结构不错，多吃深色蔬菜会更好' };
  if (score >= 40) return { label: '中性平衡', color: '#D97706', desc: '可以增加蔬菜和优质蛋白的比例' };
  return { label: '偏高炎症', color: '#DC2626', desc: '减少加工食品，多吃蔬果和深海鱼' };
}

interface TodayNutritionCardProps {
  record: DailyRecord;
}

export default function TodayNutritionCard({ record }: TodayNutritionCardProps) {
  const allFoods = Object.values(record.meals).flat();
  const protein = Math.round(allFoods.reduce((s, f) => s + (f.protein ?? 0), 0));
  const carbs = Math.round(allFoods.reduce((s, f) => s + (f.carbs ?? 0), 0));
  const fat = Math.round(allFoods.reduce((s, f) => s + (f.fat ?? 0), 0));
  const gramTotal = protein + carbs + fat;

  const proteinPct = gramTotal > 0 ? Math.round((protein / gramTotal) * 100) : 33;
  const carbsPct = gramTotal > 0 ? Math.round((carbs / gramTotal) * 100) : 34;
  const fatPct = gramTotal > 0 ? 100 - proteinPct - carbsPct : 33;

  const score = calcInflammationScore(allFoods);
  const { label: scoreLabel, color: scoreColor, desc: scoreDesc } = getScoreInfo(score);
  const hasData = allFoods.length > 0;

  const macros = [
    { label: '蛋白质', value: protein, unit: 'g', color: '#F97316', pct: proteinPct },
    { label: '碳水', value: carbs, unit: 'g', color: '#6366F1', pct: carbsPct },
    { label: '脂肪', value: fat, unit: 'g', color: '#0EA5E9', pct: fatPct },
  ];

  const indicatorPct = score >= 0 ? Math.max(3, Math.min(97, 100 - score)) : 50;

  return (
    <div className="rounded-2xl bg-white border border-border shadow-sm overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F97316, #6366F1)' }}
          >
            <Activity className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-sm font-bold text-foreground">今日营养概览</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {macros.map(m => (
            <div
              key={m.label}
              className="flex flex-col items-center py-3 rounded-xl"
              style={{ backgroundColor: `${m.color}0f` }}
            >
              <p className="text-xl font-bold leading-none" style={{ color: m.color }}>
                {hasData ? m.value : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">{m.unit} {m.label}</p>
            </div>
          ))}
        </div>

        {hasData ? (
          <div className="space-y-1.5">
            <div className="flex rounded-full overflow-hidden h-2.5">
              {macros.map(m => (
                <div
                  key={m.label}
                  style={{
                    width: `${m.pct}%`,
                    backgroundColor: m.color,
                    transition: 'width 0.6s ease',
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between px-0.5">
              {macros.map(m => (
                <div key={m.label} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-[10px] text-muted-foreground">{m.pct}% {m.label.slice(0, 2)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-2.5 rounded-full bg-muted/60" />
        )}
      </div>

      <div className="mx-4 border-t border-border/50" />

      <div className="p-4 pt-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" style={{ color: scoreColor }} />
            <p className="text-sm font-semibold text-foreground">炎症指数</p>
          </div>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ color: scoreColor, backgroundColor: `${scoreColor}18` }}
          >
            {scoreLabel}
          </span>
        </div>

        <div className="relative mb-1.5">
          <div
            className="h-2.5 rounded-full overflow-hidden"
            style={{ background: 'linear-gradient(to right, #16A34A, #84CC16, #F59E0B, #EF4444)' }}
          />
          {hasData && (
            <div
              className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md"
              style={{
                left: `${indicatorPct}%`,
                transform: 'translateX(-50%) translateY(-50%)',
                backgroundColor: scoreColor,
                transition: 'left 0.6s ease',
              }}
            />
          )}
        </div>

        <div className="flex justify-between text-[10px] text-muted-foreground mb-2">
          <span>抗炎</span>
          <span>中性</span>
          <span>促炎</span>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">{scoreDesc}</p>
      </div>
    </div>
  );
}
