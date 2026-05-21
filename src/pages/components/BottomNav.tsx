import { LayoutDashboard, UtensilsCrossed, Dumbbell, Sparkles, BookOpen } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasNewReview: boolean;
}

const NAV_ITEMS = [
  { value: 'dashboard', label: '总览', icon: LayoutDashboard },
  { value: 'meals', label: '饮食', icon: UtensilsCrossed },
  { value: 'exercise', label: '运动', icon: Dumbbell },
  { value: 'review', label: 'AI复盘', icon: Sparkles },
  { value: 'history', label: '手帐', icon: BookOpen },
];

export default function BottomNav({ activeTab, onTabChange, hasNewReview }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border sm:hidden">
      <div className="flex items-center justify-around h-16 px-1 safe-area-inset-bottom">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.value;
          return (
            <button
              key={item.value}
              onClick={() => onTabChange(item.value)}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full cursor-pointer transition-colors"
              style={{ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' }}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.value === 'review' && hasNewReview && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-secondary border border-white" />
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--primary)' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
