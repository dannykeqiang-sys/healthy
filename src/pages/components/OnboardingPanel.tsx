import { useState } from 'react';
import { User, Ruler, Weight, Target, Activity, Key, ChevronRight, Sparkles } from 'lucide-react';
import { saveProfile } from '../../utils/storage';
import type { UserProfile, Gender, GoalType, ActivityLevel } from '../../types';

interface OnboardingPanelProps {
  onComplete: (profile: UserProfile, apiKey: string) => void;
}

const GOAL_OPTIONS: { value: GoalType; label: string; desc: string }[] = [
  { value: 'lose', label: '减脂塑形', desc: '控制热量，打造好身材' },
  { value: 'maintain', label: '维持体重', desc: '保持现有状态，健康生活' },
  { value: 'gain', label: '增肌增重', desc: '增加热量摄入，强化体魄' },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary', label: '久坐不动', desc: '几乎不运动，以脑力工作为主' },
  { value: 'light', label: '轻度活跃', desc: '每周1-3次轻度运动' },
  { value: 'moderate', label: '中度活跃', desc: '每周3-5次中等强度运动' },
  { value: 'active', label: '高度活跃', desc: '每周6-7次高强度运动' },
  { value: 'very_active', label: '超高强度', desc: '每天高强度运动或体力劳动' },
];

function calcBMR(profile: Partial<UserProfile>): number {
  if (!profile.weight || !profile.height || !profile.age || !profile.gender) return 0;
  return profile.gender === 'male'
    ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
    : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
}

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};

function calcTarget(profile: Partial<UserProfile>): number {
  const bmr = calcBMR(profile);
  if (!bmr || !profile.activityLevel || !profile.goal) return 0;
  const tdee = bmr * ACTIVITY_FACTOR[profile.activityLevel];
  return Math.round(
    profile.goal === 'lose' ? tdee - 500 : profile.goal === 'gain' ? tdee + 300 : tdee,
  );
}

function calcBMIValue(weight: number, height: number): number {
  return Math.round((weight / ((height / 100) ** 2)) * 10) / 10;
}

export default function OnboardingPanel({ onComplete }: OnboardingPanelProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<GoalType>('maintain');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const partial: Partial<UserProfile> = {
    gender,
    age: Number(age) || 0,
    height: Number(height) || 0,
    weight: Number(weight) || 0,
    goal,
    activityLevel,
  };

  const targetCalories = calcTarget(partial);
  const bmi = height && weight ? calcBMIValue(Number(weight), Number(height)) : 0;

  const canNext0 = name.trim().length > 0 && gender;
  const canNext1 = Number(age) >= 10 && Number(age) <= 120 && Number(height) >= 100 && Number(height) <= 250 && Number(weight) >= 20 && Number(weight) <= 300;
  const canFinish = canNext0 && canNext1;

  const handleComplete = () => {
    if (!canFinish) return;
    const profile: UserProfile = {
      name: name.trim(),
      gender,
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      goal,
      activityLevel,
    };
    saveProfile(profile);
    onComplete(profile, apiKey.trim());
  };

  const STEPS = ['基本信息', '身体数据', '目标设定', 'API 配置'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md my-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground">欢迎来到卡路里管家</h1>
          <p className="text-sm text-muted-foreground mt-1">花30秒完善信息，解锁专属健康方案</p>
        </div>

        <div className="flex items-center gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full h-1.5 rounded-full transition-all"
                style={{ backgroundColor: i <= step ? 'var(--primary)' : '#e5e7eb' }}
              />
              <span className="text-[10px] text-muted-foreground hidden sm:block">{s}</span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white border border-border shadow-sm overflow-hidden">
          {step === 0 && (
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">你叫什么名字？</h2>
              </div>

              <div>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="输入你的昵称"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  maxLength={20}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">性别</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['male', 'female'] as Gender[]).map(g => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className="py-3 rounded-xl border text-sm font-medium transition-all cursor-pointer"
                      style={{
                        borderColor: gender === g ? 'var(--primary)' : 'var(--border)',
                        backgroundColor: gender === g ? 'rgba(163,184,153,0.12)' : 'transparent',
                        color: gender === g ? 'var(--primary)' : 'var(--muted-foreground)',
                      }}
                    >
                      {g === 'male' ? '男生' : '女生'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Ruler className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">身体数据</h2>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">年龄</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      placeholder="25"
                      min={10}
                      max={120}
                      className="w-full px-3 py-3 pr-6 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span className="absolute right-2 top-3 text-xs text-muted-foreground">岁</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">身高</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={height}
                      onChange={e => setHeight(e.target.value)}
                      placeholder="165"
                      min={100}
                      max={250}
                      className="w-full px-3 py-3 pr-6 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span className="absolute right-2 top-3 text-xs text-muted-foreground">cm</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">体重</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      placeholder="55"
                      min={20}
                      max={300}
                      className="w-full px-3 py-3 pr-6 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span className="absolute right-2 top-3 text-xs text-muted-foreground">kg</span>
                  </div>
                </div>
              </div>

              {bmi > 0 && (
                <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">BMI 指数</span>
                  <span className="text-lg font-black text-primary">{bmi}</span>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">你的目标</h2>
              </div>

              <div className="space-y-2">
                {GOAL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setGoal(opt.value)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer"
                    style={{
                      borderColor: goal === opt.value ? 'var(--primary)' : 'var(--border)',
                      backgroundColor: goal === opt.value ? 'rgba(163,184,153,0.1)' : 'transparent',
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all"
                      style={{
                        borderColor: goal === opt.value ? 'var(--primary)' : 'var(--border)',
                        backgroundColor: goal === opt.value ? 'var(--primary)' : 'transparent',
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">活动水平</p>
                </div>
                <div className="space-y-1.5">
                  {ACTIVITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setActivityLevel(opt.value)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer"
                      style={{
                        borderColor: activityLevel === opt.value ? 'var(--primary)' : 'var(--border)',
                        backgroundColor: activityLevel === opt.value ? 'rgba(163,184,153,0.1)' : 'transparent',
                      }}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0"
                        style={{
                          borderColor: activityLevel === opt.value ? 'var(--primary)' : 'var(--border)',
                          backgroundColor: activityLevel === opt.value ? 'var(--primary)' : 'transparent',
                        }}
                      />
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-foreground">{opt.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{opt.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {targetCalories > 0 && (
                <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">每日目标热量</span>
                  <span className="text-lg font-black text-primary">{targetCalories} <span className="text-xs font-normal">kcal</span></span>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Key className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">DeepSeek API Key</h2>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">用于 AI 智能识别饮食、生成健康建议。可在设置中修改，跳过则仅关闭 AI 功能。</p>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 pr-16 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer px-1"
                >
                  {showKey ? '隐藏' : '显示'}
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                前往 <span className="text-primary font-medium">platform.deepseek.com</span> 注册并获取 API Key，每天可免费使用一定额度。
              </p>
            </div>
          )}

          <div className="px-6 pb-6 flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-5 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:bg-border/30 transition-all cursor-pointer"
              >
                上一步
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 0 ? !canNext0 : step === 1 ? !canNext1 : false}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                下一步
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canFinish}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Sparkles className="w-4 h-4" />
                开始记录健康之旅
              </button>
            )}
          </div>
        </div>

        {step === 3 && (
          <button
            onClick={() => onComplete({
              name: name.trim() || '健康达人',
              gender,
              age: Number(age) || 25,
              height: Number(height) || 165,
              weight: Number(weight) || 60,
              goal,
              activityLevel,
            }, '')}
            className="w-full text-center text-xs text-muted-foreground mt-3 cursor-pointer hover:text-foreground transition-colors"
          >
            跳过 API Key，稍后再设置
          </button>
        )}
      </div>
    </div>
  );
}
