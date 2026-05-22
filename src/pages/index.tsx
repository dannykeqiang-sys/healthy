import { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, TrendingUp, Copy, ActivitySquare } from 'lucide-react';
import Navbar from './components/Navbar';
import UserProfilePanel from './components/UserProfilePanel';
import SettingsPanel from './components/SettingsPanel';
import BottomNav from './components/BottomNav';
import AIDrawer from './components/AIDrawer';
import MealCarousel from './components/MealCarousel';
import type { MealCarouselRef } from './components/MealCarousel';
import DateSwitcher from './components/DateSwitcher';
import AnalyticsPanel from './components/AnalyticsPanel';
import SmartAdvicePanel from './components/SmartAdvicePanel';
import OnboardingPanel from './components/OnboardingPanel';
import { loadProfile, loadTodayRecord, saveTodayRecord, loadRecordByDate, saveRecordByDate } from '../utils/storage';
import { idbSaveRecord, idbGetRecord } from '../utils/indexedDB';
import { syncRecordToCloud } from '../utils/supabaseDB';
import type { UserProfile, DailyRecord, MealRecord, FoodItem, MealType, ExerciseItem, WaterItem } from '../types';

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

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

const DESKTOP_TABS = [
  { value: 'today', label: '今日手帐', icon: BookOpen },
  { value: 'analytics', label: '时光机', icon: TrendingUp },
  { value: 'ai', label: 'AI 分析', icon: ActivitySquare },
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDefaultTab, setAiDefaultTab] = useState<'record' | 'chat'>('record');

  const carouselRef = useRef<MealCarouselRef>(null);
  const autoScrollSlot = useRef(0);
  const autoScrollResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.title = '燃烧我的卡路里 - 科学管理你的热量';
    const p = loadProfile();
    setProfile(p);
    setRecord(loadTodayRecord());
    setApiKey(loadApiKey());
    if (!p) setShowOnboarding(true);
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

  const handleWaterUpdate = useCallback((items: WaterItem[]) => {
    setRecord(prev => {
      if (!prev) return prev;
      const newRecord = { ...prev, water: [...prev.water, ...items] };
      saveTodayRecord(newRecord);
      idbSaveRecord(newRecord).catch(() => {});
      syncRecordToCloud(newRecord).catch(() => {});
      return newRecord;
    });
  }, []);

  const handleHistoryMealsUpdate = useCallback(
    (updates: { mealType: MealType; item: FoodItem }[]) => {
      setHistoryRecord(prev => {
        const base = prev ?? makeEmptyRecord(journalDate);
        const newMeals = { ...base.meals };
        for (const { mealType, item } of updates) {
          newMeals[mealType] = [...newMeals[mealType], item];
        }
        const newRecord = { ...base, meals: newMeals };
        saveRecordByDate(newRecord);
        idbSaveRecord(newRecord).catch(() => {});
        return newRecord;
      });
      const uniqueTypes = [...new Set(updates.map(u => u.mealType))];
      uniqueTypes.forEach(type => scheduleScroll(type));
    },
    [journalDate, scheduleScroll],
  );

  const handleHistoryMealsReplace = useCallback(
    (updates: { mealType: MealType; item: FoodItem }[]) => {
      setHistoryRecord(prev => {
        const base = prev ?? makeEmptyRecord(journalDate);
        const newMeals = { breakfast: [], lunch: [], dinner: [], snack: [] } as MealRecord;
        for (const { mealType, item } of updates) {
          newMeals[mealType] = [...newMeals[mealType], item];
        }
        const newRecord = { ...base, meals: newMeals };
        saveRecordByDate(newRecord);
        idbSaveRecord(newRecord).catch(() => {});
        return newRecord;
      });
      const uniqueTypes = [...new Set(updates.map(u => u.mealType))];
      uniqueTypes.forEach(type => scheduleScroll(type));
    },
    [journalDate, scheduleScroll],
  );

  const handleHistoryExercisesUpdate = useCallback(
    (exercises: ExerciseItem[]) => {
      setHistoryRecord(prev => {
        const base = prev ?? makeEmptyRecord(journalDate);
        const newRecord = { ...base, exercises: [...base.exercises, ...exercises] };
        saveRecordByDate(newRecord);
        idbSaveRecord(newRecord).catch(() => {});
        return newRecord;
      });
      if (exercises.length > 0) scheduleScroll('exercise');
    },
    [journalDate, scheduleScroll],
  );

  const handleHistoryExercisesReplace = useCallback(
    (exercises: ExerciseItem[]) => {
      setHistoryRecord(prev => {
        const base = prev ?? makeEmptyRecord(journalDate);
        const newRecord = { ...base, exercises };
        saveRecordByDate(newRecord);
        idbSaveRecord(newRecord).catch(() => {});
        return newRecord;
      });
      if (exercises.length > 0) scheduleScroll('exercise');
    },
    [journalDate, scheduleScroll],
  );

  const handleHistoryWaterUpdate = useCallback(
    (items: WaterItem[]) => {
      setHistoryRecord(prev => {
        const base = prev ?? makeEmptyRecord(journalDate);
        const newRecord = { ...base, water: [...base.water, ...items] };
        saveRecordByDate(newRecord);
        idbSaveRecord(newRecord).catch(() => {});
        return newRecord;
      });
    },
    [journalDate],
  );

  const handleOnboardingComplete = useCallback((p: UserProfile, key: string) => {
    setProfile(p);
    if (key) {
      setApiKey(key);
      saveApiKey(key);
    }
    setShowOnboarding(false);
  }, []);

  const handleReuseHistoryRecord = useCallback(() => {
    if (!historyRecord) return;
    setRecord(prev => {
      const base = prev ?? makeEmptyRecord(getTodayKey());
      const newRecord = {
        ...base,
        meals: { ...historyRecord.meals },
        exercises: [...historyRecord.exercises],
        water: [...historyRecord.water],
      };
      saveTodayRecord(newRecord);
      idbSaveRecord(newRecord).catch(() => {});
      syncRecordToCloud(newRecord).catch(() => {});
      return newRecord;
    });
  }, [historyRecord]);

  const handleProfileSave = useCallback((p: UserProfile) => {
    setProfile(p);
  }, []);

  const handleApiKeySave = useCallback((key: string) => {
    setApiKey(key);
    saveApiKey(key);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    if (tab !== 'ai') setAiOpen(false);
  }, []);

  const handleHubPress = useCallback(() => {
    if (activeTab !== 'ai') {
      setActiveTab('ai');
    } else {
      setAiDefaultTab('record');
      setAiOpen(true);
    }
  }, [activeTab]);

  const closeDrawerAndGoToday = useCallback(() => {
    setAiOpen(false);
    setActiveTab('today');
  }, []);

  if (!record) return null;

  const today = getTodayKey();
  const isViewingToday = journalDate === today;
  const activeRecord = isViewingToday ? record : (historyRecord ?? makeEmptyRecord(journalDate));
  const activeOnChange = isViewingToday ? handleRecordChange : handleHistoryRecordChange;

  const aiHandlers = isViewingToday
    ? {
        onMealsUpdate: (updates: { mealType: MealType; item: FoodItem }[]) => { handleMealsUpdate(updates); closeDrawerAndGoToday(); },
        onMealsReplace: (updates: { mealType: MealType; item: FoodItem }[]) => { handleMealsReplace(updates); closeDrawerAndGoToday(); },
        onExercisesUpdate: (exercises: ExerciseItem[]) => { handleExercisesUpdate(exercises); closeDrawerAndGoToday(); },
        onExercisesReplace: (exercises: ExerciseItem[]) => { handleExercisesReplace(exercises); closeDrawerAndGoToday(); },
        onWaterUpdate: (items: WaterItem[]) => { handleWaterUpdate(items); closeDrawerAndGoToday(); },
      }
    : {
        onMealsUpdate: (updates: { mealType: MealType; item: FoodItem }[]) => { handleHistoryMealsUpdate(updates); closeDrawerAndGoToday(); },
        onMealsReplace: (updates: { mealType: MealType; item: FoodItem }[]) => { handleHistoryMealsReplace(updates); closeDrawerAndGoToday(); },
        onExercisesUpdate: (exercises: ExerciseItem[]) => { handleHistoryExercisesUpdate(exercises); closeDrawerAndGoToday(); },
        onExercisesReplace: (exercises: ExerciseItem[]) => { handleHistoryExercisesReplace(exercises); closeDrawerAndGoToday(); },
        onWaterUpdate: (items: WaterItem[]) => { handleHistoryWaterUpdate(items); closeDrawerAndGoToday(); },
      };

  return (
    <div className="min-h-screen bg-background journal-texture pb-20 sm:pb-0">
      <Navbar
        profile={profile}
        onEditProfile={() => setShowProfile(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-2">
          <DateSwitcher
            selectedDate={journalDate}
            onDateChange={setJournalDate}
          />
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
          <div className="hidden sm:flex items-center gap-1 bg-white border border-border rounded-xl p-1 shadow-xs">
            {DESKTOP_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
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
            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-lg font-bold text-foreground leading-none">对比时光机</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isViewingToday ? '近7天健康趋势分析' : `${formatDateLabel(journalDate)} · 近7天趋势`}
                </p>
              </div>
            )}
            {activeTab === 'ai' && (
              <div>
                <h2 className="text-lg font-bold text-foreground leading-none">AI 分析</h2>
                <p className="text-xs text-muted-foreground mt-0.5">炎症指数 · 训练建议 · 智能分析</p>
              </div>
            )}
          </div>
        </div>

        {activeTab === 'today' && (
          <div className="space-y-4">
            {!isViewingToday && historyRecord && (
              <button
                onClick={() => { handleReuseHistoryRecord(); setJournalDate(getTodayKey()); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/30 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                复用此日手帐到今天
              </button>
            )}

            <MealCarousel
              ref={carouselRef}
              record={activeRecord}
              apiKey={apiKey}
              isViewingToday={isViewingToday}
              profile={profile}
              onChange={activeOnChange}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPanel profile={profile} record={activeRecord} journalDate={journalDate} />
        )}

        {activeTab === 'ai' && (
          <SmartAdvicePanel profile={profile} record={activeRecord} apiKey={apiKey} />
        )}
      </main>

      <AIDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        profile={profile}
        record={activeRecord}
        apiKey={apiKey}
        isViewingToday={isViewingToday}
        defaultTab={aiDefaultTab}
        {...aiHandlers}
      />

      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onAIOpen={handleHubPress}
      />

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

      {showOnboarding && (
        <OnboardingPanel onComplete={handleOnboardingComplete} />
      )}
    </div>
  );
}
