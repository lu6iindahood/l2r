import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Bot, 
  Terminal, 
  Database, 
  Cpu,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { BotConfigItem, BotStatusItem } from '../../types/index.js';

interface SidebarProps {
  currentTab: 'dashboard' | 'members' | 'bots' | 'terminal';
  onTabChange: (tab: 'dashboard' | 'members' | 'bots' | 'terminal') => void;
  activeBotCount: number;
  totalEvents: number;
  botConfigs?: BotConfigItem[];
  botStatuses?: BotStatusItem[];
  selectedBotId?: number | null;
  onSelectBotId?: (botId: number | null) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  activeBotCount,
  totalEvents,
  botConfigs = [],
  botStatuses = [],
  selectedBotId = null,
  onSelectBotId,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  interface NavItem {
    id: 'dashboard' | 'members' | 'bots' | 'terminal';
    index: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string | null;
    badgeColor?: string;
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      index: '[01]',
      label: 'DASHBOARD',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'members',
      index: '[02]',
      label: 'MEMBER_LOGS',
      icon: Users,
      badge: totalEvents > 0 ? String(totalEvents) : null,
      badgeColor: 'bg-zinc-900 text-zinc-400 border-zinc-800',
    },
    {
      id: 'bots',
      index: '[03]',
      label: 'BOT_CONFIG',
      icon: Bot,
      badge: `${activeBotCount} ACTIVE`,
      badgeColor: activeBotCount > 0 ? 'bg-emerald-950/80 text-[#00FF41] border-[#00FF41]/30' : 'bg-zinc-900 text-zinc-500 border-zinc-800',
    },
    {
      id: 'terminal',
      index: '[04]',
      label: 'STREAM_CONSOLE',
      icon: Terminal,
      badge: 'LIVE',
      badgeColor: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/40 animate-pulse',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
        />
      )}

      <aside
        className={cn(
          'w-64 border-r border-zinc-800 bg-[#080808] flex flex-col justify-between h-screen fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out select-none font-mono lg:static lg:translate-x-0 shrink-0',
          isOpenMobile ? 'translate-x-0 shadow-[0_0_30px_rgba(0,0,0,0.9)]' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="overflow-y-auto">
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-[#00FF41] rounded-full shadow-[0_0_8px_#00FF41] animate-pulse"></div>
                <h1 className="text-[#00FF41] font-bold tracking-tighter text-base">SELFBOT_OS v2.4</h1>
              </div>
              <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-widest">
                AES-256-GCM
              </p>
            </div>

            {/* Mobile Close X Button */}
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 lg:hidden cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 flex flex-col gap-1 mt-1">
            <div className="px-2 py-1 text-[10px] text-zinc-600 uppercase tracking-widest">
              SYSTEM_MODULES
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id && (item.id !== 'members' || selectedBotId === null);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'members' && onSelectBotId) {
                      onSelectBotId(null);
                    }
                    onTabChange(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={cn(
                    'w-full px-3.5 py-2.5 text-xs flex items-center justify-between transition-all group text-left cursor-pointer rounded',
                    isActive
                      ? 'bg-zinc-900/80 text-[#00FF41] border-l-2 border-[#00FF41] font-bold'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40 border-l-2 border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn('text-[11px]', isActive ? 'text-[#00FF41]/70' : 'text-zinc-600 group-hover:text-zinc-400')}>
                      {item.index}
                    </span>
                    <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-[#00FF41]' : 'text-zinc-600 group-hover:text-zinc-400')} />
                    <span className="tracking-wider">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded border tracking-tighter',
                        item.badgeColor || 'bg-zinc-900 text-zinc-500 border-zinc-800'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Dedicated Token Pages / Instances List */}
            {botConfigs.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-900/80">
                <div className="px-2 py-1 text-[10px] text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                  <span>TOKEN_CHANNELS</span>
                  <span className="text-[9px] text-[#00FF41]">{botConfigs.length} BOTS</span>
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  {botConfigs.map((cfg) => {
                    const status = botStatuses.find((s) => s.id === cfg.id);
                    const isOnline = status?.status === 'online';
                    const isSelected = currentTab === 'members' && selectedBotId === cfg.id;

                    return (
                      <button
                        key={cfg.id}
                        onClick={() => {
                          if (onSelectBotId) onSelectBotId(cfg.id);
                          onTabChange('members');
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className={cn(
                          'w-full px-3 py-2 text-xs flex items-center justify-between transition-all group text-left cursor-pointer rounded',
                          isSelected
                            ? 'bg-zinc-900 text-[#00FF41] border border-[#00FF41]/50 font-bold shadow-[0_0_10px_rgba(0,255,65,0.1)]'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30 border border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn(
                            'w-2 h-2 rounded-full shrink-0',
                            isOnline ? 'bg-[#00FF41] shadow-[0_0_6px_#00FF41]' : 'bg-zinc-700'
                          )} />
                          <span className="truncate text-[11px] font-mono">
                            {cfg.name}
                          </span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800">
                          #{cfg.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* System Status Footer */}
        <div className="p-4 border-t border-zinc-800 bg-[#080808]">
          <div className="text-[10px] text-zinc-600 mb-2 font-bold tracking-wider">SYSTEM_STATUS</div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-500 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400" /> CPU_LOAD
                </span>
                <span className="text-cyan-400 font-bold">14.2%</span>
              </div>
              <div className="w-full bg-zinc-900 h-1 mt-1 rounded-full overflow-hidden">
                <div className="bg-cyan-500 h-full w-[14%] rounded-full"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-zinc-500 flex items-center gap-1">
                  <Database className="w-3 h-3 text-[#00FF41]" /> SQLITE_SYNC
                </span>
                <span className="text-[#00FF41] font-bold">ONLINE</span>
              </div>
              <div className="w-full bg-zinc-900 h-1 mt-1 rounded-full overflow-hidden">
                <div className="bg-[#00FF41] h-full w-full rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
