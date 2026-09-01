import React from 'react';
import { TopGuild } from '../../types/index.js';
import { Server } from 'lucide-react';

interface TopGuildsListProps {
  guilds: TopGuild[];
  totalEvents: number;
}

export const TopGuildsList: React.FC<TopGuildsListProps> = ({ guilds, totalEvents }) => {
  return (
    <div className="bg-[#0A0A0A] border border-zinc-800 rounded p-6 font-mono select-none">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-mono font-bold text-xs text-[#00FF41] uppercase tracking-wider">
            [ACTIVE_SERVER_NODES]
          </h3>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-[#00FF41] border border-zinc-800">
          GUILD_INFLOW
        </span>
      </div>

      {guilds.length === 0 ? (
        <div className="h-44 flex items-center justify-center text-xs font-mono text-zinc-600">
          NO_SERVERS_MONITORED_YET
        </div>
      ) : (
        <div className="space-y-2.5">
          {guilds.map((guild, idx) => {
            const percentage = totalEvents > 0 ? Math.round((guild.count / totalEvents) * 100) : 0;
            return (
              <div
                key={guild.guildId}
                className="p-3 rounded bg-[#080808] border border-zinc-800 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono font-bold text-[#00FF41]">#{idx + 1}</span>
                    <span className="text-xs font-mono text-zinc-200 font-semibold truncate">
                      {guild.guildName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-zinc-200">{guild.count}</span>
                    <span className="text-[10px] font-mono text-zinc-500">({percentage}%)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00FF41] to-cyan-400 rounded-full"
                      style={{ width: `${Math.min(100, percentage * 2)}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600">ID: {guild.guildId.slice(0, 8)}...</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

