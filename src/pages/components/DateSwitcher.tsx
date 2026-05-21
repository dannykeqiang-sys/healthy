import { useRef, useEffect } from 'react';

interface DateSwitcherProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

function getRecentDates(count: number): string[] {
  const dates: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function formatDateChip(dateStr: string): { day: string; sub: string; isToday: boolean } {
  const today = new Date().toISOString().split('T')[0];
  const d = new Date(dateStr + 'T00:00:00');
  const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
  return {
    day: String(d.getDate()),
    sub: isToday(dateStr, today) ? '今天' : `周${WEEKDAYS[d.getDay()]}`,
    isToday: isToday(dateStr, today),
  };
}

function isToday(date: string, today: string) {
  return date === today;
}

export default function DateSwitcher({ selectedDate, onDateChange }: DateSwitcherProps) {
  const dates = getRecentDates(14);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const idx = dates.indexOf(selectedDate);
    if (idx < 0 || !scrollRef.current) return;
    const children = scrollRef.current.children;
    if (children[idx]) {
      (children[idx] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedDate, dates]);

  return (
    <div>
      <div
        ref={scrollRef}
        className="date-switcher-scroll flex gap-2 overflow-x-auto py-1 px-0.5"
      >
        {dates.map(date => {
          const { day, sub, isToday } = formatDateChip(date);
          const isSelected = date === selectedDate;
          return (
            <button
              key={date}
              onClick={() => onDateChange(date)}
              className="flex flex-col items-center flex-shrink-0 w-12 py-2 rounded-2xl transition-all cursor-pointer active:scale-90"
              style={{
                backgroundColor: isSelected
                  ? 'var(--primary)'
                  : isToday
                  ? 'rgba(163,184,153,0.15)'
                  : 'white',
                color: isSelected
                  ? 'white'
                  : isToday
                  ? 'var(--primary)'
                  : 'var(--muted-foreground)',
                border: isSelected
                  ? 'none'
                  : isToday
                  ? '1px solid rgba(163,184,153,0.5)'
                  : '1px solid var(--border)',
                boxShadow: isSelected ? '0 2px 8px rgba(163,184,153,0.35)' : 'none',
              }}
            >
              <span className="text-[10px] font-medium leading-none mb-1.5">{sub}</span>
              <span className="text-[15px] font-bold leading-none">{day}</span>
            </button>
          );
        })}
      </div>
      <style>{`.date-switcher-scroll::-webkit-scrollbar { display: none; }
        .date-switcher-scroll { scrollbar-width: none; }`}</style>
    </div>
  );
}
