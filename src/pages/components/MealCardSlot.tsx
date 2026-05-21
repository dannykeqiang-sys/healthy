import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/shadcn/input';
import VoiceInputButton from './VoiceInputButton';
import { estimateCalories } from '../../utils/deepseek';
import { safeNormalizeString } from '../../utils/stringUtils';
import type { FoodItem } from '../../types';

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
  onAdd: (item: FoodItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (item: FoodItem) => void;
}

export default function MealCardSlot({
  config,
  items,
  apiKey,
  isActive,
  isHighlighted,
  onAdd,
  onRemove,
  onUpdate,
}: MealCardSlotProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [toast, setToast] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCalories, setEditCalories] = useState('');

  const Icon = config.icon;
  const total = items.reduce((s, f) => s + f.calories, 0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAdd = () => {
    if (!name.trim() || !calories) return;
    onAdd({ id: crypto.randomUUID(), name: safeNormalizeString(name.trim()), calories: Number(calories) });
    setName('');
    setCalories('');
  };

  const handleAIEstimate = async () => {
    if (!name.trim() || !apiKey || estimating) return;
    setEstimating(true);
    try {
      const result = await estimateCalories(apiKey, name.trim());
      setName(safeNormalizeString(result.food_name));
      setCalories(String(result.calories));
      showToast(`AI 估算约 ${result.calories} kcal`);
    } catch {
      showToast('AI 估算失败，请手动输入');
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
  };

  const cancelEdit = () => { setEditId(null); setEditName(''); setEditCalories(''); };

  const saveEdit = () => {
    if (!editId || !editName.trim() || !editCalories) return;
    onUpdate({ id: editId, name: safeNormalizeString(editName.trim()), calories: Number(editCalories) });
    cancelEdit();
  };

  return (
    <div
      className="relative w-[82vw] sm:w-[400px] min-h-[500px] rounded-3xl overflow-hidden flex flex-col select-none"
      style={{
        background: `linear-gradient(145deg, ${config.gradientFrom}, ${config.gradientVia}, ${config.gradientTo})`,
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
        style={{ backgroundColor: config.accent, opacity: 0.18 }}
      />
      <div
        className="absolute bottom-0 -left-10 w-36 h-36 rounded-full blur-2xl pointer-events-none"
        style={{ backgroundColor: config.accent, opacity: 0.1 }}
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
            <p className="text-[10px] text-muted-foreground mt-1.5 tracking-[0.18em] uppercase">{config.en} · {config.time}</p>
          </div>
          <div className="text-right pt-1">
            <p className="text-5xl font-black leading-none select-none" style={{ color: config.accent, opacity: 0.12 }}>{config.num}</p>
            <p className="text-sm font-bold mt-1 tabular-nums" style={{ color: config.accent }}>{total} kcal</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-6 space-y-1.5 min-h-0">
        {items.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground/50 tracking-wide">
            还没有{config.label}记录，快来添加吧
          </div>
        )}
        {items.map((item, index) =>
          editId === item.id ? (
            <div
              key={item.id}
              className="flex items-center gap-1.5 py-2 px-3 rounded-2xl border"
              style={{ backgroundColor: `${config.accent}0f`, borderColor: `${config.accent}35` }}
            >
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                className="flex-1 min-w-0 text-sm bg-transparent border-b outline-none py-0.5"
                style={{ borderColor: `${config.accent}50` }}
              />
              <input
                type="number"
                value={editCalories}
                onChange={e => setEditCalories(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
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
              className="group flex items-center justify-between py-2.5 px-3 rounded-2xl bg-white/65 border border-white/70 hover:bg-white/85 transition-colors"
              style={{ animation: `mealItemIn 0.38s cubic-bezier(0.4,0,0.2,1) ${index * 0.06}s both` }}
            >
              <span className="text-sm text-foreground flex-1 min-w-0 truncate">{item.name}</span>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <span className="text-xs font-semibold tabular-nums" style={{ color: config.accent }}>+{item.calories}</span>
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

      <div className="mx-6 mt-3 mb-0 h-px" style={{ backgroundColor: `${config.accent}20` }} />

      <div className="relative z-10 px-6 pt-3 pb-5 space-y-2">
        {toast && (
          <div className="text-xs text-center py-1.5 px-3 rounded-full bg-foreground/85 text-background leading-snug">
            {toast}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <VoiceInputButton apiKey={apiKey} color={config.accent} onResult={handleVoiceResult} />
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder={config.placeholder}
            className="flex-1 bg-white/72 border-white/60 text-sm h-10 rounded-xl min-w-0"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
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
