import React, { useState } from 'react';
import { RefreshCw, Play, Menu } from 'lucide-react';
import { cn } from '../../lib/utils.js';
import { BotStatusItem, BotConfigItem } from '../../types/index.js';

interface HeaderProps {
  title: string;
  subtitle: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  onTriggerTestEvent: () => Promise<void>;
  botStatuses?: BotStatusItem[];
  botConfigs?: BotConfigItem[];
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing,
  onTriggerTestEvent,
  botStatuses = [],
  botConfigs = [],
  onToggleMobileSidebar,
}) => {
  const [triggering, setTriggering] = useState(false);
  const [lastEmittedMsg, setLastEmittedMsg] = useState<string | null>(null);

  const onlineBots = botStatuses.filter((b) => b.status === 'online');
  const isAnyOnline = onlineBots.length > 0;

  const handleTestEvent = async () => {
    try {
      setTriggering(true);
      await onTriggerTestEvent();
      setLastEmittedMsg('TELEMETRY_INJECTED');
      setTimeout(() => setLastEmittedMsg(null), 3000);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-3 sm:px-6 bg-[#080808]/90 backdrop-blur-md font-mono sticky top-0 z-20 select-none">
      {/* Left side: Hamburger button + Title */}
      <div className="flex items-center gap-2 sm:gap-6 min-w-0">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 -ml-1 rounded-lg text-zinc-400 hover:text-[#00FF41] hover:bg-zinc-900 border border-zinc-800 lg:hidden cursor-pointer shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex flex-col min-w-0">
          <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-tighter truncate">
            {subtitle || 'GATEWAY TELEMETRY'}
          </span>
          <span className="text-xs sm:text-sm text-[#00FF41] font-bold tracking-tight truncate">
            [{title}]
          </span>
        </div>
      </div>

      {/* Right side: Status Indicator + Buttons */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live Bot On/Off Indicator Badge */}
        {isAnyOnline ? (
          <div 
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-emerald-950/60 border border-[#00FF41]/40 text-[#00FF41] text-[10px] sm:text-xs font-mono shadow-[0_0_12px_rgba(0,255,65,0.2)] select-none"
            title={`${onlineBots.length} bot token(s) active`}
          >
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF41] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-[#00FF41]"></span>
            </span>
            <span className="font-bold tracking-wider hidden sm:inline">BOT: ONLINE</span>
            <span className="font-bold tracking-wider sm:hidden">ON</span>
            <span className="text-[9px] sm:text-[10px] text-emerald-400/90 font-normal">({onlineBots.length})</span>
          </div>
        ) : (
          <div 
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-400 text-[10px] sm:text-xs font-mono shadow-[0_0_12px_rgba(244,63,94,0.2)] select-none"
            title="No bots connected"
          >
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-rose-500"></span>
            </span>
            <span className="font-bold tracking-wider hidden sm:inline">BOT: OFFLINE</span>
            <span className="font-bold tracking-wider sm:hidden">OFF</span>
          </div>
        )}

        {lastEmittedMsg && (
          <div className="hidden md:flex text-[10px] font-mono text-[#00FF41] bg-zinc-900 border border-[#00FF41]/40 px-2 py-1 rounded items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41]"></span>
            {lastEmittedMsg}
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded transition-all cursor-pointer"
          title="Refresh telemetry stream"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin text-cyan-400')} />
        </button>

        {/* User / Access Level */}
        <div className="hidden sm:flex items-center gap-2.5 border-l border-zinc-800 pl-3">
          <div className="text-right hidden md:block">
            <div className="text-xs text-zinc-300 font-bold">ROOT_ADMIN</div>
            <div className="text-[9px] text-[#00FF41]">LVL: 5</div>
          </div>
          <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#00FF41] font-bold text-xs shadow-inner">
            R
          </div>
        </div>
      </div>
    </header>
  );
};
