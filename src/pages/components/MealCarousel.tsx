import { useRef, useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Sunrise, Sun, Moon, Cookie, Dumbbell, Droplets } from 'lucide-react';
import MealCardSlot from './MealCardSlot';
import ExerciseCardSlot from './ExerciseCardSlot';
import WaterCardSlot from './WaterCardSlot';
import type { MealSlotConfig, MacroTarget } from './MealCardSlot';
import type { ExerciseSlotConfig } from './ExerciseCardSlot';
import type { WaterSlotConfig } from './WaterCardSlot';
import type { DailyRecord, MealType, FoodItem, ExerciseItem, WaterItem, UserProfile } from '../../types';
import { calcMacroTargets, getDefaultMacroTargets } from '../../utils/calculations';

const MEAL_RATIOS: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.30,
  snack: 0.10,
};

export type CarouselCardType = MealType | 'exercise' | 'water';

export interface MealCarouselRef {
  scrollToMeal: (type: CarouselCardType) => void;
}

const CARD_ORDER: CarouselCardType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'exercise', 'water'];

const IMAGE_POOLS: Record<CarouselCardType, string[]> = {
  breakfast: [
    'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&q=80',
    'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=800&q=80',
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
  ],
  lunch: [
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
  ],
  dinner: [
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    'https://images.unsplash.com/photo-1544025162-d76538941a80?w=800&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3b48?w=800&q=80',
  ],
  snack: [
    'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&q=80',
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80',
    'https://images.unsplash.com/photo-1559181567-c3190958d845?w=800&q=80',
    'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80',
    'https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=800&q=80',
  ],
  exercise: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
  ],
  water: [
    'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80',
    'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&q=80',
    'https://images.unsplash.com/photo-1499638673-c22d679197ed?w=800&q=80',
    'https://images.unsplash.com/photo-1500829996759-6e4f5f8dcc43?w=800&q=80',
    'https://images.unsplash.com/photo-1536489885935-3513cf28dd77?w=800&q=80',
  ],
};

function getDailyImageUrl(type: CarouselCardType, dateStr: string): string {
  const pool = IMAGE_POOLS[type] ?? [];
  if (!pool.length) return '';
  let hash = 0;
  for (const ch of (dateStr + type)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[hash % pool.length];
}

const MEAL_CONFIGS_BASE: (Omit<MealSlotConfig, 'imageUrl'> & { type: MealType; pageBg: string })[] = [
  {
    type: 'breakfast',
    label: '早餐',
    en: 'BREAKFAST',
    num: '01',
    icon: Sunrise,
    gradientFrom: '#FFF7ED',
    gradientVia: '#FEF3E2',
    gradientTo: '#FFFBF5',
    accent: '#F97316',
    pageBg: 'linear-gradient(145deg, #FFF9F0, #FEEDD5, #FFF5E6)',
    time: '07:00 ~ 09:00',
    placeholder: '如：燕麦粥、鸡蛋、牛奶',
  },
  {
    type: 'lunch',
    label: '午餐',
    en: 'LUNCH',
    num: '02',
    icon: Sun,
    gradientFrom: '#F0FDF4',
    gradientVia: '#DCFCE7',
    gradientTo: '#F7FEF9',
    accent: '#22C55E',
    pageBg: 'linear-gradient(145deg, #F2FFF5, #D5F8E2, #EDFBF2)',
    time: '11:30 ~ 13:30',
    placeholder: '如：米饭、鸡胸肉、炒蔬菜',
  },
  {
    type: 'dinner',
    label: '晚餐',
    en: 'DINNER',
    num: '03',
    icon: Moon,
    gradientFrom: '#EFF6FF',
    gradientVia: '#DBEAFE',
    gradientTo: '#F5F9FF',
    accent: '#3B82F6',
    pageBg: 'linear-gradient(145deg, #F0F5FF, #D8E8FF, #EBF3FF)',
    time: '17:30 ~ 19:30',
    placeholder: '如：清蒸鱼、豆腐、绿叶菜',
  },
  {
    type: 'snack',
    label: '加餐',
    en: 'SNACK',
    num: '04',
    icon: Cookie,
    gradientFrom: '#FFF0F6',
    gradientVia: '#FCE7F3',
    gradientTo: '#FFF5FA',
    accent: '#EC4899',
    pageBg: 'linear-gradient(145deg, #FFF2F8, #FBE2F1, #FFF0F8)',
    time: '随时',
    placeholder: '如：水果、坚果、酸奶',
  },
];

const EXERCISE_CONFIG_BASE: ExerciseSlotConfig & { pageBg: string } = {
  label: '运动',
  en: 'EXERCISE',
  num: '05',
  icon: Dumbbell,
  accent: '#60A5FA',
  pageBg: 'linear-gradient(145deg, #EDF6FF, #D8EEFF, #E8F4FF)',
  time: '',
};

const WATER_CONFIG_BASE: WaterSlotConfig & { pageBg: string } = {
  label: '喝水',
  en: 'HYDRATION',
  num: '06',
  icon: Droplets,
  accent: '#0EA5E9',
  pageBg: 'linear-gradient(145deg, #EFF9FF, #E0F4FD, #F0F9FF)',
  time: '全天',
};

const ALL_ACCENT = [...MEAL_CONFIGS_BASE.map(c => c.accent), EXERCISE_CONFIG_BASE.accent, WATER_CONFIG_BASE.accent];

interface MealCarouselProps {
  record: DailyRecord;
  apiKey: string;
  isViewingToday?: boolean;
  profile?: UserProfile | null;
  journalDate?: string;
  fullscreen?: boolean;
  onChange: (record: DailyRecord) => void;
  onWaterReplace?: (items: WaterItem[]) => void;
}

const MealCarousel = forwardRef<MealCarouselRef, MealCarouselProps>(
  ({ record, apiKey, isViewingToday = true, profile, journalDate, fullscreen = false, onChange, onWaterReplace }, ref) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [highlightedType, setHighlightedType] = useState<CarouselCardType | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

    const { proteinTarget, carbsTarget, fatTarget } = profile
      ? calcMacroTargets(profile)
      : getDefaultMacroTargets();

    const allItems = Object.values(record.meals).flat() as FoodItem[];
    const totalProtein = Math.round(allItems.reduce((s, f) => s + (f.protein ?? 0), 0));
    const totalCarbs = Math.round(allItems.reduce((s, f) => s + (f.carbs ?? 0), 0));
    const totalFat = Math.round(allItems.reduce((s, f) => s + (f.fat ?? 0), 0));

    const uneatenRatioSum = MEAL_CONFIGS_BASE
      .filter(m => record.meals[m.type].length === 0)
      .reduce((sum, m) => sum + MEAL_RATIOS[m.type], 0);

    const dateStr = journalDate ?? '';
    const mealConfigs = useMemo(() =>
      MEAL_CONFIGS_BASE.map(cfg => ({ ...cfg, imageUrl: getDailyImageUrl(cfg.type, dateStr) })),
      [dateStr]
    );
    const exerciseConfig = useMemo(() =>
      ({ ...EXERCISE_CONFIG_BASE, imageUrl: getDailyImageUrl('exercise', dateStr) }),
      [dateStr]
    );
    const waterConfig = useMemo(() =>
      ({ ...WATER_CONFIG_BASE, imageUrl: getDailyImageUrl('water', dateStr) }),
      [dateStr]
    );

    const allImages = useMemo(() => [
      ...mealConfigs.map(c => c.imageUrl),
      exerciseConfig.imageUrl,
      waterConfig.imageUrl,
    ], [mealConfigs, exerciseConfig, waterConfig]);

    const scrollCardIntoView = (index: number, behavior: ScrollBehavior = 'smooth') => {
      const container = containerRef.current;
      const card = cardRefs.current[index];
      if (!container || !card) return;
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const target = container.scrollLeft + cardRect.left - containerRect.left - (containerRect.width - cardRect.width) / 2;
      container.scrollTo({ left: target, behavior });
    };

    useImperativeHandle(ref, () => ({
      scrollToMeal: (type: CarouselCardType) => {
        const index = CARD_ORDER.indexOf(type);
        if (index < 0) return;
        scrollCardIntoView(index);
        setHighlightedType(type);
        setTimeout(() => setHighlightedType(null), 1800);
      },
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const updateActive = () => {
        const center = container.scrollLeft + container.clientWidth / 2;
        let closest = 0;
        let minDist = Infinity;
        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          const cardCenter = card.offsetLeft + card.offsetWidth / 2;
          const dist = Math.abs(center - cardCenter);
          if (dist < minDist) { minDist = dist; closest = i; }
        });
        setActiveIndex(closest);
      };

      container.addEventListener('scroll', updateActive, { passive: true });
      const raf = requestAnimationFrame(updateActive);
      return () => {
        container.removeEventListener('scroll', updateActive);
        cancelAnimationFrame(raf);
      };
    }, []);

    const handleFoodAdd = useCallback((mealType: MealType, item: FoodItem) => {
      onChange({ ...record, meals: { ...record.meals, [mealType]: [...record.meals[mealType], item] } });
    }, [record, onChange]);

    const handleFoodRemove = useCallback((mealType: MealType, id: string) => {
      onChange({ ...record, meals: { ...record.meals, [mealType]: record.meals[mealType].filter(f => f.id !== id) } });
    }, [record, onChange]);

    const handleFoodUpdate = useCallback((mealType: MealType, item: FoodItem) => {
      onChange({ ...record, meals: { ...record.meals, [mealType]: record.meals[mealType].map(f => f.id === item.id ? item : f) } });
    }, [record, onChange]);

    const mealHandlers = useMemo(() => {
      const map = {} as Record<MealType, { onAdd: (item: FoodItem) => void; onRemove: (id: string) => void; onUpdate: (item: FoodItem) => void }>;
      for (const cfg of MEAL_CONFIGS_BASE) {
        const type = cfg.type;
        map[type] = {
          onAdd: (item: FoodItem) => handleFoodAdd(type, item),
          onRemove: (id: string) => handleFoodRemove(type, id),
          onUpdate: (item: FoodItem) => handleFoodUpdate(type, item),
        };
      }
      return map;
    }, [handleFoodAdd, handleFoodRemove, handleFoodUpdate]);

    const handleExerciseAdd = useCallback((item: ExerciseItem) => {
      onChange({ ...record, exercises: [...record.exercises, item] });
    }, [record, onChange]);

    const handleExerciseRemove = useCallback((id: string) => {
      onChange({ ...record, exercises: record.exercises.filter(e => e.id !== id) });
    }, [record, onChange]);

    const handleExerciseUpdate = useCallback((item: ExerciseItem) => {
      onChange({ ...record, exercises: record.exercises.map(e => e.id === item.id ? item : e) });
    }, [record, onChange]);

    const handleWaterAdd = useCallback((item: WaterItem) => {
      onChange({ ...record, water: [...(record.water ?? []), item] });
    }, [record, onChange]);

    const handleWaterRemove = useCallback((id: string) => {
      onChange({ ...record, water: (record.water ?? []).filter(w => w.id !== id) });
    }, [record, onChange]);

    const handleWaterUpdate = useCallback((item: WaterItem) => {
      onChange({ ...record, water: (record.water ?? []).map(w => w.id === item.id ? item : w) });
    }, [record, onChange]);

    const handleWaterReplaceLocal = useCallback((items: WaterItem[]) => {
      if (onWaterReplace) {
        onWaterReplace(items);
      } else {
        onChange({ ...record, water: items });
      }
    }, [record, onChange, onWaterReplace]);

    const accent = ALL_ACCENT[activeIndex] ?? ALL_ACCENT[0];

    return (
      <div
        className={`relative overflow-hidden ${fullscreen ? 'h-full flex flex-col' : 'rounded-3xl'}`}
      >
        {allImages.map((src, i) => (
          <div
            key={src + i}
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${src})`,
              opacity: activeIndex === i ? 1 : 0,
              transition: 'opacity 0.7s ease',
              zIndex: 0,
            }}
          />
        ))}
        <div
          className="absolute inset-0"
          style={{
            background: fullscreen
              ? 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.45) 35%, rgba(255,255,255,0.68) 100%)'
              : 'linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.72) 100%)',
            backdropFilter: 'blur(2px)',
            zIndex: 1,
          }}
        />

        <div
          ref={containerRef}
          className={`meal-carousel-scroll relative flex overflow-x-auto snap-x snap-mandatory gap-4 ${fullscreen ? 'flex-1 py-4' : 'py-6'}`}
          style={{
            paddingLeft: 'calc(50% - min(41vw, 200px))',
            paddingRight: 'calc(50% - min(41vw, 200px))',
            scrollbarWidth: 'none',
            zIndex: 2,
          }}
        >
          {mealConfigs.map((cfg, i) => {
            const ratio = MEAL_RATIOS[cfg.type];
            const hasItems = record.meals[cfg.type].length > 0;
            const macroTarget: MacroTarget = hasItems
              ? {
                  protein: Math.max(1, Math.round(proteinTarget * ratio)),
                  carbs: Math.max(1, Math.round(carbsTarget * ratio)),
                  fat: Math.max(1, Math.round(fatTarget * ratio)),
                  isRedistributed: false,
                }
              : {
                  protein: Math.max(1, Math.round((proteinTarget - totalProtein) * (uneatenRatioSum > 0 ? ratio / uneatenRatioSum : ratio))),
                  carbs: Math.max(1, Math.round((carbsTarget - totalCarbs) * (uneatenRatioSum > 0 ? ratio / uneatenRatioSum : ratio))),
                  fat: Math.max(1, Math.round((fatTarget - totalFat) * (uneatenRatioSum > 0 ? ratio / uneatenRatioSum : ratio))),
                  isRedistributed: true,
                };
            return (
              <div
                key={cfg.type}
                ref={el => { cardRefs.current[i] = el; }}
                className={`snap-center flex-shrink-0 ${fullscreen ? 'h-full' : ''}`}
              >
                <MealCardSlot
                  config={cfg}
                  items={record.meals[cfg.type]}
                  isActive={activeIndex === i}
                  isHighlighted={highlightedType === cfg.type}
                  macroTarget={macroTarget}
                  fullscreen={fullscreen}
                  onAdd={mealHandlers[cfg.type].onAdd}
                  onRemove={mealHandlers[cfg.type].onRemove}
                  onUpdate={mealHandlers[cfg.type].onUpdate}
                />
              </div>
            );
          })}
          <div
            ref={el => { cardRefs.current[4] = el; }}
            className={`snap-center flex-shrink-0 ${fullscreen ? 'h-full' : ''}`}
          >
            <ExerciseCardSlot
              config={exerciseConfig}
              items={record.exercises}
              isActive={activeIndex === 4}
              isHighlighted={highlightedType === 'exercise'}
              fullscreen={fullscreen}
              journalDate={journalDate}
              onAdd={handleExerciseAdd}
              onRemove={handleExerciseRemove}
              onUpdate={handleExerciseUpdate}
            />
          </div>
          <div
            ref={el => { cardRefs.current[5] = el; }}
            className={`snap-center flex-shrink-0 ${fullscreen ? 'h-full' : ''}`}
          >
            <WaterCardSlot
              config={waterConfig}
              items={record.water ?? []}
              apiKey={apiKey}
              isActive={activeIndex === 5}
              isHighlighted={highlightedType === 'water'}
              fullscreen={fullscreen}
              isViewingToday={isViewingToday}
              profile={profile}
              onAdd={handleWaterAdd}
              onRemove={handleWaterRemove}
              onUpdate={handleWaterUpdate}
              onReplace={handleWaterReplaceLocal}
            />
          </div>
        </div>

        <div className={`relative flex items-center justify-center gap-1.5 flex-shrink-0 ${fullscreen ? 'pb-3 pt-1' : 'pb-5'}`} style={{ zIndex: 2 }}>
          {CARD_ORDER.map((type, i) => {
            const isActive = activeIndex === i;
            const dotAccent = ALL_ACCENT[i];
            return (
              <button
                key={type}
                onClick={() => scrollCardIntoView(i)}
                className="rounded-full cursor-pointer"
                style={{
                  width: isActive ? '22px' : '6px',
                  height: '6px',
                  backgroundColor: isActive ? dotAccent : `${accent}40`,
                  transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            );
          })}
          <span
            className="ml-2 text-[11px] font-semibold tracking-widest tabular-nums"
            style={{ color: accent, transition: 'color 0.5s ease' }}
          >
            {String(activeIndex + 1).padStart(2, '0')} · {String(CARD_ORDER.length).padStart(2, '0')}
          </span>
        </div>

        <style>{`
          .meal-carousel-scroll::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    );
  }
);

MealCarousel.displayName = 'MealCarousel';
export default MealCarousel;
