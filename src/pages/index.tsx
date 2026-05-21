import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs';
import Navbar from './components/Navbar';
import UserProfilePanel from './components/UserProfilePanel';
import CalorieDashboard from './components/CalorieDashboard';
import MealTracker from './components/MealTracker';
import ExerciseTracker from './components/ExerciseTracker';
import AdvicePanel from './components/AdvicePanel';
import BMICard from './components/BMICard';
import DailyReviewPanel from './components/DailyReviewPanel';
import PredictiveAdviceCard from './components/PredictiveAdviceCard';
import SettingsPanel from './components/SettingsPanel';
import HistoryTimeline from './components/HistoryTimeline';
import BottomNav from './components/BottomNav';
import GlobalTreeholeInput from './components/GlobalTreeholeInput';
import { loadProfile, loadTodayRecord, saveTodayRecord } from '../utils/storage';
import { idbSaveRecord } from '../utils/indexedDB';
import { syncRecordToCloud } from '../utils/supabaseDB';
import type { UserProfile, DailyRecord, FoodItem, MealType, ExerciseItem } from '../types';
import { LayoutDashboard, UtensilsCrossed, Dumbbell, Sparkles, BookOpen } from 'lucide-react';

const API_KEY_STORAGE = 'calorie_deepseek_api_key';

function loadApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) ?? '';
}

function saveApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

function hasMeals(record: DailyRecord): boolean {
  return Object.values(record.meals).some(items => items.length > 0);
}

export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    document.title = '卡路里管家 - 科学管理你的热量';
    const p = loadProfile();
    const r = loadTodayRecord();
    const key = loadApiKey();
    setProfile(p);
    setRecord(r);
    setApiKey(key);
  }, []);

  const handleRecordChange = useCallback((newRecord: DailyRecord) => {
    setRecord(newRecord);
    saveTodayRecord(newRecord);
    idbSaveRecord(newRecord).catch(() => {});
    syncRecordToCloud(newRecord).catch(() => {});
  }, []);

  const handleMealsUpdate = useCallback((updates: { mealType: MealType; item: FoodItem }[]) => {
    setRecord(prev => {
      if (!prev) return prev;
      const newMeals = { ...prev.meals };
      for (const { mealType, item } of updates) {
        newMeals[mealType] = [...newMeals[mealType], item];
      }
      const newRecord = { ...prev, meals: newMeals };
      saveTodayRecord(newRecord);
      idbSaveRecord(newRecord).catch(() => {});
      syncRecordToCloud(newRecord).catch(() => {});
      return newRecord;
    });
  }, []);

  const handleExercisesUpdate = useCallback((exercises: ExerciseItem[]) => {
    setRecord(prev => {
      if (!prev) return prev;
      const newRecord = { ...prev, exercises: [...prev.exercises, ...exercises] };
      saveTodayRecord(newRecord);
      idbSaveRecord(newRecord).catch(() => {});
      syncRecordToCloud(newRecord).catch(() => {});
      return newRecord;
    });
  }, []);

  const handleProfileSave = useCallback((p: UserProfile) => {
    setProfile(p);
  }, []);

  const handleApiKeySave = useCallback((key: string) => {
    setApiKey(key);
    saveApiKey(key);
  }, []);

  if (!record) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';
  const isComplete = !!profile && hasMeals(record);

  return (
    <div className="min-h-screen bg-background journal-texture pb-16 sm:pb-0">
      <Navbar
        profile={profile}
        onEditProfile={() => setShowProfile(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {greeting}，{profile?.name || '健康达人'}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {profile
                ? `你的目标：${profile.goal === 'lose' ? '减脂' : profile.goal === 'gain' ? '增肌' : '维持体重'}`
                : '设置个人信息，获取专属热量目标'}
            </p>
          </div>
          {profile && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="px-3 py-1.5 rounded-full bg-white border border-border shadow-xs">
                {profile.height}cm · {profile.weight}kg · {profile.age}岁
              </span>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="hidden sm:flex bg-white border border-border shadow-xs p-1 rounded-xl h-auto gap-1 w-full sm:w-auto">
            <TabsTrigger
              value="dashboard"
              className="flex items-center gap-1.5 rounded-lg text-xs sm:text-sm cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm flex-1 sm:flex-none"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>总览</span>
            </TabsTrigger>
            <TabsTrigger
              value="meals"
              className="flex items-center gap-1.5 rounded-lg text-xs sm:text-sm cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm flex-1 sm:flex-none"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>饮食</span>
            </TabsTrigger>
            <TabsTrigger
              value="exercise"
              className="flex items-center gap-1.5 rounded-lg text-xs sm:text-sm cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm flex-1 sm:flex-none"
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>运动</span>
            </TabsTrigger>
            <TabsTrigger
              value="review"
              className="flex items-center gap-1.5 rounded-lg text-xs sm:text-sm cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm flex-1 sm:flex-none relative"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI复盘</span>
              {isComplete && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-secondary border border-white" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-1.5 rounded-lg text-xs sm:text-sm cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm flex-1 sm:flex-none"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>手帐</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 mt-0">
            <GlobalTreeholeInput
              apiKey={apiKey}
              record={record}
              onMealsUpdate={handleMealsUpdate}
              onExercisesUpdate={handleExercisesUpdate}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <CalorieDashboard profile={profile} record={record} />
              </div>
              <div>
                {profile ? (
                  <BMICard profile={profile} />
                ) : (
                  <div
                    onClick={() => setShowProfile(true)}
                    className="rounded-2xl border border-dashed border-primary/30 p-8 text-center cursor-pointer hover:bg-primary/5 transition-colors h-full flex flex-col items-center justify-center gap-3 bg-white"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center">
                      <LayoutDashboard className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">完善个人信息</p>
                      <p className="text-xs text-muted-foreground mt-1">解锁 BMI 分析、目标热量计算和专属建议</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-primary" />
                  今日饮食概览
                </h3>
                <MealTracker record={record} apiKey={apiKey} onChange={handleRecordChange} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-blue-400" />
                  今日运动概览
                </h3>
                <ExerciseTracker record={record} onChange={handleRecordChange} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="meals" className="mt-0">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-foreground">今日饮食记录</h3>
              <p className="text-sm text-muted-foreground">输入食物名称后离开输入框，AI 自动估算卡路里</p>
            </div>
            <div className="space-y-4">
              <GlobalTreeholeInput
                apiKey={apiKey}
                record={record}
                onMealsUpdate={handleMealsUpdate}
                onExercisesUpdate={handleExercisesUpdate}
              />
              <MealTracker record={record} apiKey={apiKey} onChange={handleRecordChange} />
            </div>
          </TabsContent>

          <TabsContent value="exercise" className="mt-0">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-foreground">今日运动记录</h3>
              <p className="text-sm text-muted-foreground">每一滴汗水都值得被记录</p>
            </div>
            <ExerciseTracker record={record} onChange={handleRecordChange} />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-foreground">健康手帐 · 时光轴</h3>
              <p className="text-sm text-muted-foreground">翻阅你的每一天，看见坚持的力量</p>
            </div>
            <HistoryTimeline profile={profile} />
          </TabsContent>

          <TabsContent value="review" className="mt-0 space-y-5">
            <div className="mb-2">
              <h3 className="text-base font-semibold text-foreground">AI 今日复盘</h3>
              <p className="text-sm text-muted-foreground">
                录入今日所有数据后，让卡卡用温柔的语言为你做一次深度复盘
              </p>
            </div>
            <DailyReviewPanel
              profile={profile}
              record={record}
              apiKey={apiKey}
              isComplete={isComplete}
            />

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                翌日治愈锦囊
                <span className="text-xs text-muted-foreground font-normal">AI 预测明日专属方案</span>
              </h3>
              <PredictiveAdviceCard
                profile={profile}
                record={record}
                apiKey={apiKey}
                isComplete={isComplete}
              />
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                今日健康建议
                <span className="text-xs text-muted-foreground font-normal">基于数据实时生成</span>
              </h3>
              <AdvicePanel profile={profile} record={record} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} hasNewReview={isComplete} />

      <UserProfilePanel
        open={showProfile}
        profile={profile}
        onClose={() => setShowProfile(false)}
        onSave={handleProfileSave}
      />
      <SettingsPanel
        open={showSettings}
        apiKey={apiKey}
        onClose={() => setShowSettings(false)}
        onSave={handleApiKeySave}
      />
    </div>
  );
}
