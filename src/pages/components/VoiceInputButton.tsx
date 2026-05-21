import { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { estimateCalories } from '../../utils/deepseek';
import { safeNormalizeString } from '../../utils/stringUtils';

interface VoiceInputButtonProps {
  apiKey: string;
  color?: string;
  onResult: (foodName: string, calories: number, reason: string) => void;
}

type Status = 'idle' | 'listening' | 'processing' | 'done' | 'error';

declare class WebkitSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { results: { [i: number]: { [i: number]: { transcript: string } }; isFinal: boolean } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

const isSpeechSupported = () =>
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export default function VoiceInputButton({ apiKey, color = '#A3B899', onResult }: VoiceInputButtonProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [toast, setToast] = useState<string | null>(null);
  const recognitionRef = useRef<WebkitSpeechRecognition | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const startListening = () => {
    if (!isSpeechSupported()) {
      showToast('当前浏览器不支持语音识别，请使用 Chrome');
      return;
    }
    if (!apiKey) {
      showToast('请先在设置中填写 DeepSeek API Key');
      return;
    }

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition: typeof WebkitSpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: typeof WebkitSpeechRecognition }).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    setStatus('listening');

    recognition.onresult = async (e) => {
      const text = safeNormalizeString(e.results[0][0].transcript);
      setStatus('processing');
      try {
        const result = await estimateCalories(apiKey, text);
        setStatus('done');
        onResult(safeNormalizeString(result.food_name), result.calories, safeNormalizeString(result.reason));
        showToast(`听到了哦！AI 帮你估算约 ${result.calories} kcal，已自动填入～`);
        setTimeout(() => setStatus('idle'), 1500);
      } catch {
        setStatus('error');
        showToast('AI 估算失败，已填入食物名称，请手动输入卡路里');
        onResult(text, 0, '');
        setTimeout(() => setStatus('idle'), 2000);
      }
    };

    recognition.onerror = () => {
      setStatus('idle');
      showToast('语音识别失败，请重试');
    };

    recognition.onend = () => {
      if (status === 'listening') setStatus('idle');
    };

    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setStatus('idle');
  };

  const isListening = status === 'listening';
  const isProcessing = status === 'processing';

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        title={isListening ? '点击停止录音' : '语音输入食物'}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        style={{
          backgroundColor: isListening ? `${color}30` : `${color}18`,
          border: `1.5px solid ${isListening ? color : `${color}50`}`,
          boxShadow: isListening ? `0 0 0 4px ${color}20` : 'none',
        }}
      >
        {isListening && (
          <span className="absolute inset-0 flex items-end justify-center gap-0.5 pb-1.5">
            {[0.4, 0.7, 1.0, 0.7, 0.4].map((h, i) => (
              <span
                key={i}
                className="w-0.5 rounded-full"
                style={{
                  backgroundColor: color,
                  animation: `voice-wave 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                  height: `${h * 14}px`,
                }}
              />
            ))}
          </span>
        )}
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" style={{ color }} />
        ) : isListening ? null : (
          <Mic className="w-4 h-4" style={{ color }} />
        )}
      </button>

      {toast && (
        <div
          className="absolute bottom-full mb-2 right-0 z-50 bg-white rounded-xl shadow-lg border border-border px-3 py-2 text-xs text-foreground whitespace-nowrap max-w-[220px] text-wrap leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ borderLeft: `3px solid ${color}` }}
        >
          {toast}
        </div>
      )}

      {isListening && (
        <div className="absolute bottom-full mb-2 right-0 z-50 bg-white rounded-xl shadow-lg border border-border px-3 py-2 text-xs text-muted-foreground whitespace-nowrap animate-in fade-in duration-300">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5 animate-pulse" style={{ backgroundColor: '#EF4444' }} />
          请说，我在听...（如：今天午餐吃了牛肉面）
        </div>
      )}

      {isProcessing && (
        <div className="absolute bottom-full mb-2 right-0 z-50 bg-white rounded-xl shadow-lg border border-border px-3 py-2 text-xs text-muted-foreground whitespace-nowrap animate-in fade-in duration-300">
          <span className="mr-1">正在帮小主去世界的角落搜寻热量秘密...</span>
        </div>
      )}

      <style>{`
        @keyframes voice-wave {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
