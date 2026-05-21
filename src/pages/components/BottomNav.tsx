import { BookOpen, Sparkles, TrendingUp } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
  { value: 'today', label: '今日手帐', icon: BookOpen },
  { value: 'advice', label: 'AI建议', icon: Sparkles },
  { value: 'analytics', label: '时光机', icon: TrendingUp },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-border sm:hidden">
      <div className="flex items-center justify-around h-16 px-2 safe-area-inset-bottom">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.value;
          return (
            <button
              key={item.value}
              onClick={() => onTabChange(item.value)}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full cursor-pointer transition-all"
              style={{ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' }}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--primary)' }}
                />
              )}
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
