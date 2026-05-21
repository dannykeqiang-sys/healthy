import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X, Timer, Zap } from 'lucide-react';
import { Input } from '@/components/shadcn/input';
import type { ExerciseItem } from '../../types';

export interface ExerciseSlotConfig {
  label: string;
  en: string;
  num: string;
  icon: React.ElementType;
  accent: string;
  time: string;
  imageUrl?: string;
}

interface ExerciseCardSlotProps {
  config: ExerciseSlotConfig;
  items: ExerciseItem[];
  isActive: boolean;
  isHighlighted: boolean;
  onAdd: (item: ExerciseItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (item: ExerciseItem) => void;
}

const QUICK_EXERCISES = [
  { name: '跑步', caloriesPerMin: 10 },
  { name: '骑行', caloriesPerMin: 8 },
  { name: '游泳', caloriesPerMin: 9 },
  { name: '力量训练', caloriesPerMin: 6 },
  { name: '瑜伽', caloriesPerMin: 4 },
  { name: '健步走', caloriesPerMin: 5 },
  { name: 'HIIT', caloriesPerMin: 12 },
  { name: '跳绳', caloriesPerMin: 11 },
];

export default function ExerciseCardSlot({
  config,
  items,
  isActive,
  isHighlighted,
  onAdd,
  onRemove,
  onUpdate,
}: ExerciseCardSlotProps) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editCalories, setEditCalories] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const [quickMin, setQuickMin] = useState<Record<string, string>>({});

  const Icon = config.icon;
  const totalBurn = items.reduce((s, e) => s + e.calories, 0);
  const totalMin = items.reduce((s, e) => s + e.duration, 0);

  const handleAdd = () => {
    if (!name.trim() || !calories) return;
    onAdd({ id: crypto.randomUUID(), name: name.trim(), duration: Number(duration) || 0, calories: Number(calories) });
    setName('');
    setDuration('');
    setCalories('');
  };

  const handleQuickAdd = (ex: { name: string; caloriesPerMin: number }) => {
    const mins = Number(quickMin[ex.name] || 30);
    onAdd({ id: crypto.randomUUID(), name: ex.name, duration: mins, calories: Math.round(ex.caloriesPerMin * mins) });
  };

  const startEdit = (item: ExerciseItem) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditDuration(String(item.duration));
    setEditCalories(String(item.calories));
  };

  const cancelEdit = () => { setEditId(null); setEditName(''); setEditDuration(''); setEditCalories(''); };

  const saveEdit = () => {
    if (!editId || !editName.trim() || !editCalories) return;
    onUpdate({ id: editId, name: editName.trim(), duration: Number(editDuration) || 0, calories: Number(editCalories) });
    cancelEdit();
  };

  return (
    <div
      className="relative w-[82vw] sm:w-[400px] min-h-[500px] rounded-3xl overflow-hidden flex flex-col select-none"
      style={{
        background: 'linear-gradient(145deg, #EDF6FF, #E8F3FC, #F0F8FF)',
        transform: isActive ? 'scale(1)' : 'scale(0.93)',
        opacity: isActive ? 1 : 0.62,
        boxShadow: isActive
          ? '0 20px 60px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.06)'
          : '0 4px 16px rgba(0,0,0,0.06)',
        transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.5s ease, box-shadow 0.5s ease',
        outline: isHighlighted ? `2px solid ${config.accent}` : 'none',
        outlineOffset: '3px',
      }}
    >
      <div
        className="absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: config.accent, opacity: 0.16 }}
      />
      <div
        className="absolute bottom-0 -left-10 w-36 h-36 rounded-full blur-2xl pointer-events-none"
        style={{ backgroundColor: config.accent, opacity: 0.08 }}
      />

      {config.imageUrl && (
        <div className="relative w-full h-28 overflow-hidden flex-shrink-0">
          <img src={config.imageUrl} alt={config.label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent" />
        </div>
      )}

      <div className="relative z-10 p-6 pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${config.accent}22` }}
            >
              <Icon className="w-5 h-5" style={{ color: config.accent }} />
            </div>
            <h2 className="text-[1.6rem] font-black text-foreground leading-none tracking-tight">{config.label}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-[10px] text-muted-foreground tracking-[0.18em] uppercase">{config.en}</p>
              {totalMin > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Timer className="w-2.5 h-2.5" />
                  {totalMin}分钟
                </span>
              )}
            </div>
          </div>
          <div className="text-right pt-1">
            <p className="text-5xl font-black leading-none select-none" style={{ color: config.accent, opacity: 0.12 }}>{config.num}</p>
            <p className="text-sm font-bold mt-1 tabular-nums" style={{ color: config.accent }}>-{totalBurn} kcal</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-6 space-y-1.5 min-h-0">
        {items.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground/50 tracking-wide">
            快去动起来，记录今天的运动吧
          </div>
        )}
        {items.map((item, index) =>
          editId === item.id ? (
            <div
              key={item.id}
              className="flex items-center gap-1.5 py-2 px-3 rounded-2xl bg-blue-50 border border-blue-200"
            >
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                className="flex-1 min-w-0 text-sm bg-transparent border-b border-blue-300 outline-none py-0.5"
              />
              <input
                type="number"
                value={editDuration}
                onChange={e => setEditDuration(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                className="w-10 text-sm bg-transparent border-b border-blue-300 outline-none text-right py-0.5"
                placeholder="分"
              />
              <span className="text-xs text-muted-foreground">分</span>
              <input
                type="number"
                value={editCalories}
                onChange={e => setEditCalories(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                className="w-12 text-sm bg-transparent border-b border-blue-300 outline-none text-right py-0.5"
              />
              <span className="text-xs text-muted-foreground flex-shrink-0">kcal</span>
              <button onClick={saveEdit} className="w-7 h-7 flex items-center justify-center cursor-pointer active:scale-90 text-blue-500"><Check className="w-3.5 h-3.5" /></button>
              <button onClick={cancelEdit} className="w-7 h-7 flex items-center justify-center cursor-pointer active:scale-90 text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <div
              key={item.id}
              className="group flex items-center justify-between py-2.5 px-3 rounded-2xl bg-white/65 border border-white/70 hover:bg-white/85 transition-colors"
              style={{ animation: `mealItemIn 0.38s cubic-bezier(0.4,0,0.2,1) ${index * 0.06}s both` }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm text-foreground truncate">{item.name}</span>
                {item.duration > 0 && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">{item.duration}分</span>
                )}
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <span className="text-xs font-semibold tabular-nums" style={{ color: config.accent }}>-{item.calories}</span>
                <button
                  onClick={() => startEdit(item)}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground/40 hover:text-foreground active:scale-90 transition-all cursor-pointer opacity-0 group-hover:opacity-100 sm:flex hidden"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => startEdit(item)}
                  className="w-8 h-8 flex items-center justify-center text-muted-foreground/40 hover:text-foreground active:scale-90 transition-all cursor-pointer sm:hidden flex"
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
          )
        )}
      </div>

      <div className="relative z-10 px-6 mt-2">
        <button
          onClick={() => setShowQuick(v => !v)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          style={{ color: showQuick ? config.accent : undefined }}
        >
          <Zap className="w-3 h-3" />
          {showQuick ? '收起' : '快速添加常见运动'}
        </button>
        {showQuick && (
          <div className="mt-2 grid grid-cols-2 gap-1.5 pb-2">
            {QUICK_EXERCISES.map(ex => (
              <div key={ex.name} className="flex items-center gap-1 bg-white/70 rounded-xl px-2 py-1.5 border border-white/60">
                <button
                  onClick={() => handleQuickAdd(ex)}
                  className="flex-1 text-left text-xs font-medium text-foreground cursor-pointer truncate"
                >
                  {ex.name}
                </button>
                <input
                  type="number"
                  value={quickMin[ex.name] ?? '30'}
                  onChange={e => setQuickMin(p => ({ ...p, [ex.name]: e.target.value }))}
                  className="w-8 text-xs bg-transparent outline-none text-right text-muted-foreground"
                />
                <span className="text-[10px] text-muted-foreground flex-shrink-0">分</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mx-6 mt-2 mb-0 h-px" style={{ backgroundColor: `${config.accent}20` }} />

      <div className="relative z-10 px-6 pt-3 pb-5">
        <div className="flex items-center gap-1.5">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="运动名称"
            className="flex-1 bg-white/72 border-white/60 text-sm h-10 rounded-xl min-w-0"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <Input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="分钟"
            className="w-16 bg-white/72 border-white/60 text-sm h-10 rounded-xl flex-shrink-0"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <Input
            type="number"
            value={calories}
            onChange={e => setCalories(e.target.value)}
            placeholder="kcal"
            className="w-16 bg-white/72 border-white/60 text-sm h-10 rounded-xl flex-shrink-0"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
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

      <style>{`
        @keyframes mealItemIn {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  );
}
