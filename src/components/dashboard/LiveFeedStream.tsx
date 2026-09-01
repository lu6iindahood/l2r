import React from 'react';
import { MemberEvent } from '../../types/index.js';
import { formatRelativeTime } from '../../lib/utils.js';

interface LiveFeedStreamProps {
  events: MemberEvent[];
  onSelectEvent: (event: MemberEvent) => void;
  onViewAll: () => void;
}

export const LiveFeedStream: React.FC<LiveFeedStreamProps> = ({
  events,
  onSelectEvent,
  onViewAll,
}) => {
  return (
    <div className="bg-[#0A0A0A] border border-zinc-800 rounded flex flex-col font-mono select-none">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse"></div>
          <span className="text-xs font-bold text-zinc-400">LIVE_INGRESS_STREAM</span>
        </div>

        <button
          onClick={onViewAll}
          className="text-[10px] text-zinc-500 hover:text-[#00FF41] transition-colors cursor-pointer"
        >
          [EXPAND_ALL]
        </button>
      </div>

      <div className="divide-y divide-zinc-900 overflow-hidden">
        {events.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-600">
            AWAITING_INGRESS_EVENTS...
          </div>
        ) : (
          events.slice(0, 6).map((ev, idx) => (
            <div
              key={ev.id}
              onClick={() => onSelectEvent(ev)}
              className={`p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-900/40 cursor-pointer transition-colors ${
                idx > 3 ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {ev.avatarUrl ? (
                    <img
                      src={ev.avatarUrl}
                      alt={ev.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-bold">
                      {ev.username.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-[11px] text-zinc-200 font-bold truncate flex items-center gap-1.5">
                    <span>{ev.username}</span>
                    {ev.isBot && (
                      <span className="text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-500/40 px-1 rounded">
                        BOT
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#00FF41] truncate mt-0.5">
                    Joined: <span className="text-zinc-300 font-medium">{ev.guildName}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] text-zinc-500">
                  {formatRelativeTime(ev.joinedAt || ev.createdAt)}
                </div>
                <div className="text-[9px] text-zinc-700">
                  #{ev.id}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

