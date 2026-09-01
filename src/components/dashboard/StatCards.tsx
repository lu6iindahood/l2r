import React from 'react';
import { StatsData, BotStatusItem } from '../../types/index.js';

interface StatCardsProps {
  stats: StatsData | null;
  botStatuses: BotStatusItem[];
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, botStatuses }) => {
  const onlineBots = botStatuses.filter((b) => b.status === 'online' || b.status === 'simulated').length;
  const totalBots = botStatuses.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono select-none">
      {/* Card 1: Total Ingress */}
      <div className="bg-[#0A0A0A] border border-zinc-800 p-4 rounded shadow-inner">
        <div className="text-[10px] text-zinc-500 mb-1 flex justify-between uppercase">
          <span>TOTAL_INGRESS</span>
          <span className="text-[#00FF41] font-bold">+24.1%</span>
        </div>
        <div className="text-3xl font-bold text-zinc-100 tracking-tighter">
          {stats ? stats.totalEvents.toLocaleString() : '—'}
        </div>
        <div className="text-[9px] text-zinc-500 mt-1 truncate">
          {stats ? stats.uniqueUsers.toLocaleString() : 0} UNIQUE_USERS_INDEXED
        </div>
        <div className="mt-3 flex gap-1">
          <div className="h-1 flex-1 bg-zinc-800"></div>
          <div className="h-1 flex-1 bg-zinc-800"></div>
          <div className="h-1 flex-1 bg-[#00FF41]"></div>
          <div className="h-1 flex-1 bg-[#00FF41]"></div>
          <div className="h-1 flex-1 bg-[#00FF41]"></div>
        </div>
      </div>

      {/* Card 2: Active Bots */}
      <div className="bg-[#0A0A0A] border border-zinc-800 p-4 rounded shadow-inner">
        <div className="text-[10px] text-zinc-500 mb-1 flex justify-between uppercase">
          <span>ACTIVE_BOTS</span>
          <span className="text-cyan-400 font-bold">ONLINE</span>
        </div>
        <div className="text-3xl font-bold text-cyan-400 tracking-tighter">
          {String(onlineBots).padStart(2, '0')} / {String(totalBots).padStart(2, '0')}
        </div>
        <div className="text-[9px] text-zinc-500 mt-1 italic truncate">
          SYNCING WITH DISCORD GATEWAY...
        </div>
        <div className="mt-3 flex gap-1">
          <div className="h-1 flex-1 bg-zinc-800"></div>
          <div className="h-1 flex-1 bg-cyan-500"></div>
          <div className="h-1 flex-1 bg-cyan-500"></div>
          <div className="h-1 flex-1 bg-cyan-500"></div>
          <div className="h-1 flex-1 bg-cyan-500"></div>
        </div>
      </div>

      {/* Card 3: Monitored Guilds */}
      <div className="bg-[#0A0A0A] border border-zinc-800 p-4 rounded shadow-inner">
        <div className="text-[10px] text-zinc-500 mb-1 flex justify-between uppercase">
          <span>GUILDS_MAPPED</span>
          <span className="text-zinc-400 font-bold">LIVE</span>
        </div>
        <div className="text-3xl font-bold text-zinc-100 tracking-tighter">
          {stats ? stats.activeGuilds.toLocaleString() : '—'}
        </div>
        <div className="text-[9px] text-zinc-500 mt-1 truncate">
          UNIQUE_ENTRY_NODES
        </div>
        <div className="mt-3 flex gap-1">
          <div className="h-1 flex-1 bg-[#00FF41]"></div>
          <div className="h-1 flex-1 bg-[#00FF41]"></div>
          <div className="h-1 flex-1 bg-[#00FF41]"></div>
          <div className="h-1 flex-1 bg-[#00FF41]"></div>
          <div className="h-1 flex-1 bg-[#00FF41]"></div>
        </div>
      </div>

      {/* Card 4: Bot Detection Rate */}
      <div className="bg-[#0A0A0A] border border-zinc-800 p-4 rounded shadow-inner">
        <div className="text-[10px] text-zinc-500 mb-1 flex justify-between uppercase">
          <span>BOT_DETECTION</span>
          <span className="text-amber-400 font-bold">HEURISTIC</span>
        </div>
        <div className="text-3xl font-bold text-amber-400 tracking-tighter">
          {stats ? `${stats.botPercentage}%` : '0%'}
        </div>
        <div className="text-[9px] text-zinc-500 mt-1 truncate">
          {stats ? stats.botCount : 0} AUTOMATED_CAPTURES
        </div>
        <div className="mt-3 flex gap-1">
          <div className="h-1 flex-1 bg-zinc-800"></div>
          <div className="h-1 flex-1 bg-zinc-800"></div>
          <div className="h-1 flex-1 bg-zinc-800"></div>
          <div className="h-1 flex-1 bg-amber-400"></div>
          <div className="h-1 flex-1 bg-amber-400"></div>
        </div>
      </div>
    </div>
  );
};

