import React, { useState } from 'react';
import { MemberEvent, BotStatusItem } from '../../types/index.js';
import { Play, Copy, Check, Trash2, AlertTriangle } from 'lucide-react';
import { formatDate } from '../../lib/utils.js';

interface TelemetryTerminalProps {
  events: MemberEvent[];
  botStatuses: BotStatusItem[];
  onTriggerTestEvent: () => Promise<void>;
  onDeleteAllLogs?: () => Promise<void>;
}

export const TelemetryTerminal: React.FC<TelemetryTerminalProps> = ({
  events,
  botStatuses,
  onTriggerTestEvent,
  onDeleteAllLogs,
}) => {
  const [isInjecting, setIsInjecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleInject = async () => {
    try {
      setIsInjecting(true);
      await onTriggerTestEvent();
    } finally {
      setIsInjecting(false);
    }
  };

  const handleClear = async () => {
    if (!onDeleteAllLogs) return;
    try {
      setIsClearing(true);
      await onDeleteAllLogs();
      setIsConfirmingClear(false);
    } catch (err) {
      console.error('Failed to clear logs from terminal:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const copyLogs = () => {
    const raw = events.map((e) => `[${formatDate(e.joinedAt || e.createdAt)}] [GUILD: ${e.guildName}] USER_ADD: ${e.username} (${e.userId}) BADGES: [${e.badges.join(', ')}]`).join('\n');
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 font-mono select-none">
      {/* Control Bar */}
      <div className="p-4 rounded bg-[#0A0A0A] border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse"></div>
          <div>
            <h3 className="font-mono font-bold text-xs text-[#00FF41] uppercase tracking-wider">
              [RAW_GATEWAY_TELEMETRY_CONSOLE]
            </h3>
            <p className="text-[10px] text-zinc-500 uppercase">
              REAL-TIME DISCORD INGRESS INFLOW VIA WEBSOCKET STREAM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDeleteAllLogs && (
            !isConfirmingClear ? (
              <button
                onClick={() => setIsConfirmingClear(true)}
                disabled={events.length === 0}
                className="px-3 py-1.5 rounded bg-[#080808] hover:bg-rose-950/70 text-rose-400 border border-zinc-800 hover:border-rose-500/40 text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-30 cursor-pointer"
                title="Clear all log events"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>PURGE_LOGS</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  disabled={isClearing}
                  className="px-2.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>{isClearing ? 'PURGING...' : 'CONFIRM'}</span>
                </button>
                <button
                  onClick={() => setIsConfirmingClear(false)}
                  disabled={isClearing}
                  className="px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            )
          )}

          <button
            onClick={copyLogs}
            className="px-3 py-1.5 rounded bg-[#080808] hover:bg-zinc-900 text-zinc-300 border border-zinc-800 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-[#00FF41]" /> : <Copy className="w-3 h-3 text-cyan-400" />}
            <span>{copied ? 'COPIED' : 'COPY_BUFFER'}</span>
          </button>

          <button
            onClick={handleInject}
            disabled={isInjecting}
            className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-[#00FF41] border border-[#00FF41]/50 font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Play className="w-3 h-3" />
            <span>{isInjecting ? 'EMITTING...' : 'EMIT_STREAM_EVENT'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Screen */}
      <div className="rounded bg-[#080808] border border-zinc-800 font-mono text-xs overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="p-3 bg-[#050505] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
              <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
              <span className="w-2 h-2 rounded-full bg-[#00FF41]"></span>
            </div>
            <span className="text-zinc-500 text-[10px] ml-2">daemon@selfbot-monitor:~# tail -f /var/log/discord_events.log</span>
          </div>

          <span className="text-[9px] text-[#00FF41] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            BUFFER: {events.length} EVENTS
          </span>
        </div>

        {/* Terminal Output Body */}
        <div className="p-4 h-[520px] overflow-y-auto space-y-2 select-text font-mono">
          <div className="text-zinc-600 border-b border-zinc-900 pb-2 text-[11px]">
            [SYSTEM_BOOT] Initialized Discord Gateway Subsystem. Connected Bots: {botStatuses.length}. Listening for event <span className="text-cyan-400">guildMemberAdd</span>...
          </div>

          {events.map((ev) => (
            <div
              key={ev.id}
              className="p-2.5 rounded bg-[#050505] hover:bg-zinc-900/50 border border-zinc-900 hover:border-zinc-800 transition-colors group text-[11px]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-zinc-600">[{formatDate(ev.joinedAt || ev.createdAt)}]</span>
                <span className="text-[#00FF41] font-bold">INFO</span>
                <span className="text-cyan-400">GUILD({ev.guildId})</span>
                <span className="text-zinc-200">
                  Member Joined: <strong className="text-[#00FF41]">{ev.username}#{ev.discriminator}</strong>
                </span>
                <span className="text-zinc-500">(Snowflake: {ev.userId})</span>
                {ev.isBot && (
                  <span className="px-1 py-0.2 bg-cyan-950 text-cyan-400 border border-cyan-500/40 rounded text-[9px] font-bold">
                    [BOT]
                  </span>
                )}
              </div>

              <div className="mt-1 pl-4 text-zinc-500 flex flex-wrap items-center gap-2 text-[10px]">
                <span>↳ Guild: <strong className="text-zinc-300">{ev.guildName}</strong></span>
                <span>• Badges: {ev.badges.length > 0 ? <strong className="text-amber-400">{ev.badges.join(', ')}</strong> : '<NONE>'}</span>
                <span>• Roles Assigned: {ev.rolesCount}</span>
                <span>• Created: {ev.accountCreatedAt.split('T')[0]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

