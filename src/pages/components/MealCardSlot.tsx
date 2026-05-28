import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Pencil, X, ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { Input } from '@/components/shadcn/input';
import { safeNormalizeString } from '../../utils/stringUtils';
import type { FoodItem } from '../../types';

export interface MacroTarget {
  protein: number;
  carbs: number;
  fat: number;
  isRedistributed: boolean;
}

export interface MealSlotConfig {
  label: string;
  en: string;
  num: string;
  icon: React.ElementType;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  accent: string;
  time: string;
  placeholder: string;
  imageUrl?: string;
}

interface MealCardSlotProps {
  config: MealSlotConfig;
  items: FoodItem[];
  isActive: boolean;
  isHighlighted: boolean;
  macroTarget?: MacroTarget;
  fullscreen?: boolean;
  onAdd: (item: FoodItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (item: FoodItem) => void;
}

type FoodGroup = { name: string; items: FoodItem[] };
type ChipKey = 'protein' | 'carbs' | 'fat';

const ADD_PRAISES = [
  '加入啦！吃得开心，也要吃得明白',
  '记录下来了，继续保持',
  '每一口都被看见，很棒',
  '饮食有记录，身体有感知',
];

function groupItems(items: FoodItem[]): FoodGroup[] {
  const map = new Map<string, FoodItem[]>();
  for (const item of items) {
    const existing = map.get(item.name);
    if (existing) existing.push(item);
    else map.set(item.name, [item]);
  }
  return Array.from(map.values()).map(arr => ({ name: arr[0].name, items: arr }));
}

function getUnit(foodName: string): string {
  if (/鸡蛋|鸭蛋|卤蛋|水煮蛋|荷包蛋|溏心蛋|皮蛋|茶叶蛋/.test(foodName)) return '个';
  if (/苹果|橙子|香蕉|梨|桃|橘子|柑|猕猴桃|芒果|荔枝|龙眼|樱桃|葡萄柚/.test(foodName)) return '个';
  if (/汤圆|丸子/.test(foodName)) return '颗';
  if (/米饭|白饭|燕麦|粥|糙米|杂粮/.test(foodName)) return '碗';
  if (/面条|拉面|拌面|炒面|意面|米线|河粉|乌冬/.test(foodName)) return '碗';
  if (/汤|羹/.test(foodName)) return '碗';
  if (/咖啡|奶茶|拿铁|美式|豆浆|牛奶|果汁|饮料|汽水|可乐|啤酒/.test(foodName)) return '杯';
  if (/面包|吐司|饼干|蛋糕/.test(foodName)) return '片';
  return '份';
}

function getMealRatio(label: string): number {
  if (label.includes('早')) return 0.25;
  if (label.includes('午')) return 0.35;
  if (label.includes('晚')) return 0.30;
  return 0.10;
}

interface MacroSource {
  name: string;
  val: number;
  pct: number;
}

function getTopSources(macro: ChipKey, items: FoodItem[]): MacroSource[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const val = (item[macro] as number | undefined) ?? 0;
    if (val > 0) map.set(item.name, (map.get(item.name) ?? 0) + val);
  }
  const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
  if (total === 0) return [];
  return Array.from(map.entries())
    .map(([name, val]) => ({ name, val: Math.round(val), pct: Math.round((val / total) * 100) }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 4);
}

const CHIP_CONFIGS: Record<ChipKey, { label: string; fullLabel: string; color: string }> = {
  protein: { label: '蛋白质', fullLabel: '蛋白质', color: '#3B82F6' },
  carbs: { label: '碳水', fullLabel: '碳水化合物', color: '#F59E0B' },
  fat: { label: '脂肪', fullLabel: '脂肪', color: '#EF4444' },
};

interface ToastState {
  msg: string;
  type: 'info' | 'success';
  onUndo?: () => void;
}

interface MacroChipsProps {
  items: FoodItem[];
  protein: number;
  carbs: number;
  fat: number;
  macroTarget?: MacroTarget;
  onSelect: (key: ChipKey) => void;
}

function MacroChips({ items, protein, carbs, fat, macroTarget, onSelect }: MacroChipsProps) {
  const hasMacros = protein > 0 || carbs > 0 || fat > 0;
  if (!hasMacros) return (
    <p className="mt-3 text-[9px] text-muted-foreground/35 text-center">用 AI 估算食物可自动获取三大营养素</p>
  );

  const chips: { key: ChipKey; value: number; target?: number }[] = [
    { key: 'protein', value: protein, target: macroTarget?.protein },
    { key: 'carbs', value: carbs, target: macroTarget?.carbs },
    { key: 'fat', value: fat, target: macroTarget?.fat },
  ];

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        {chips.map(chip => {
          const cfg = CHIP_CONFIGS[chip.key];
          const pct = chip.target && chip.target > 0 ? Math.min((chip.value / chip.target) * 100, 100) : 0;
          const isOver = chip.target && chip.value > chip.target;
          const barColor = isOver ? '#EF4444' : cfg.color;
          const sources = getTopSources(chip.key, items);
          const canExpand = sources.length > 0;

          return (
            <button
              key={chip.key}
              onClick={() => canExpand && onSelect(chip.key)}
              className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1.5 px-1 rounded-xl transition-all active:scale-95"
              style={{
                background: `${cfg.color}12`,
                border: `1px solid ${cfg.color}22`,
                cursor: canExpand ? 'pointer' : 'default',
              }}
            >
              <span className="text-[12px] font-black tabular-nums leading-none" style={{ color: isOver ? '#EF4444' : cfg.color }}>
                {chip.value}g
              </span>
              <span className="text-[9px] text-muted-foreground/55 mt-0.5">{cfg.label}</span>
              {chip.target ? (
                <div className="w-full px-1.5 mt-1.5">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: `${cfg.color}18` }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-1.5 h-1" />
              )}
              {canExpand && (
                <ChevronDown className="w-2.5 h-2.5 mt-0.5" style={{ color: `${cfg.color}60` }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface MacroOverlayProps {
  macroKey: ChipKey;
  items: FoodItem[];
  macroTarget?: MacroTarget;
  onClose: () => void;
}

function MacroOverlay({ macroKey, items, macroTarget, onClose }: MacroOverlayProps) {
  const cfg = CHIP_CONFIGS[macroKey];
  const sources = getTopSources(macroKey, items);
  const actual = Math.round(items.reduce((s, f) => s + ((f[macroKey] as number | undefined) ?? 0), 0));
  const target = macroTarget?.[macroKey];
  const pct = target && target > 0 ? Math.min((actual / target) * 100, 100) : null;
  const isOver = target && actual > target;
  const barColor = isOver ? '#EF4444' : cfg.color;
  const valueColor = isOver ? '#EF4444' : cfg.color;

  return (
    <div
      className="absolute inset-0 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(5px)', zIndex: 30 }}
      onClick={onClose}
    >
      <div
        className="rounded-t-3xl px-5 pt-5 pb-6 space-y-4"
        style={{
          background: 'rgba(255,255,255,0.97)',
          animation: 'sheetSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
            <span className="text-base font-black text-foreground">{cfg.fullLabel}</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer active:scale-90"
            style={{ background: 'rgba(0,0,0,0.07)' }}
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-end gap-1">
          <span className="text-3xl font-black tabular-nums leading-none" style={{ color: valueColor }}>
            {actual}
          </span>
          <span className="text-base text-muted-foreground mb-0.5">g</span>
          {target && (
            <span className="text-sm text-muted-foreground/45 mb-1 ml-1">/ {target}g 目标</span>
          )}
        </div>

        {pct !== null && (
          <div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: `${cfg.color}15` }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground/40">0g</span>
              <span className="text-[10px] font-bold tabular-nums" style={{ color: valueColor }}>
                {Math.round(pct)}%
              </span>
              <span className="text-[10px] text-muted-foreground/40">{target}g</span>
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider">来源分布</p>
            {sources.map(s => (
              <div key={s.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-foreground/75 truncate max-w-[65%]">{s.name}</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: cfg.color }}>
                    {s.val}g · {s.pct}%
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: `${cfg.color}15` }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${s.pct}%`, backgroundColor: cfg.color, opacity: 0.65 }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface EditFoodSheetProps {
  group: FoodGroup;
  accent: string;
  onSave: (name: string, caloriesPerUnit: number, count: number) => void;
  onClose: () => void;
}

function EditFoodSheet({ group, accent, onSave, onClose }: EditFoodSheetProps) {
  const base = group.items[0];
  const unit = getUnit(group.name);
  const [editName, setEditName] = useState(group.name);
  const [editCalories, setEditCalories] = useState(String(base.calories));
  const [count, setCount] = useState(group.items.length);
  const [error, setError] = useState('');

  const calNum = Number(editCalories);
  const totalPreview = !isNaN(calNum) && calNum > 0 ? Math.round(calNum * count) : 0;

  const handleSave = () => {
    if (!editName.trim()) { setError('食物名称不能为空'); return; }
    const cal = Number(editCalories);
    if (isNaN(cal) || cal <= 0) { setError('热量必须大于 0'); return; }
    if (count < 1) { setError('份数至少为 1'); return; }
    setError('');
    onSave(safeNormalizeString(editName.trim()), cal, count);
  };

  return (
    <div
      className="absolute inset-0 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(5px)', zIndex: 30 }}
      onClick={onClose}
    >
      <div
        className="rounded-t-3xl px-5 pt-5 pb-6 space-y-4"
        style={{
          background: 'rgba(255,255,255,0.97)',
          animation: 'sheetSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-base font-black text-foreground">编辑食物</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer active:scale-90"
            style={{ background: 'rgba(0,0,0,0.07)' }}
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] text-muted-foreground/55 font-semibold uppercase tracking-widest mb-1.5">
              食物名称
            </label>
            <input
              autoFocus
              value={editName}
              onChange={e => { setEditName(e.target.value); setError(''); }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSave();
                if (e.key === 'Escape') onClose();
              }}
              className="w-full text-sm bg-white border rounded-xl px-3.5 py-2.5 outline-none transition-shadow"
              style={{ borderColor: error && !editName.trim() ? '#EF4444' : `${accent}35` }}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}30`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted-foreground/55 font-semibold uppercase tracking-widest mb-1.5">
              每{unit}热量 (kcal)
            </label>
            <input
              type="number"
              value={editCalories}
              onChange={e => { setEditCalories(e.target.value); setError(''); }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSave();
                if (e.key === 'Escape') onClose();
              }}
              className="w-full text-sm bg-white border rounded-xl px-3.5 py-2.5 outline-none transition-shadow"
              style={{ borderColor: error && (isNaN(Number(editCalories)) || Number(editCalories) <= 0) ? '#EF4444' : `${accent}35` }}
              onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}30`; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          {error && (
            <p className="text-[11px] text-red-500 font-medium">{error}</p>
          )}
        </div>

        <div
          className="flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{ background: `${accent}08`, border: `1px solid ${accent}20` }}
        >
          <span className="text-sm font-semibold text-foreground/70">份数</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCount(c => Math.max(1, c - 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
              style={{ backgroundColor: `${accent}18`, color: accent }}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-base font-black tabular-nums w-12 text-center" style={{ color: accent }}>
              {count}{unit}
            </span>
            <button
              onClick={() => setCount(c => c + 1)}
              className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
              style={{ backgroundColor: `${accent}18`, color: accent }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-sm font-bold tabular-nums" style={{ color: accent }}>{totalPreview} kcal</span>
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-sm text-muted-foreground cursor-pointer active:scale-95 transition-transform border"
            style={{ borderColor: 'rgba(0,0,0,0.1)' }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl text-sm text-white font-bold cursor-pointer active:scale-95 transition-transform"
            style={{ backgroundColor: accent }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MealCardSlot({
  config,
  items,
  isActive,
  isHighlighted,
  macroTarget,
  fullscreen = false,
  onAdd,
  onRemove,
  onUpdate,
}: MealCardSlotProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [expandedGroupName, setExpandedGroupName] = useState<string | null>(null);
  const [macroOverlay, setMacroOverlay] = useState<ChipKey | null>(null);
  const [editSheet, setEditSheet] = useState<FoodGroup | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const Icon = config.icon;
  const total = items.reduce((s, f) => s + f.calories, 0);
  const totalProtein = Math.round(items.reduce((s, f) => s + (f.protein ?? 0), 0));
  const totalCarbs = Math.round(items.reduce((s, f) => s + (f.carbs ?? 0), 0));
  const totalFat = Math.round(items.reduce((s, f) => s + (f.fat ?? 0), 0));

  const groups = groupItems(items);
  const showDetails = !fullscreen || isActive;

  const mealRatio = getMealRatio(config.label);
  const defaultTarget: MacroTarget = {
    protein: Math.max(1, Math.round(125 * mealRatio)),
    carbs: Math.max(1, Math.round(250 * mealRatio)),
    fat: Math.max(1, Math.round(56 * mealRatio)),
    isRedistributed: false,
  };
  const resolvedMacroTarget = macroTarget ?? defaultTarget;

  const showToast = (msg: string, type: 'info' | 'success' = 'info', onUndo?: () => void) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type, onUndo });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    const cal = Number(calories);
    if (!calories || isNaN(cal) || cal <= 0) return;
    onAdd({
      id: crypto.randomUUID(),
      name: safeNormalizeString(name.trim()),
      calories: cal,
    });
    setName('');
    setCalories('');
    showToast(ADD_PRAISES[Math.floor(Math.random() * ADD_PRAISES.length)], 'success');
  };

  const handleDelete = (group: FoodGroup) => {
    const snapshot = [...group.items];
    group.items.forEach(i => onRemove(i.id));
    showToast(`已删除「${group.name}」`, 'info', () => {
      snapshot.forEach(item => onAdd(item));
    });
  };

  const saveEditSheet = (newName: string, calPerUnit: number, newCount: number) => {
    if (!editSheet) return;
    const liveGroup = groupItems(items).find(g => g.name === editSheet.name);
    if (!liveGroup) { setEditSheet(null); return; }
    const currentItems = liveGroup.items;
    const currentCount = currentItems.length;

    currentItems.forEach(item => {
      onUpdate({ ...item, name: newName, calories: calPerUnit });
    });

    if (newCount > currentCount) {
      const base = { ...currentItems[0], name: newName, calories: calPerUnit };
      for (let i = 0; i < newCount - currentCount; i++) {
        onAdd({ ...base, id: crypto.randomUUID() });
      }
    } else if (newCount < currentCount) {
      for (let i = 0; i < currentCount - newCount; i++) {
        onRemove(currentItems[currentCount - 1 - i].id);
      }
    }

    setEditSheet(null);
  };

  const toggleExpand = (groupName: string) => {
    setExpandedGroupName(prev => prev === groupName ? null : groupName);
  };

  const hasOverlay = macroOverlay !== null || editSheet !== null;

  return (
    <div
      className={`relative w-[82vw] sm:w-[400px] rounded-3xl overflow-hidden flex flex-col select-none ${fullscreen ? 'h-full' : 'min-h-[500px]'}`}
      style={{
        transform: isActive ? 'scale(1)' : 'scale(0.93)',
        opacity: isActive ? 1 : 0.62,
        boxShadow: isActive
          ? '0 24px 64px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12)'
          : '0 4px 16px rgba(0,0,0,0.08)',
        transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.5s ease, box-shadow 0.5s ease',
        outline: isHighlighted ? `2px solid ${config.accent}` : 'none',
        outlineOffset: '3px',
      }}
    >
      <div
        className="relative flex-shrink-0 overflow-hidden"
        style={{
          height: fullscreen ? (isActive ? '200px' : '0px') : '8rem',
          transition: 'height 0.6s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {config.imageUrl ? (
          <img src={config.imageUrl} alt={config.label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientVia})` }} />
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.32) 100%)' }}
        />
        <p
          className="absolute top-3 right-4 text-5xl font-black leading-none select-none"
          style={{ color: 'rgba(255,255,255,0.14)' }}
        >
          {config.num}
        </p>
        <p className="absolute bottom-2.5 left-5 text-[10px] text-white/70 tracking-[0.18em] uppercase font-medium">
          {config.en} · {config.time}
        </p>
      </div>

      <div
        className="flex-1 flex flex-col min-h-0"
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <div className="p-5 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${config.accent}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: config.accent }} />
              </div>
              <h2 className="text-xl font-black text-foreground leading-none tracking-tight">{config.label}</h2>
            </div>
            <p className="text-sm font-bold tabular-nums pt-1" style={{ color: config.accent }}>{total} kcal</p>
          </div>

          <div style={{ opacity: showDetails ? 1 : 0, transition: 'opacity 0.35s ease', pointerEvents: showDetails ? 'auto' : 'none' }}>
            {items.length > 0 && (
              <MacroChips
                items={items}
                protein={totalProtein}
                carbs={totalCarbs}
                fat={totalFat}
                macroTarget={resolvedMacroTarget}
                onSelect={key => setMacroOverlay(key)}
              />
            )}
          </div>
        </div>

        <div
          className={`flex-1 px-5 space-y-1.5 min-h-0 pt-1 ${hasOverlay ? 'overflow-hidden' : 'overflow-y-auto'}`}
          style={{ pointerEvents: showDetails ? 'auto' : 'none' }}
        >
          {groups.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-4">
              <p className="text-xs text-muted-foreground/50 tracking-wide">还没有{config.label}记录，快来添加吧</p>
              {macroTarget && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: `${config.accent}08`, border: `1px dashed ${config.accent}30` }}>
                  <span className="text-[9px] text-muted-foreground/45 shrink-0">本餐建议</span>
                  <span className="text-[10px] font-semibold tabular-nums" style={{ color: '#3B82F6' }}>蛋白 {resolvedMacroTarget.protein}g</span>
                  <span className="text-[10px] font-semibold tabular-nums" style={{ color: '#F59E0B' }}>碳水 {resolvedMacroTarget.carbs}g</span>
                  <span className="text-[10px] font-semibold tabular-nums" style={{ color: '#EF4444' }}>脂肪 {resolvedMacroTarget.fat}g</span>
                </div>
              )}
            </div>
          )}

          {groups.map((group, groupIdx) => {
            const base = group.items[0];
            const count = group.items.length;
            const totalGroupCal = group.items.reduce((s, i) => s + i.calories, 0);
            const unit = getUnit(group.name);
            const itemHasMacro = base.protein !== undefined || base.carbs !== undefined || base.fat !== undefined;

            return (
              <div
                key={group.name}
                className="rounded-2xl bg-white/65 border border-white/70 overflow-hidden transition-colors hover:bg-white/85"
                style={{ animation: `mealItemIn 0.38s cubic-bezier(0.4,0,0.2,1) ${groupIdx * 0.06}s both` }}
              >
                <div className="flex items-center justify-between py-2 px-3">
                  <button
                    onClick={() => itemHasMacro && toggleExpand(group.name)}
                    className="flex items-center gap-1.5 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <span className="text-sm text-foreground flex-1 min-w-0 truncate">{group.name}</span>
                    {itemHasMacro && (
                      <span className="text-muted-foreground/40 flex-shrink-0">
                        {expandedGroupName === group.name
                          ? <ChevronUp className="w-3 h-3" />
                          : <ChevronDown className="w-3 h-3" />
                        }
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <span className="text-xs text-muted-foreground/50 tabular-nums mr-1">
                      {count}{unit} · <span className="font-semibold" style={{ color: config.accent }}>+{totalGroupCal}</span>
                    </span>
                    <button
                      onClick={() => setEditSheet(group)}
                      className="w-8 h-8 flex items-center justify-center text-muted-foreground/40 hover:text-foreground active:scale-90 transition-all cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(group)}
                      className="w-8 h-8 flex items-center justify-center text-muted-foreground/50 hover:text-destructive active:scale-90 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {expandedGroupName === group.name && itemHasMacro && (
                  <div
                    className="flex items-center flex-wrap gap-1.5 px-3 pb-2.5 pt-0"
                    style={{ animation: 'mealItemIn 0.2s ease both' }}
                  >
                    {base.protein !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-500">
                        蛋白 {Math.round(base.protein * count)}g
                      </span>
                    )}
                    {base.carbs !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-500">
                        碳水 {Math.round(base.carbs * count)}g
                      </span>
                    )}
                    {base.fat !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-50 text-red-500">
                        脂肪 {Math.round(base.fat * count)}g
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="mx-5 mt-2 mb-0 h-px"
          style={{ backgroundColor: `${config.accent}20`, opacity: showDetails ? 1 : 0, transition: 'opacity 0.35s ease' }}
        />

        <div
          className="px-5 pt-3 pb-5 space-y-2"
          style={{ opacity: showDetails ? 1 : 0, transition: 'opacity 0.35s ease', pointerEvents: showDetails ? 'auto' : 'none' }}
        >
          {toast && (
            <div
              className="flex items-center justify-between text-xs py-2 px-3 rounded-2xl leading-snug transition-all duration-300"
              style={{
                background: toast.type === 'success'
                  ? `linear-gradient(135deg, ${config.accent}18, ${config.accent}0a)`
                  : 'rgba(0,0,0,0.07)',
                border: toast.type === 'success' ? `1px solid ${config.accent}30` : '1px solid rgba(0,0,0,0.08)',
                color: toast.type === 'success' ? config.accent : 'var(--muted-foreground)',
                animation: 'toastSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              <span>{toast.msg}</span>
              {toast.onUndo && (
                <button
                  onClick={() => {
                    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                    toast.onUndo?.();
                    setToast(null);
                  }}
                  className="ml-3 text-[11px] font-bold underline underline-offset-2 cursor-pointer flex-shrink-0"
                  style={{ color: config.accent }}
                >
                  撤销
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={config.placeholder}
              className="flex-1 bg-white/72 border-white/60 text-sm h-10 rounded-xl min-w-0"
              onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdd(); }}
            />
            <Input
              type="number"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              placeholder="kcal"
              className="w-16 bg-white/72 border-white/60 text-sm h-10 rounded-xl flex-shrink-0"
              onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdd(); }}
            />
            <button
              onClick={handleAdd}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all cursor-pointer active:scale-90 flex-shrink-0"
              style={{ backgroundColor: config.accent }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {macroOverlay && (
        <MacroOverlay
          macroKey={macroOverlay}
          items={items}
          macroTarget={resolvedMacroTarget}
          onClose={() => setMacroOverlay(null)}
        />
      )}

      {editSheet && (
        <EditFoodSheet
          group={editSheet}
          accent={config.accent}
          onSave={saveEditSheet}
          onClose={() => setEditSheet(null)}
        />
      )}

      <style>{`
        @keyframes mealItemIn {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(6px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sheetSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
