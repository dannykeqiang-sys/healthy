import { Flame, User, Settings, BookOpen, TrendingUp, ActivitySquare, Upload } from 'lucide-react';
import type { UserProfile } from '../../types';

const TABS = [
  { value: 'today', label: '今日手帐', icon: BookOpen },
  { value: 'analytics', label: '时光机', icon: TrendingUp },
  { value: 'ai', label: 'AI 分析', icon: ActivitySquare },
];

interface DesktopHeaderProps {
  profile: UserProfile | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onEditProfile: () => void;
  onOpenSettings: () => void;
  onBatchImport: () => void;
}

export default function DesktopHeader({
  profile,
  activeTab,
  onTabChange,
  onEditProfile,
  onOpenSettings,
  onBatchImport,
}: DesktopHeaderProps) {
  return (
    <header
      className="h-14 px-6 flex items-center gap-4 flex-shrink-0"
      style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center gap-2.5 select-none flex-shrink-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: 'linear-gradient(135deg, #A3B899 0%, #7CB9A8 100%)' }}
        >
          <Flame className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight text-foreground whitespace-nowrap">
          燃烧我的卡路里
        </span>
      </div>

      <div
        className="flex items-center p-1 rounded-xl gap-0.5 flex-shrink-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
      >
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer select-none"
              style={{
                backgroundColor: isActive ? '#fff' : 'transparent',
                color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                boxShadow: isActive ? '0 1px 5px rgba(0,0,0,0.09)' : 'none',
              }}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      <button
        onClick={onBatchImport}
        className="flex items-center gap-2 h-8 px-4 rounded-xl text-sm font-semibold cursor-pointer transition-all active:scale-95 select-none flex-shrink-0 border"
        style={{
          color: 'var(--muted-foreground)',
          borderColor: 'rgba(0,0,0,0.09)',
          backgroundColor: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.color = 'var(--foreground)';
          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.025)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.color = 'var(--muted-foreground)';
          (e.currentTarget as HTMLElement).style.backgroundColor = '#fff';
        }}
      >
        <Upload className="w-3.5 h-3.5" />
        批量导入
      </button>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenSettings}
          title="设置"
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer"
          style={{ color: 'var(--muted-foreground)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.06)';
            (e.currentTarget as HTMLElement).style.color = 'var(--foreground)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--muted-foreground)';
          }}
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={onEditProfile}
          className="flex items-center gap-2 h-8 px-3 rounded-lg border cursor-pointer transition-all text-sm font-medium text-foreground"
          style={{
            backgroundColor: '#fff',
            borderColor: 'rgba(0,0,0,0.09)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.025)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.backgroundColor = '#fff';
          }}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #A3B899, #7CB9A8)' }}
          >
            <User className="w-3 h-3 text-white" />
          </div>
          <span className="max-w-[96px] truncate">
            {profile?.name || '设置信息'}
          </span>
        </button>
      </div>
    </header>
  );
}
