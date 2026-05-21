import { useState, useRef } from 'react';
import { Button } from '@/components/shadcn/button';
import { Mic, MicOff, Sparkles, CheckCircle, AlertCircle, X } from 'lucide-react';
import { parseMixedMeals } from '../../utils/deepseek';
import { safeNormalizeString } from '../../utils/stringUtils';
import type { FoodItem, MealType, DailyRecord, ExerciseItem } from '../../types';

interface GlobalTreeholeInputProps {
  apiKey: string;
  record: DailyRecord;
  onMealsUpdate: (updates: { mealType: MealType; item: FoodItem }[]) => void;
  onExercisesUpdate: (exercises: ExerciseItem[]) => void;
}

type Status = 'idle' | 'listening' | 'parsing' | 'success' | 'error';

declare class WebkitSpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: { [i: number]: { [i: number]: { transcript: string } }; isFinal: boolean } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};

interface SummaryItem {
  label: string;
  name: string;
  calories: number;
  isExercise?: boolean;
}

export default function GlobalTreeholeInput({
  apiKey,
  onMealsUpdate,
  onExercisesUpdate,
}: GlobalTreeholeInputProps) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [summary, setSummary] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [summaryItems, setSummaryItems] = useState<SummaryItem[]>([]);
  const recognitionRef = useRef<WebkitSpeechRecognition | null>(null);

  const isSpeechSupported = () =>
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startVoice = () => {
    if (!isSpeechSupported()) return;
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SR() as WebkitSpeechRecognition;
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    setStatus('listening');

    recognition.onresult = (e) => {
      const transcript = safeNormalizeString(e.results[0][0].transcript);
      setText(transcript);
    };
    recognition.onend = () => {
      if (status === 'listening') setStatus('idle');
    };
    recognition.onerror = () => setStatus('idle');
    recognition.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setStatus('idle');
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    if (!apiKey) {
      setErrorMsg('请先在设置中填写 DeepSeek API Key');
      setStatus('error');
      return;
    }

    setStatus('parsing');
    setSummary('');
    setErrorMsg('');
    setSummaryItems([]);

    try {
      const result = await parseMixedMeals(apiKey, text.trim());

      if (!result.has_data) {
        setErrorMsg('没有识别到有效的饮食信息，请重新描述');
        setStatus('error');
        return;
      }

      const mealUpdates: { mealType: MealType; item: FoodItem }[] = [];
      const items: SummaryItem[] = [];
      const mealKeys: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

      for (const key of mealKeys) {
        const foods = result.data[key];
        if (!Array.isArray(foods)) continue;
        for (const food of foods) {
          const safeName = safeNormalizeString(food.name);
          if (!safeName || food.calories <= 0) continue;
          mealUpdates.push({
            mealType: key,
            item: {
              id: crypto.randomUUID(),
              name: safeName,
              calories: food.calories,
            },
          });
          items.push({ label: MEAL_LABELS[key], name: safeName, calories: food.calories });
        }
      }

      const exerciseItems: ExerciseItem[] = [];
      if (Array.isArray(result.data.exercises)) {
        for (const ex of result.data.exercises) {
          const safeName = safeNormalizeString(ex.name);
          if (!safeName || ex.calories <= 0) continue;
          exerciseItems.push({
            id: crypto.randomUUID(),
            name: safeName,
            duration: 0,
            calories: ex.calories,
          });
          items.push({ label: '运动', name: safeName, calories: ex.calories, isExercise: true });
        }
      }

      if (mealUpdates.length === 0 && exerciseItems.length === 0) {
        setErrorMsg('没有识别到有效的饮食或运动信息，请重新描述');
        setStatus('error');
        return;
      }

      if (mealUpdates.length > 0) onMealsUpdate(mealUpdates);
      if (exerciseItems.length > 0) onExercisesUpdate(exerciseItems);

      setSummary(result.analysis_summary);
      setSummaryItems(items);
      setStatus('success');
      setText('');
    } catch {
      setErrorMsg('AI 解析失败，请检查网络或 API Key 是否有效');
      setStatus('error');
    }
  };

  const reset = () => {
    setStatus('idle');
    setSummary('');
    setErrorMsg('');
    setSummaryItems([]);
    setText('');
  };

  const isListening = status === 'listening';
  const isParsing = status === 'parsing';

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">今日吃了什么？</p>
          <p className="text-xs text-muted-foreground">随口说说，AI 帮你自动分配到各餐</p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-white/80 border border-primary/20 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground leading-relaxed">{summary}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {summaryItems.map((m, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: m.isExercise
                      ? 'rgba(125,185,232,0.15)'
                      : 'rgba(163,184,153,0.15)',
                    color: m.isExercise ? '#4A90A4' : '#6B9960',
                  }}
                >
                  {m.label} · {m.name}
                  {m.isExercise ? ` -${m.calories}` : ` +${m.calories}`} kcal
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={reset}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer underline underline-offset-2 transition-colors"
          >
            继续记录下一条
          </button>
        </div>
      ) : status === 'error' ? (
        <div className="rounded-xl bg-white/80 border border-destructive/20 p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-destructive">{errorMsg}</p>
            <button
              onClick={reset}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer underline underline-offset-2 mt-1 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={isListening ? '正在聆听，请说话...' : '如：早上喝了牛奶，中午吃了米饭和鸡胸肉，下午跑步了30分钟'}
                rows={2}
                className="w-full resize-none rounded-xl border border-border/70 bg-white/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              {text && !isParsing && (
                <button
                  onClick={() => setText('')}
                  className="absolute right-2 top-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {isSpeechSupported() && (
                <button
                  type="button"
                  onClick={isListening ? stopVoice : startVoice}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border flex-shrink-0"
                  style={{
                    backgroundColor: isListening ? 'rgba(163,184,153,0.2)' : 'rgba(163,184,153,0.1)',
                    borderColor: isListening ? '#A3B899' : 'rgba(163,184,153,0.4)',
                    boxShadow: isListening ? '0 0 0 3px rgba(163,184,153,0.2)' : 'none',
                  }}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 text-primary" />
                  ) : (
                    <Mic className="w-4 h-4 text-primary" />
                  )}
                </button>
              )}
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!text.trim() || isParsing}
                className="w-10 h-10 flex-shrink-0 bg-primary hover:bg-primary/90 text-white cursor-pointer disabled:cursor-not-allowed"
              >
                {isParsing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {isParsing && (
            <div className="flex items-center gap-2 px-1">
              <div className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">正在将食材转化为能量手帐...</p>
            </div>
          )}

          {isListening && (
            <div className="flex items-center gap-2 px-1">
              <div className="flex items-end gap-0.5 h-4">
                {[0.4, 0.7, 1.0, 0.7, 0.4].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-primary"
                    style={{
                      height: `${h * 14}px`,
                      animation: `voice-wave 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                    }}
                  />
                ))}
              </div>
              <p className="text-xs text-primary">正在聆听，说完后自动识别...</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes voice-wave {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
