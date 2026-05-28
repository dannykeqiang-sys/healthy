import { useState, useEffect, useCallback, useRef } from 'react';
import { history } from 'ice';
import { Copy } from 'lucide-react';
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
import TutorialOverlay from './components/TutorialOverlay';
import WeightChip from './components/WeightChip';
import DesktopHeader from './components/DesktopHeader';
import DesktopRightPanel from './components/DesktopRightPanel';
import ExportDataModal from './components/ExportDataModal';
import BatchImportModal from './components/BatchImportModal';
import type { MultiDateEntry } from '../utils/deepseek';
import { loadProfile, saveProfile, loadTodayRecord, saveTodayRecord, loadRecordByDate, saveRecordByDate } from '../utils/storage';
import { idbSaveRecord, idbGetRecord } from '../utils/indexedDB';
import { syncRecordToCloud, syncProfileToCloud, loadProfileFromCloud } from '../utils/supabaseDB';
import { getSession } from '../utils/auth';
import AIRecordCelebration from './components/AIRecordCelebration';
import type { UserProfile, DailyRecord, MealRecord, FoodItem, MealType, ExerciseItem, WaterItem } from '../types';

const API_KEY_STORAGE = 'calorie_deepseek_api_key';
const BUILT_IN_API_KEY = 'sk-c0385f6b8bcb406b91a59a56fab9a477';

function loadApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) || BUILT_IN_API_KEY;
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
  const [showTutorial, setShowTutorial] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiDefaultTab, setAiDefaultTab] = useState<'record' | 'chat'>('record');
  const [showAICelebration, setShowAICelebration] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showBatchImport, setShowBatchImport] = useState(false);

  const carouselRef = useRef<MealCarouselRef>(null);
  const desktopCarouselRef = useRef<MealCarouselRef>(null);
  const autoScrollSlot = useRef(0);
  const autoScrollResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!getSession()) {
      history?.push('/login');
      return;
    }
    document.title = '燃烧我的卡路里 - 科学管理你的热量';
    setRecord(loadTodayRecord());
    setApiKey(loadApiKey());
    const localProfile = loadProfile();
    if (localProfile) {
      setProfile(localProfile);
    } else {
      loadProfileFromCloud()
        .then(cloudProfile => {
          if (cloudProfile) {
            setProfile(cloudProfile);
            saveProfile(cloudProfile);
          } else {
            setShowOnboarding(true);
          }
        })
        .catch(() => {
          setShowOnboarding(true);
        });
    }
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
    setTimeout(() => {
      carouselRef.current?.scrollToMeal(type);
      desktopCarouselRef.current?.scrollToMeal(type);
    }, slot * 750 + 200);
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
        const newMeals = { ...prev.meals };
        const affectedTypes = new Set(updates.map(u => u.mealType));
        for (const type of affectedTypes) newMeals[type] = [];
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
      const newRecord = { ...prev, water: [...(prev.water ?? []), ...items] };
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
        const newMeals = { ...base.meals } as MealRecord;
        const affectedTypes = new Set(updates.map(u => u.mealType));
        for (const type of affectedTypes) newMeals[type] = [];
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
        const newRecord = { ...base, water: [...(base.water ?? []), ...items] };
        saveRecordByDate(newRecord);
        idbSaveRecord(newRecord).catch(() => {});
        return newRecord;
      });
    },
    [journalDate],
  );

  const handleWaterReplace = useCallback((items: WaterItem[]) => {
    setRecord(prev => {
      if (!prev) return prev;
      const newRecord = { ...prev, water: items };
      saveTodayRecord(newRecord);
      idbSaveRecord(newRecord).catch(() => {});
      syncRecordToCloud(newRecord).catch(() => {});
      return newRecord;
    });
  }, []);

  const handleHistoryWaterReplace = useCallback(
    (items: WaterItem[]) => {
      setHistoryRecord(prev => {
        const base = prev ?? makeEmptyRecord(journalDate);
        const newRecord = { ...base, water: items };
        saveRecordByDate(newRecord);
        idbSaveRecord(newRecord).catch(() => {});
        syncRecordToCloud(newRecord).catch(() => {});
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
    syncProfileToCloud(p).catch(() => {});
    setShowOnboarding(false);
    setShowTutorial(true);
  }, []);

  const handleTutorialDone = useCallback(() => {
    setShowTutorial(false);
  }, []);

  const handleReuseHistoryRecord = useCallback(() => {
    if (!historyRecord) return;
    setRecord(prev => {
      const base = prev ?? makeEmptyRecord(getTodayKey());
      const newRecord = {
        ...base,
        meals: { ...historyRecord.meals },
        exercises: [...historyRecord.exercises],
        water: [...(historyRecord.water ?? [])],
      };
      saveTodayRecord(newRecord);
      idbSaveRecord(newRecord).catch(() => {});
      syncRecordToCloud(newRecord).catch(() => {});
      return newRecord;
    });
  }, [historyRecord]);

  const handleProfileSave = useCallback((p: UserProfile) => {
    setProfile(p);
    syncProfileToCloud(p).catch(() => {});
  }, []);

  const handleApiKeySave = useCallback((key: string) => {
    setApiKey(key);
    saveApiKey(key);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    setProfile(null);
    setRecord(makeEmptyRecord(getTodayKey()));
    setApiKey(BUILT_IN_API_KEY);
    setShowSettings(false);
    setShowTutorial(false);
    setShowAICelebration(false);
    setShowOnboarding(true);
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

  const handleBatchImport = useCallback(async (entries: MultiDateEntry[]) => {
    const todayKey = getTodayKey();
    for (const entry of entries) {
      const isToday = entry.date === todayKey;
      const mealUpdates: { mealType: MealType; item: FoodItem }[] = [];
      for (const mt of ['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]) {
        for (const f of (entry.meals[mt] ?? [])) {
          mealUpdates.push({
            mealType: mt,
            item: { id: crypto.randomUUID(), name: f.name, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat, sodium: f.sodium },
          });
        }
      }
      const exerciseItems: ExerciseItem[] = (entry.exercises ?? []).map(e => ({
        id: crypto.randomUUID(), name: e.name, calories: e.calories, duration: 0,
      }));
      const waterItems: WaterItem[] = (entry.water_logs ?? []).map(w => ({
        id: crypto.randomUUID(), amount: w.amount, note: w.raw_text, time: '',
      }));
      if (isToday) {
        if (mealUpdates.length > 0) handleMealsUpdate(mealUpdates);
        if (exerciseItems.length > 0) handleExercisesUpdate(exerciseItems);
        if (waterItems.length > 0) handleWaterUpdate(waterItems);
      } else {
        let existing: DailyRecord;
        try {
          existing = (await idbGetRecord(entry.date)) ?? loadRecordByDate(entry.date) ?? makeEmptyRecord(entry.date);
        } catch {
          existing = loadRecordByDate(entry.date) ?? makeEmptyRecord(entry.date);
        }
        const newMeals = { ...existing.meals };
        for (const { mealType, item } of mealUpdates) {
          newMeals[mealType] = [...(newMeals[mealType] ?? []), item];
        }
        const newRecord: DailyRecord = {
          ...existing,
          meals: newMeals,
          exercises: [...(existing.exercises ?? []), ...exerciseItems],
          water: [...(existing.water ?? []), ...waterItems],
        };
        saveRecordByDate(newRecord);
        await idbSaveRecord(newRecord).catch(() => {});
      }
    }
  }, [handleMealsUpdate, handleExercisesUpdate, handleWaterUpdate]);

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
        onWaterReplace: (items: WaterItem[]) => { handleWaterReplace(items); closeDrawerAndGoToday(); },
      }
    : {
        onMealsUpdate: (updates: { mealType: MealType; item: FoodItem }[]) => { handleHistoryMealsUpdate(updates); closeDrawerAndGoToday(); },
        onMealsReplace: (updates: { mealType: MealType; item: FoodItem }[]) => { handleHistoryMealsReplace(updates); closeDrawerAndGoToday(); },
        onExercisesUpdate: (exercises: ExerciseItem[]) => { handleHistoryExercisesUpdate(exercises); closeDrawerAndGoToday(); },
        onExercisesReplace: (exercises: ExerciseItem[]) => { handleHistoryExercisesReplace(exercises); closeDrawerAndGoToday(); },
        onWaterUpdate: (items: WaterItem[]) => { handleHistoryWaterUpdate(items); closeDrawerAndGoToday(); },
        onWaterReplace: (items: WaterItem[]) => { handleHistoryWaterReplace(items); closeDrawerAndGoToday(); },
      };

  const desktopMainContent = (
    <>
      <div
        className="flex-shrink-0 z-30"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="px-6 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <DateSwitcher selectedDate={journalDate} onDateChange={setJournalDate} />
          </div>
          <div className="flex-shrink-0">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(163,184,153,0.12)', color: 'var(--primary)' }}>
              {isViewingToday ? '今日' : '历史'}
            </span>
          </div>
        </div>
      </div>

      {activeTab === 'today' && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {!isViewingToday && historyRecord && (
            <div className="flex-shrink-0 px-6 pt-3 pb-0">
              <button
                onClick={() => { handleReuseHistoryRecord(); setJournalDate(getTodayKey()); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/30 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                复用此日手帐到今天
              </button>
            </div>
          )}
          <div className="flex-1 min-h-0">
            <MealCarousel
              ref={desktopCarouselRef}
              record={activeRecord}
              apiKey={apiKey}
              isViewingToday={isViewingToday}
              profile={profile}
              journalDate={journalDate}
              fullscreen
              onChange={activeOnChange}
              onWaterReplace={isViewingToday ? handleWaterReplace : handleHistoryWaterReplace}
            />
          </div>
        </div>
      )}

      {activeTab !== 'today' && (
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.1) transparent' }}>
          <div className="px-6 py-5 space-y-5">
            {activeTab === 'analytics' && (
              <AnalyticsPanel profile={profile} record={activeRecord} journalDate={journalDate} />
            )}
            {activeTab === 'ai' && (
              <SmartAdvicePanel profile={profile} record={activeRecord} apiKey={apiKey} isViewingToday={isViewingToday} />
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* 桌面端全屏布局 */}
      <div
        className="hidden lg:flex flex-col overflow-hidden"
        style={{ height: '100dvh', background: 'var(--background)' }}
      >
        <DesktopHeader
          profile={profile}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onEditProfile={() => setShowProfile(true)}
          onOpenSettings={() => setShowSettings(true)}
          onBatchImport={() => setShowBatchImport(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 flex flex-col overflow-hidden">
            {desktopMainContent}
          </main>
          <DesktopRightPanel
            record={activeRecord}
            profile={profile}
            apiKey={apiKey}
            journalDate={journalDate}
            isViewingToday={isViewingToday}
            onMealsUpdate={aiHandlers.onMealsUpdate}
            onMealsReplace={aiHandlers.onMealsReplace}
            onExercisesUpdate={aiHandlers.onExercisesUpdate}
            onExercisesReplace={aiHandlers.onExercisesReplace}
            onWaterUpdate={aiHandlers.onWaterUpdate}
            onWaterReplace={aiHandlers.onWaterReplace}
            onRecordSuccess={() => setShowAICelebration(true)}
          />
        </div>
      </div>

      {/* 移动端布局 */}
      <div className="lg:hidden min-h-screen bg-background journal-texture pb-20">
        <Navbar
          profile={profile}
          onEditProfile={() => setShowProfile(true)}
          onOpenSettings={() => setShowSettings(true)}
        />

        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-border/40">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-1.5 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <DateSwitcher
                selectedDate={journalDate}
                onDateChange={setJournalDate}
              />
            </div>
            <WeightChip journalDate={journalDate} />
          </div>
        </div>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
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

              <div data-tutorial="cards">
                <MealCarousel
                  ref={carouselRef}
                  record={activeRecord}
                  apiKey={apiKey}
                  isViewingToday={isViewingToday}
                  profile={profile}
                  journalDate={journalDate}
                  onChange={activeOnChange}
                  onWaterReplace={isViewingToday ? handleWaterReplace : handleHistoryWaterReplace}
                />
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPanel profile={profile} record={activeRecord} journalDate={journalDate} />
          )}

          {activeTab === 'ai' && (
            <SmartAdvicePanel profile={profile} record={activeRecord} apiKey={apiKey} isViewingToday={isViewingToday} />
          )}
        </main>

        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onAIOpen={handleHubPress}
        />
      </div>

      {/* 共享弹层 */}
      <AIDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        profile={profile}
        record={activeRecord}
        apiKey={apiKey}
        isViewingToday={isViewingToday}
        defaultTab={aiDefaultTab}
        onRecordSuccess={() => setShowAICelebration(true)}
        {...aiHandlers}
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
        onLogout={handleLogout}
        onExport={() => setShowExport(true)}
        onBatchImport={() => setShowBatchImport(true)}
      />

      <ExportDataModal
        open={showExport}
        onClose={() => setShowExport(false)}
      />

      <BatchImportModal
        open={showBatchImport}
        onClose={() => setShowBatchImport(false)}
        apiKey={apiKey}
        onImport={handleBatchImport}
      />

      {showOnboarding && (
        <OnboardingPanel onComplete={handleOnboardingComplete} />
      )}

      {showTutorial && profile && (
        <TutorialOverlay
          name={profile.name}
          onDone={handleTutorialDone}
          onTabChange={handleTabChange}
        />
      )}

      {showAICelebration && (
        <AIRecordCelebration onDismiss={() => setShowAICelebration(false)} />
      )}
    </>
  );
}
