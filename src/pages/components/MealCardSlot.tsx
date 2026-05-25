import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/shadcn/input';
import VoiceInputButton from './VoiceInputButton';
import { estimateCalories } from '../../utils/deepseek';
import { safeNormalizeString } from '../../utils/stringUtils';
import { calcTargetCalories } from '../../utils/calculations';
import type { FoodItem, UserProfile } from '../../types';
import AIRecognitionCelebration from './AIRecognitionCelebration';

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
  apiKey: string;
  isActive: boolean;
  isHighlighted: boolean;
  profile?: UserProfile | null;
  onAdd: (item: FoodItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (item: FoodItem) => void;
}

function getMealRatio(label: string): number {
  if (label.includes('早')) return 0.25;
  if (label.includes('午')) return 0.35;
  if (label.includes('晚')) return 0.30;
  return 0.10;
}

interface MacroComboBarProps {
  protein: number;
  carbs: number;
  fat: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  mealRatio: number;
}

function MacroComboBar({ protein, carbs, fat, proteinTarget, carbsTarget, fatTarget, mealRatio }: MacroComboBarProps) {
  const hasMacros = protein > 0 || carbs > 0 || fat > 0;
  const mealProtein = Math.max(1, Math.round(proteinTarget * mealRatio));
  const mealCarbs = Math.max(1, Math.round(carbsTarget * mealRatio));
  const mealFat = Math.max(1, Math.round(fatTarget * mealRatio));

  const bars = [
    { label: '蛋白质', actual: protein, target: mealProtein, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    { label: '碳水', actual: carbs, target: mealCarbs, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    { label: '脂肪', actual: fat, target: mealFat, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  ];

  return (
    <div className="mt-3 px-0.5 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground/60 font-medium">当餐营养对比</p>
        <p className="text-[9px] text-muted-foreground/40">推荐 {Math.round(mealRatio * 100)}% 日摄入</p>
      </div>

      {bars.map(bar => {
        const pct = Math.min((bar.actual / bar.target) * 100, 100);
        const isOver = bar.actual > bar.target;
        const displayColor = isOver ? '#EF4444' : bar.color;
        return (
          <div key={bar.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: bar.color }} />
                <span className="text-[9px] text-muted-foreground/70 font-medium">{bar.label}</span>
              </div>
              <span className="text-[9px] tabular-nums font-semibold" style={{ color: hasMacros ? displayColor : 'var(--muted-foreground)' }}>
                {hasMacros ? `${bar.actual}g` : '—'} / {bar.target}g
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: bar.bg }}>
              {hasMacros && (
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: displayColor }}
                />
              )}
            </div>
          </div>
        );
      })}

      {!hasMacros && (
        <p className="text-[9px] text-muted-foreground/35 text-center pt-0.5">用 AI 估算食物可自动获取三大营养素</p>
      )}
    </div>
  );
}

export default function MealCardSlot({
  config,
  items,
  apiKey,
  isActive,
  isHighlighted,
  profile,
  onAdd,
  onRemove,
  onUpdate,
}: MealCardSlotProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'info' | 'success'>('info');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCalories, setEditCalories] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [aiCelebration, setAiCelebration] = useState<{ foodName: string; calories: number } | null>(null);

  const Icon = config.icon;
  const total = items.reduce((s, f) => s + f.calories, 0);
  const totalProtein = Math.round(items.reduce((s, f) => s + (f.protein ?? 0), 0));
  const totalCarbs = Math.round(items.reduce((s, f) => s + (f.carbs ?? 0), 0));
  const totalFat = Math.round(items.reduce((s, f) => s + (f.fat ?? 0), 0));

  const targetCalories = profile ? calcTargetCalories(profile) : 2000;
  const proteinTarget = Math.round(targetCalories * 0.30 / 4);
  const carbsTarget = Math.round(targetCalories * 0.45 / 4);
  const fatTarget = Math.round(targetCalories * 0.25 / 9);
  const mealRatio = getMealRatio(config.label);

  const AI_PRAISES = [
    '已帮你估好了，记录很重要',
    '你对自己的关注令人感动',
    '科学饮食从每一口开始',
    '每次记录都在靠近目标',
    '好的身材都是这样积累的',
    '你比大多数人更了解自己',
  ];

  const ADD_PRAISES = [
    '加入啦！吃得开心，也要吃得明白',
    '记录下来了，继续保持',
    '每一口都被看见，很棒',
    '饮食有记录，身体有感知',
  ];

  const showToast = (msg: string, type: 'info' | 'success' = 'info') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 3500);
  };

  const handleAdd = () => {
    if (!name.trim() || !calories) return;
    onAdd({ id: crypto.randomUUID(), name: safeNormalizeString(name.trim()), calories: Number(calories) });
    setName('');
    setCalories('');
    const praise = ADD_PRAISES[Math.floor(Math.random() * ADD_PRAISES.length)];
    showToast(praise, 'success');
  };

  const handleAIEstimate = async () => {
    if (!name.trim() || !apiKey || estimating) return;
    setEstimating(true);
    try {
      const result = await estimateCalories(apiKey, name.trim());
      setName(safeNormalizeString(result.food_name));
      setCalories(String(result.calories));
      setAiCelebration({ foodName: result.food_name, calories: result.calories });
    } catch {
      showToast('AI 估算失败，请手动输入热量', 'info');
    } finally {
      setEstimating(false);
    }
  };

  const handleNameBlur = () => {
    if (name.trim() && !calories && apiKey && !estimating) handleAIEstimate();
  };

  const handleVoiceResult = (foodName: string, cal: number) => {
    setName(foodName);
    if (cal > 0) setCalories(String(cal));
  };

  const startEdit = (item: FoodItem) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditCalories(String(item.calories));
    setExpandedItemId(null);
  };

  const cancelEdit = () => { setEditId(null); setEditName(''); setEditCalories(''); };

  const saveEdit = () => {
    if (!editId || !editName.trim() || !editCalories) return;
    onUpdate({ id: editId, name: safeNormalizeString(editName.trim()), calories: Number(editCalories) });
    cancelEdit();
  };

  const toggleExpand = (id: string) => {
    setExpandedItemId(prev => (prev === id ? null : id));
  };

  return (
    <div
      className="relative w-[82vw] sm:w-[400px] min-h-[500px] rounded-3xl overflow-hidden flex flex-col select-none"
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
      <div className="relative h-32 flex-shrink-0">
        {config.imageUrl ? (
          <img
            src={config.imageUrl}
            alt={config.label}
            className="w-full h-full object-cover"
          />
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

          {items.length > 0 && (
            <MacroComboBar
              protein={totalProtein}
              carbs={totalCarbs}
              fat={totalFat}
              proteinTarget={proteinTarget}
              carbsTarget={carbsTarget}
              fatTarget={fatTarget}
              mealRatio={mealRatio}
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 space-y-1.5 min-h-0 pt-1">
          {items.length === 0 && (
            <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50 tracking-wide">
              还没有{config.label}记录，快来添加吧
            </div>
          )}
          {items.map((item, index) => {
            const itemHasMacro = item.protein !== undefined || item.carbs !== undefined || item.fat !== undefined;
            return editId === item.id ? (
              <div
                key={item.id}
                className="flex items-center gap-1.5 py-2 px-3 rounded-2xl border"
                style={{ backgroundColor: `${config.accent}0f`, borderColor: `${config.accent}35` }}
              >
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                  className="flex-1 min-w-0 text-sm bg-transparent border-b outline-none py-0.5"
                  style={{ borderColor: `${config.accent}50` }}
                />
                <input
                  type="number"
                  value={editCalories}
                  onChange={e => setEditCalories(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                  className="w-14 text-sm bg-transparent border-b outline-none text-right py-0.5"
                  style={{ borderColor: `${config.accent}50` }}
                />
                <span className="text-xs text-muted-foreground flex-shrink-0">kcal</span>
                <button onClick={saveEdit} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer active:scale-90" style={{ color: config.accent }}>
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={cancelEdit} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer text-muted-foreground active:scale-90">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                key={item.id}
                className="rounded-2xl bg-white/65 border border-white/70 overflow-hidden transition-colors hover:bg-white/85 group"
                style={{ animation: `mealItemIn 0.38s cubic-bezier(0.4,0,0.2,1) ${index * 0.06}s both` }}
              >
                <div className="flex items-center justify-between py-2.5 px-3">
                  <button
                    onClick={() => itemHasMacro && toggleExpand(item.id)}
                    className="flex items-center gap-1.5 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <span className="text-sm text-foreground flex-1 min-w-0 truncate">{item.name}</span>
                    {itemHasMacro && (
                      <>
                        <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                          {item.protein !== undefined && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-blue-50 text-blue-500">P{item.protein}g</span>
                          )}
                          {item.carbs !== undefined && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-amber-50 text-amber-500">C{item.carbs}g</span>
                          )}
                          {item.fat !== undefined && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-red-50 text-red-500">F{item.fat}g</span>
                          )}
                        </div>
                        <span className="text-muted-foreground/40 flex-shrink-0 sm:hidden">
                          {expandedItemId === item.id
                            ? <ChevronUp className="w-3 h-3" />
                            : <ChevronDown className="w-3 h-3" />
                          }
                        </span>
                      </>
                    )}
                  </button>
                  <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                    <span className="text-xs font-semibold tabular-nums" style={{ color: config.accent }}>+{item.calories}</span>
                    <button
                      onClick={() => startEdit(item)}
                      className="w-8 h-8 hidden sm:flex items-center justify-center text-muted-foreground/40 hover:text-foreground active:scale-90 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      className="w-8 h-8 flex sm:hidden items-center justify-center text-muted-foreground/40 hover:text-foreground active:scale-90 transition-all cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onRemove(item.id)}
                      className="w-8 h-8 flex items-center justify-center text-muted-foreground/50 hover:text-destructive active:scale-90 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {expandedItemId === item.id && itemHasMacro && (
                  <div
                    className="sm:hidden flex items-center gap-3 px-3 pb-2.5 pt-0"
                    style={{ animation: 'mealItemIn 0.2s ease both' }}
                  >
                    {item.protein !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-500">
                        蛋白 {item.protein}g
                      </span>
                    )}
                    {item.carbs !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-500">
                        碳水 {item.carbs}g
                      </span>
                    )}
                    {item.fat !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-50 text-red-500">
                        脂肪 {item.fat}g
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mx-5 mt-2 mb-0 h-px" style={{ backgroundColor: `${config.accent}20` }} />

        <div className="px-5 pt-3 pb-5 space-y-2">
          {toast && (
            <div
              className="text-xs text-center py-2 px-3 rounded-2xl leading-snug transition-all duration-300"
              style={{
                background: toastType === 'success'
                  ? `linear-gradient(135deg, ${config.accent}18, ${config.accent}0a)`
                  : 'rgba(0,0,0,0.08)',
                border: toastType === 'success' ? `1px solid ${config.accent}30` : '1px solid rgba(0,0,0,0.08)',
                color: toastType === 'success' ? config.accent : 'var(--muted-foreground)',
                animation: 'toastSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              {toast}
            </div>
          )}
          <VoiceInputButton apiKey={apiKey} color={config.accent} onResult={handleVoiceResult} />
          <div className="flex items-center gap-1.5">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={handleNameBlur}
              placeholder={config.placeholder}
              className="flex-1 bg-white/72 border-white/60 text-sm h-10 rounded-xl min-w-0"
              onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdd(); }}
            />
            <button
              onClick={handleAIEstimate}
              disabled={!name.trim() || estimating}
              title="AI 估算热量"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                backgroundColor: name.trim() ? `${config.accent}18` : 'rgba(0,0,0,0.04)',
                borderColor: name.trim() ? `${config.accent}40` : 'rgba(0,0,0,0.08)',
                color: config.accent,
              }}
            >
              {estimating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>
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

      <style>{`
        @keyframes mealItemIn {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(6px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {aiCelebration && (
        <AIRecognitionCelebration
          foodName={aiCelebration.foodName}
          calories={aiCelebration.calories}
          onDismiss={() => setAiCelebration(null)}
        />
      )}
    </div>
  );
}
