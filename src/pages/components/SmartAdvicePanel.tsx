import { useState, useEffect, useMemo } from 'react';
import { Sparkles, Target, Leaf, Dumbbell, Lightbulb, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { generateSmartAdvice } from '../../utils/deepseek';
import type { SmartAdviceResult } from '../../utils/deepseek';
import { idbGetRecentRecords } from '../../utils/indexedDB';
import { calcTargetCalories } from '../../utils/calculations';
import type { UserProfile, DailyRecord } from '../../types';

interface SmartAdvicePanelProps {
  profile: UserProfile | null;
  record: DailyRecord;
  apiKey: string;
}

type PanelStatus = 'ready' | 'loading' | 'revealed' | 'error';

interface CacheEntry {
  snapshotKey: string;
  result: SmartAdviceResult;
}

function getCacheKey(date: string): string {
  return `smart_advice_cache_${date}`;
}

function loadCache(date: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(getCacheKey(date));
    return raw ? (JSON.parse(raw) as CacheEntry) : null;
  } catch {
    return null;
  }
}

function saveCache(date: string, entry: CacheEntry): void {
  try {
    localStorage.setItem(getCacheKey(date), JSON.stringify(entry));
  } catch {}
}

function clearCache(date: string): void {
  try {
    localStorage.removeItem(getCacheKey(date));
  } catch {}
}

function buildSnapshotKey(record: DailyRecord): string {
  const b = record.meals.breakfast.reduce((s, f) => s + f.calories, 0);
  const l = record.meals.lunch.reduce((s, f) => s + f.calories, 0);
  const d = record.meals.dinner.reduce((s, f) => s + f.calories, 0);
  const sn = record.meals.snack.reduce((s, f) => s + f.calories, 0);
  const e = record.exercises.reduce((s, ex) => s + ex.calories, 0);
  const w = (record.water || []).reduce((s, wi) => s + wi.amount, 0);
  return `b${b}_l${l}_d${d}_s${sn}_e${e}_w${w}`;
}

function isAllEmpty(record: DailyRecord): boolean {
  const noMeals = Object.values(record.meals).every(items => items.length === 0);
  const noExercise = record.exercises.length === 0;
  const noWater = (record.water || []).length === 0;
  return noMeals && noExercise && noWater;
}

function determineMode(record: DailyRecord): 'next_meal' | 'tomorrow' {
  const hour = new Date().getHours();
  const hasAllMainMeals =
    record.meals.breakfast.length > 0 &&
    record.meals.lunch.length > 0 &&
    record.meals.dinner.length > 0;
  return hour < 21 && !hasAllMainMeals ? 'next_meal' : 'tomorrow';
}

function buildTodaySummary(profile: UserProfile, record: DailyRecord): string {
  const target = calcTargetCalories(profile);
  const intake = Object.values(record.meals).flat().reduce((s, f) => s + f.calories, 0);
  const burn = record.exercises.reduce((s, e) => s + e.calories, 0);
  const water = (record.water || []).reduce((s, w) => s + w.amount, 0);
  const goal = profile.goal === 'lose' ? '减脂' : profile.goal === 'gain' ? '增肌' : '维持体重';
  const mealLines = Object.entries(record.meals)
    .map(([k, items]) => {
      const label = ({ breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' } as Record<string, string>)[k];
      const names = items.map(f => f.name).join('、') || '未录入';
      const cal = items.reduce((s, f) => s + f.calories, 0);
      return `${label}：${names}（${cal} kcal）`;
    })
    .join('\n');
  const exerciseText =
    record.exercises.length > 0
      ? record.exercises.map(e => `${e.name} ${e.duration}分钟 ${e.calories}kcal`).join('、')
      : '无';
  return `目标：${goal}，目标热量：${target} kcal\n总摄入：${intake} kcal，运动消耗：${burn} kcal，净摄入：${intake - burn} kcal\n今日饮水：${water} ml\n\n${mealLines}\n运动：${exerciseText}`;
}

export default function SmartAdvicePanel({ profile, record, apiKey }: SmartAdvicePanelProps) {
  const [status, setStatus] = useState<PanelStatus>('ready');
  const [result, setResult] = useState<SmartAdviceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasDataChanged = useMemo(() => {
    const cache = loadCache(record.date);
    if (!cache) return true;
    return buildSnapshotKey(record) !== cache.snapshotKey;
  }, [record]);

  useEffect(() => {
    const cache = loadCache(record.date);
    if (cache) {
      setResult(cache.result);
      setStatus('revealed');
    } else {
      setStatus('ready');
    }
  }, [record.date]);

  const showAlert = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(''), 4500);
  };

  const callApi = async () => {
    if (!profile || !apiKey) return;
    setStatus('loading');
    setConfirmOpen(false);
    setErrorMsg('');

    try {
      const history = await idbGetRecentRecords(7);
      const historyContext =
        history
          .filter(r => r.date !== record.date)
          .map(r => {
            const intake = Object.values(r.meals).flat().reduce((s, f) => s + f.calories, 0);
            const burn = r.exercises.reduce((s, e) => s + e.calories, 0);
            return `${r.date}：摄入 ${intake} kcal，运动 ${burn} kcal`;
          })
          .join('\n') || '暂无近期历史';

      const mode = determineMode(record);
      const data = await generateSmartAdvice(apiKey, buildTodaySummary(profile, record), historyContext, mode);
      const snapshotKey = buildSnapshotKey(record);
      saveCache(record.date, { snapshotKey, result: data });
      setResult(data);
      setStatus('revealed');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'AI 生成失败，请稍后重试');
      setStatus('error');
    }
  };

  const handleGenerate = () => {
    if (!profile) {
      showAlert('请先在右上角完善个人信息，再来生成专属锦囊～');
      return;
    }
    if (!apiKey) {
      showAlert('请先在设置中填写 DeepSeek API Key');
      return;
    }
    if (isAllEmpty(record)) {
      showAlert('小主，今日手帐还是空白的呢，先随便记点什么，再来听听我的碎碎念吧～');
      return;
    }

    const snapshot = buildSnapshotKey(record);
    const cache = loadCache(record.date);

    if (cache && cache.snapshotKey === snapshot) {
      showAlert('小主，你还没有修改过今天的数据呢，锦囊里的内容目前就是最适合你的方案哦，不需要重新生成啦～');
      return;
    }

    if (cache && cache.snapshotKey !== snapshot) {
      setConfirmOpen(true);
      return;
    }

    callApi();
  };

  const handleRegen = () => {
    clearCache(record.date);
    setResult(null);
    setConfirmOpen(false);
    setStatus('ready');
  };

  const isNextMeal = result?.next_action_trigger === 'next_meal';

  return (
    <div className="w-full h-auto flex flex-col space-y-4">
      {alertMsg && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-primary/8 border border-primary/20 px-4 py-3 animate-in fade-in duration-200">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">{alertMsg}</p>
        </div>
      )}

      {status === 'ready' && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-8 flex flex-col items-center justify-center text-center gap-5 min-h-[220px]">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-white border border-primary/30 flex items-center justify-center shadow-sm">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-secondary border-2 border-white" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-base">让 AI 卡卡为你推演今日锦囊</p>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              综合早、中、晚、加、动、水六维数据，智能路由至最适合你的时段策略
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer gap-2 px-6"
          >
            <Sparkles className="w-4 h-4" />
            生成今日锦囊
          </Button>
        </div>
      )}

      {status === 'loading' && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-8 flex flex-col items-center justify-center text-center gap-5 min-h-[220px]">
          <div className="flex items-end gap-2 h-10">
            {[0, 1, 2, 3, 4].map(i => (
              <span
                key={i}
                className="w-2.5 rounded-full"
                style={{
                  backgroundColor: i % 2 === 0 ? '#A3B899' : '#EBB193',
                  animation: `smart-float 1.4s ease-in-out ${i * 0.2}s infinite`,
                  height: '10px',
                  display: 'inline-block',
                }}
              />
            ))}
          </div>
          <div>
            <p className="text-sm text-foreground font-medium">卡卡正在为你推演专属锦囊...</p>
            <p className="text-xs text-muted-foreground mt-1">正在分析六维数据与近期趋势</p>
          </div>
          <style>{`
            @keyframes smart-float {
              0%, 100% { height: 10px; opacity: 0.5; }
              50% { height: 28px; opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-destructive font-medium">锦囊生成失败</p>
            <p className="text-xs text-muted-foreground mt-0.5">{errorMsg}</p>
            <button
              onClick={() => setStatus('ready')}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer underline underline-offset-2 mt-2 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {status === 'revealed' && result && (
        <div className="w-full h-auto flex flex-col space-y-3 bg-white rounded-2xl border border-primary/20 p-5 shadow-sm" style={{ animation: 'smart-fade-in 0.4s ease both' }}>
          <div className="flex items-center justify-between pb-2.5 border-b border-border">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: isNextMeal ? 'rgba(163,184,153,0.2)' : 'rgba(139,92,246,0.15)' }}
              >
                <Sparkles
                  className="w-3.5 h-3.5"
                  style={{ color: isNextMeal ? '#6B9960' : '#8B5CF6' }}
                />
              </div>
              <p className="text-sm font-bold text-foreground">{result.predictive_advice.title}</p>
            </div>
            <span className="text-[10px] text-muted-foreground/60 tabular-nums">
              {new Date().toLocaleDateString('zh-CN')}
            </span>
          </div>

          <div className="w-full h-auto p-3.5 rounded-xl border"
            style={{
              backgroundColor: isNextMeal ? 'rgba(163,184,153,0.08)' : 'rgba(139,92,246,0.06)',
              borderColor: isNextMeal ? 'rgba(163,184,153,0.25)' : 'rgba(139,92,246,0.15)',
            }}
          >
            <p className="text-sm text-foreground leading-relaxed">{result.today_review}</p>
          </div>

          <div className="w-full h-auto flex flex-col space-y-1">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-secondary/15 flex items-center justify-center flex-shrink-0">
                <Target className="w-3 h-3 text-secondary" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground">能量目标</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed pl-7">{result.predictive_advice.energy_target}</p>
          </div>

          <div className="w-full h-auto flex flex-col space-y-1">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Leaf className="w-3 h-3 text-primary" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground">饮食策略</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed pl-7">{result.predictive_advice.diet_strategy}</p>
          </div>

          <div className="w-full h-auto flex flex-col space-y-1 bg-amber-50/70 border border-amber-100 p-3 rounded-xl">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Dumbbell className="w-3 h-3 text-blue-500" />
              </div>
              <p className="text-xs font-semibold text-muted-foreground">轻松运动</p>
            </div>
            <p className="text-sm text-foreground leading-relaxed pl-7">{result.predictive_advice.exercise_suggestion}</p>
          </div>

          {result.health_tips && (
            <div className="w-full h-auto flex flex-col space-y-1 bg-sky-50 border border-sky-100 p-3 rounded-xl">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-3 h-3 text-sky-500" />
                </div>
                <p className="text-xs font-semibold text-muted-foreground">暖心小贴士</p>
              </div>
              <p className="text-sm text-foreground leading-relaxed pl-7">{result.health_tips}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleGenerate}
              disabled={!hasDataChanged}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{
                color: hasDataChanged ? 'var(--muted-foreground)' : 'var(--muted-foreground)',
                opacity: hasDataChanged ? 1 : 0.35,
                cursor: hasDataChanged ? 'pointer' : 'not-allowed',
              }}
            >
              <RefreshCw className="w-3 h-3" />
              {hasDataChanged ? '数据有更新？点此重新推演' : '当前数据已是最新推演依据'}
            </button>
            <button
              onClick={handleRegen}
              disabled={!hasDataChanged}
              className="text-xs underline underline-offset-2 transition-colors"
              style={{
                color: hasDataChanged ? undefined : 'var(--muted-foreground)',
                opacity: hasDataChanged ? 0.6 : 0.3,
                cursor: hasDataChanged ? 'pointer' : 'not-allowed',
              }}
            >
              重置
            </button>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setConfirmOpen(false)}>
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'smart-slide-up 0.3s cubic-bezier(0.4,0,0.2,1) both' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-secondary/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-secondary" />
              </div>
              <p className="font-semibold text-foreground text-sm">检测到数据有更新</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              需要消耗能量重新为你推演新的{determineMode(record) === 'next_meal' ? '下一餐' : '翌日'}策略吗？
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors"
              >
                暂不更新
              </button>
              <button
                onClick={callApi}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium cursor-pointer hover:bg-primary/90 transition-colors"
              >
                确认重新推演
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes smart-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes smart-slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
