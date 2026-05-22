import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shadcn/dialog';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Eye, EyeOff, Key, ExternalLink } from 'lucide-react';

interface SettingsPanelProps {
  open: boolean;
  apiKey: string;
  onClose: () => void;
  onSave: (key: string) => void;
}

export default function SettingsPanel({ open, apiKey, onClose, onSave }: SettingsPanelProps) {
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  // 同步 apiKey prop 到 inputKey 状态
  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  const handleSave = () => {
    onSave(inputKey.trim());
    onClose();
  };

  const maskedKey = inputKey
    ? inputKey.slice(0, 6) + '•'.repeat(Math.max(0, inputKey.length - 10)) + inputKey.slice(-4)
    : '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            DeepSeek API 设置
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            配置 API Key 以启用 AI 复盘与语音卡路里估算功能
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-foreground text-sm">API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                placeholder="sk-..."
                className="bg-muted border-border text-foreground pr-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {inputKey && !showKey && (
              <p className="text-xs text-muted-foreground font-mono">{maskedKey}</p>
            )}
          </div>

          <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-primary">使用须知</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>API Key 仅存储在本地浏览器，不会上传到任何服务器</li>
              <li>语音卡路里估算（每次约 0.001 元）和 AI 复盘会消耗 API 额度</li>
              <li>在 DeepSeek 官网注册账号可获得免费额度</li>
            </ul>
            <a
              href="https://platform.deepseek.com/api_keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              前往获取 API Key
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border cursor-pointer"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
            >
              保存配置
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
