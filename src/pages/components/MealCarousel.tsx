import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Sunrise, Sun, Moon, Cookie, Dumbbell, Droplets } from 'lucide-react';
import MealCardSlot from './MealCardSlot';
import ExerciseCardSlot from './ExerciseCardSlot';
import WaterCardSlot from './WaterCardSlot';
import type { MealSlotConfig } from './MealCardSlot';
import type { ExerciseSlotConfig } from './ExerciseCardSlot';
import type { WaterSlotConfig } from './WaterCardSlot';
import type { DailyRecord, MealType, FoodItem, ExerciseItem, WaterItem } from '../../types';

export type CarouselCardType = MealType | 'exercise' | 'water';

export interface MealCarouselRef {
  scrollToMeal: (type: CarouselCardType) => void;
}

const CARD_ORDER: CarouselCardType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'exercise', 'water'];

const MEAL_CONFIGS: (MealSlotConfig & { type: MealType; pageBg: string })[] = [
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
    imageUrl: 'https://s41.ax1x.com/2026/05/21/pmSDYqS.jpg',
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
    imageUrl: 'https://s41.ax1x.com/2026/05/21/pmSD12t.jpg',
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
    imageUrl: 'https://s41.ax1x.com/2026/05/21/pmSDJr8.jpg',
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
    imageUrl: 'https://s41.ax1x.com/2026/05/21/pmSD3xP.jpg',
  },
];

const EXERCISE_CONFIG: ExerciseSlotConfig & { pageBg: string } = {
  label: '运动',
  en: 'EXERCISE',
  num: '05',
  icon: Dumbbell,
  accent: '#60A5FA',
  pageBg: 'linear-gradient(145deg, #EDF6FF, #D8EEFF, #E8F4FF)',
  time: '',
  imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
};

const WATER_CONFIG: WaterSlotConfig & { pageBg: string } = {
  label: '喝水',
  en: 'HYDRATION',
  num: '06',
  icon: Droplets,
  accent: '#0EA5E9',
  pageBg: 'linear-gradient(145deg, #EFF9FF, #E0F4FD, #F0F9FF)',
  time: '全天',
  imageUrl: 'https://s41.ax1x.com/2026/05/21/pmSDGKf.jpg',
};

const ALL_PAGE_BG = [...MEAL_CONFIGS.map(c => c.pageBg), EXERCISE_CONFIG.pageBg, WATER_CONFIG.pageBg];
const ALL_ACCENT = [...MEAL_CONFIGS.map(c => c.accent), EXERCISE_CONFIG.accent, WATER_CONFIG.accent];

interface MealCarouselProps {
  record: DailyRecord;
  apiKey: string;
  onChange: (record: DailyRecord) => void;
}

const MealCarousel = forwardRef<MealCarouselRef, MealCarouselProps>(
  ({ record, apiKey, onChange }, ref) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [highlightedType, setHighlightedType] = useState<CarouselCardType | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

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
      const observers: IntersectionObserver[] = [];
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const obs = new IntersectionObserver(
          ([entry]) => { if (entry.isIntersecting) setActiveIndex(i); },
          { root: container, threshold: 0.5 }
        );
        obs.observe(card);
        observers.push(obs);
      });
      return () => observers.forEach(obs => obs.disconnect());
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
      onChange({ ...record, water: [...(record.water || []), item] });
    }, [record, onChange]);

    const handleWaterRemove = useCallback((id: string) => {
      onChange({ ...record, water: (record.water || []).filter(w => w.id !== id) });
    }, [record, onChange]);

    const handleWaterUpdate = useCallback((item: WaterItem) => {
      onChange({ ...record, water: (record.water || []).map(w => w.id === item.id ? item : w) });
    }, [record, onChange]);

    const bg = ALL_PAGE_BG[activeIndex] ?? ALL_PAGE_BG[0];
    const accent = ALL_ACCENT[activeIndex] ?? ALL_ACCENT[0];

    return (
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{ background: bg, transition: 'background 0.7s ease' }}
      >
        <div
          ref={containerRef}
          className="meal-carousel-scroll flex overflow-x-auto snap-x snap-mandatory gap-4 py-6"
          style={{
            paddingLeft: 'calc(50vw - min(41vw, 200px))',
            paddingRight: 'calc(50vw - min(41vw, 200px))',
            scrollbarWidth: 'none',
          }}
        >
          {MEAL_CONFIGS.map((cfg, i) => (
            <div
              key={cfg.type}
              ref={el => { cardRefs.current[i] = el; }}
              className="snap-center flex-shrink-0"
            >
              <MealCardSlot
                config={cfg}
                items={record.meals[cfg.type]}
                apiKey={apiKey}
                isActive={activeIndex === i}
                isHighlighted={highlightedType === cfg.type}
                onAdd={item => handleFoodAdd(cfg.type, item)}
                onRemove={id => handleFoodRemove(cfg.type, id)}
                onUpdate={item => handleFoodUpdate(cfg.type, item)}
              />
            </div>
          ))}
          <div
            ref={el => { cardRefs.current[4] = el; }}
            className="snap-center flex-shrink-0"
          >
            <ExerciseCardSlot
              config={EXERCISE_CONFIG}
              items={record.exercises}
              isActive={activeIndex === 4}
              isHighlighted={highlightedType === 'exercise'}
              onAdd={handleExerciseAdd}
              onRemove={handleExerciseRemove}
              onUpdate={handleExerciseUpdate}
            />
          </div>
          <div
            ref={el => { cardRefs.current[5] = el; }}
            className="snap-center flex-shrink-0"
          >
            <WaterCardSlot
              config={WATER_CONFIG}
              items={record.water || []}
              apiKey={apiKey}
              isActive={activeIndex === 5}
              isHighlighted={highlightedType === 'water'}
              onAdd={handleWaterAdd}
              onRemove={handleWaterRemove}
              onUpdate={handleWaterUpdate}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 pb-5">
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
                  backgroundColor: isActive ? dotAccent : `${accent}30`,
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
