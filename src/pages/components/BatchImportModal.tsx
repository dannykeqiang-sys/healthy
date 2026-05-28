import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shadcn/dialog';
import { Loader2, Upload, CheckCircle, ChevronLeft, CalendarDays } from 'lucide-react';
import { parseMultiDateMeals } from '../../utils/deepseek';
import type { MultiDateEntry } from '../../utils/deepseek';

interface BatchImportModalProps {
  open: boolean;
  onClose: () => void;
  apiKey: string;
  onImport: (entries: MultiDateEntry[]) => Promise<void>;
}

type Phase = 'input' | 'parsing' | 'preview' | 'importing' | 'done' | 'error';

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export default function BatchImportModal({ open, onClose, apiKey, onImport }: BatchImportModalProps) {
  const [phase, setPhase] = useState<Phase>('input');
  const [text, setText] = useState('');
  const [entries, setEntries] = useState<MultiDateEntry[]>([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    setPhase('input');
    setText('');
    setEntries([]);
    setSummary('');
    setError('');
    onClose();
  };

  const handleParse = async () => {
    if (!text.trim()) return;
    setPhase('parsing');
    setError('');
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await parseMultiDateMeals(apiKey, text.trim(), today);
      if (!result.has_data || !result.dates || result.dates.length === 0) {
        setError('未识别到有效数据，请重新描述你的饮食情况');
        setPhase('error');
        return;
      }
      setEntries(result.dates);
      setSummary(result.analysis_summary);
      setPhase('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析失败，请重试');
      setPhase('error');
    }
  };

  const handleImport = async () => {
    setPhase('importing');
    try {
      await onImport(entries);
      setPhase('done');
      setTimeout(handleClose, 1600);
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入失败，请重试');
      setPhase('error');
    }
  };

  const PLACEHOLDER = '例如：\n昨天早餐吃了两个鸡蛋和一杯牛奶，午餐吃了红烧肉饭，下午跑步40分钟消耗300kcal。\n今天早上喝了拿铁，中午吃了沙拉和鸡胸肉200kcal，晚上吃了寿司。';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            批量导入历史数据
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            用自然语言描述多天的饮食和运动，AI 自动识别日期并回填
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {(phase === 'input' || phase === 'parsing' || phase === 'error') && (
            <>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={PLACEHOLDER}
                disabled={phase === 'parsing'}
                className="w-full h-36 p-3 text-sm rounded-xl border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground/40 resize-none outline-none focus:border-primary/50 transition-colors leading-relaxed disabled:opacity-60"
              />
              {phase === 'error' && (
                <p className="text-sm text-destructive bg-destructive/5 rounded-xl px-3 py-2.5 leading-relaxed">
                  {error}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleParse}
                  disabled={!text.trim() || phase === 'parsing'}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #A3B899 0%, #7CB9A8 100%)' }}
                >
                  {phase === 'parsing' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />AI 解析中...</>
                  ) : (
                    'AI 智能识别'
                  )}
                </button>
              </div>
            </>
          )}

          {phase === 'preview' && (
            <>
              <div className="rounded-xl bg-primary/5 border border-primary/20 px-3 py-2.5">
                <p className="text-xs text-primary/80 leading-relaxed">{summary}</p>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {entries.map(entry => {
                  const d = new Date(entry.date + 'T00:00:00');
                  const wd = WEEKDAYS[d.getDay()];
                  const totalMeals = MEAL_ORDER.reduce((s, mt) => s + (entry.meals[mt]?.length ?? 0), 0);
                  const totalKcal = MEAL_ORDER.reduce((s, mt) =>
                    s + (entry.meals[mt] ?? []).reduce((ms: number, f) => ms + f.calories, 0), 0);
                  const exCount = entry.exercises?.length ?? 0;
                  const waterCount = entry.water_logs?.length ?? 0;
                  return (
                    <div
                      key={entry.date}
                      className="flex items-start gap-3 p-3 rounded-2xl border border-border/50 bg-white/60"
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'linear-gradient(135deg, #A3B899 0%, #7CB9A8 100%)' }}
                      >
                        <CalendarDays className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {entry.date}
                          <span className="text-muted-foreground font-normal text-xs ml-1.5">{wd}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {totalMeals > 0 && (
                            <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                              饮食 {totalMeals} 项 · {totalKcal} kcal
                            </span>
                          )}
                          {exCount > 0 && (
                            <span className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                              运动 {exCount} 项
                            </span>
                          )}
                          {waterCount > 0 && (
                            <span className="text-[11px] text-sky-600 bg-sky-50 border border-sky-200 rounded-full px-2 py-0.5">
                              饮水 {waterCount} 项
                            </span>
                          )}
                          {totalMeals === 0 && exCount === 0 && waterCount === 0 && (
                            <span className="text-[11px] text-muted-foreground">无有效数据</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setPhase('input'); setEntries([]); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer flex-shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                  修改
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #A3B899 0%, #7CB9A8 100%)' }}
                >
                  确认导入 {entries.length} 天数据
                </button>
              </div>
            </>
          )}

          {phase === 'importing' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">正在导入数据...</p>
            </div>
          )}

          {phase === 'done' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #A3B899 0%, #7CB9A8 100%)' }}
              >
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <p className="text-sm font-semibold text-foreground">导入成功！</p>
              <p className="text-xs text-muted-foreground">数据已回填到对应日期</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
