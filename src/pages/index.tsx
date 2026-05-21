import { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, Sparkles, TrendingUp } from 'lucide-react';
import Navbar from './components/Navbar';
import UserProfilePanel from './components/UserProfilePanel';
import CalorieDashboard from './components/CalorieDashboard';
import AdvicePanel from './components/AdvicePanel';
import BMICard from './components/BMICard';
import SmartAdvicePanel from './components/SmartAdvicePanel';
import SettingsPanel from './components/SettingsPanel';
import BottomNav from './components/BottomNav';
import GlobalTreeholeInput from './components/GlobalTreeholeInput';
import MealCarousel from './components/MealCarousel';
import type { MealCarouselRef } from './components/MealCarousel';
import DateSwitcher from './components/DateSwitcher';
import AnalyticsPanel from './components/AnalyticsPanel';
import AIChatPanel from './components/AIChatPanel';
import { loadProfile, loadTodayRecord, saveTodayRecord, loadRecordByDate, saveRecordByDate } from '../utils/storage';
import { idbSaveRecord, idbGetRecord } from '../utils/indexedDB';
import { syncRecordToCloud } from '../utils/supabaseDB';
import type { UserProfile, DailyRecord, MealRecord, FoodItem, MealType, ExerciseItem } from '../types';

const API_KEY_STORAGE = 'calorie_deepseek_api_key';

function loadApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) ?? '';
}

function saveApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function makeEmptyRecord(date: string): DailyRecord {
  return {
    date,
    meals: { breakfast: [], lunch: [], dinner: [], snack: [] } as MealRecord,
    exercises: [],
    water: [],
  };
}

const DESKTOP_TABS = [
  { value: 'today', label: '今日手帐', icon: BookOpen },
  { value: 'advice', label: 'AI建议', icon: Sparkles },
  { value: 'analytics', label: '时光机', icon: TrendingUp },
];

export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState('today');
  const [journalDate, setJournalDate] = useState(getTodayKey);
  const [historyRecord, setHistoryRecord] = useState<DailyRecord | null>(null);

  const carouselRef = useRef<MealCarouselRef>(null);
  const autoScrollSlot = useRef(0);
  const autoScrollResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.title = '卡路里管家 - 科学管理你的热量';
    setProfile(loadProfile());
    setRecord(loadTodayRecord());
    setApiKey(loadApiKey());
  }, []);

  useEffect(() => {
    const today = getTodayKey();
    if (journalDate === today) {
      setHistoryRecord(null);
      return;
    }
    idbGetRecord(journalDate)
      .then(idbRec => {
        setHistoryRecord(idbRec ?? loadRecordByDate(journalDate));
      })
      .catch(() => {
        setHistoryRecord(loadRecordByDate(journalDate));
      });
  }, [journalDate]);

  const scheduleScroll = useCallback((type: MealType | 'exercise') => {
    const slot = autoScrollSlot.current;
    autoScrollSlot.current = slot + 1;
    setTimeout(() => carouselRef.current?.scrollToMeal(type), slot * 750 + 200);
    if (autoScrollResetTimer.current) clearTimeout(autoScrollResetTimer.current);
    autoScrollResetTimer.current = setTimeout(
      () => { autoScrollSlot.current = 0; },
      (slot + 1) * 750 + 1200,
    );
  }, []);

  const handleRecordChange = useCallback((newRecord: DailyRecord) => {
    setRecord(newRecord);
    saveTodayRecord(newRecord);
    idbSaveRecord(newRecord).catch(() => {});
    syncRecordToCloud(newRecord).catch(() => {});
  }, []);

  const handleHistoryRecordChange = useCallback((newRecord: DailyRecord) => {
    setHistoryRecord(newRecord);
    saveRecordByDate(newRecord);
    idbSaveRecord(newRecord).catch(() => {});
  }, []);

  const handleMealsUpdate = useCallback(
    (updates: { mealType: MealType; item: FoodItem }[]) => {
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
      const uniqueTypes = [...new Set(updates.map(u => u.mealType))];
      uniqueTypes.forEach(type => scheduleScroll(type));
    },
    [scheduleScroll],
  );

  const handleExercisesUpdate = useCallback(
    (exercises: ExerciseItem[]) => {
      setRecord(prev => {
        if (!prev) return prev;
        const newRecord = { ...prev, exercises: [...prev.exercises, ...exercises] };
        saveTodayRecord(newRecord);
        idbSaveRecord(newRecord).catch(() => {});
        syncRecordToCloud(newRecord).catch(() => {});
        return newRecord;
      });
      if (exercises.length > 0) scheduleScroll('exercise');
    },
    [scheduleScroll],
  );

  const handleMealsReplace = useCallback(
    (updates: { mealType: MealType; item: FoodItem }[]) => {
      setRecord(prev => {
        if (!prev) return prev;
        const newMeals = { breakfast: [], lunch: [], dinner: [], snack: [] } as typeof prev.meals;
        for (const { mealType, item } of updates) {
          newMeals[mealType] = [...newMeals[mealType], item];
        }
        const newRecord = { ...prev, meals: newMeals };
        saveTodayRecord(newRecord);
        idbSaveRecord(newRecord).catch(() => {});
        syncRecordToCloud(newRecord).catch(() => {});
        return newRecord;
      });
      const uniqueTypes = [...new Set(updates.map(u => u.mealType))];
      uniqueTypes.forEach(type => scheduleScroll(type));
    },
    [scheduleScroll],
  );

  const handleExercisesReplace = useCallback(
    (exercises: ExerciseItem[]) => {
      setRecord(prev => {
        if (!prev) return prev;
        const newRecord = { ...prev, exercises };
        saveTodayRecord(newRecord);
        idbSaveRecord(newRecord).catch(() => {});
        syncRecordToCloud(newRecord).catch(() => {});
        return newRecord;
      });
      if (exercises.length > 0) scheduleScroll('exercise');
    },
    [scheduleScroll],
  );

  const handleWaterUpdate = useCallback((items: import('../types').WaterItem[]) => {
    setRecord(prev => {
      if (!prev) return prev;
      const newRecord = { ...prev, water: [...prev.water, ...items] };
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

  const today = getTodayKey();
  const isViewingToday = journalDate === today;
  const activeRecord = isViewingToday ? record : (historyRecord ?? makeEmptyRecord(journalDate));
  const activeOnChange = isViewingToday ? handleRecordChange : handleHistoryRecordChange;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

  return (
    <div className="min-h-screen bg-background journal-texture pb-20 sm:pb-0">
      <Navbar
        profile={profile}
        onEditProfile={() => setShowProfile(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
          <div className="hidden sm:flex items-center gap-1 bg-white border border-border rounded-xl p-1 shadow-xs">
            {DESKTOP_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                  style={{
                    backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                    color: isActive ? 'white' : 'var(--muted-foreground)',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 sm:flex-none">
            {activeTab === 'today' && (
              <div>
                <h2 className="text-lg font-bold text-foreground leading-none">今日手帐</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isViewingToday ? '记录今天的饮食与运动' : '查看或编辑历史记录'}
                </p>
              </div>
            )}
            {activeTab === 'advice' && (
              <div>
                <h2 className="text-lg font-bold text-foreground leading-none">
                  {greeting}，{profile?.name || '健康达人'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {profile
                    ? `目标：${profile.goal === 'lose' ? '减脂' : profile.goal === 'gain' ? '增肌' : '维持体重'}`
                    : '设置信息，解锁专属目标'}
                </p>
              </div>
            )}
            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-lg font-bold text-foreground leading-none">对比时光机</h2>
                <p className="text-xs text-muted-foreground mt-0.5">近7天健康趋势分析</p>
              </div>
            )}
          </div>
        </div>

        {activeTab === 'today' && (
          <div className="space-y-4">
            <DateSwitcher
              selectedDate={journalDate}
              onDateChange={setJournalDate}
            />

            {isViewingToday && (
              <GlobalTreeholeInput
                apiKey={apiKey}
                record={record}
                onMealsUpdate={handleMealsUpdate}
                onMealsReplace={handleMealsReplace}
                onExercisesUpdate={handleExercisesUpdate}
                onExercisesReplace={handleExercisesReplace}
                onWaterUpdate={handleWaterUpdate}
              />
            )}

            <MealCarousel
              ref={carouselRef}
              record={activeRecord}
              apiKey={apiKey}
              onChange={activeOnChange}
            />
          </div>
        )}

        {activeTab === 'advice' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CalorieDashboard profile={profile} record={record} />
              {profile ? (
                <BMICard profile={profile} />
              ) : (
                <button
                  onClick={() => setShowProfile(true)}
                  className="rounded-2xl border border-dashed border-primary/30 p-6 text-center cursor-pointer hover:bg-primary/5 transition-colors bg-white flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">完善个人信息</p>
                  <p className="text-xs text-muted-foreground">解锁BMI分析与专属热量目标</p>
                </button>
              )}
            </div>

            <AIChatPanel profile={profile} record={record} apiKey={apiKey} />

            <SmartAdvicePanel profile={profile} record={record} apiKey={apiKey} />

            <AdvicePanel profile={profile} record={record} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPanel profile={profile} />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

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
