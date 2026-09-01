import React, { useState } from 'react';
import { MemberEvent } from '../../types/index.js';
import { X, Shield, Calendar, Server, Tag, Copy, Check, Terminal } from 'lucide-react';
import { formatDate, getBadgeColor } from '../../lib/utils.js';

interface MemberDetailModalProps {
  event: MemberEvent | null;
  onClose: () => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ event, onClose }) => {
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);

  if (!event) return null;

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const copyUsername = () => {
    navigator.clipboard.writeText(event.username);
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 2000);
  };

  const accountAgeDays = Math.floor(
    (new Date(event.joinedAt || event.createdAt).getTime() - new Date(event.accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 font-mono select-none">
      <div className="w-full max-w-2xl bg-[#0A0A0A] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-[#080808] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00FF41]"></div>
            <span className="font-mono font-bold text-xs text-[#00FF41] uppercase tracking-wider">
              [FORENSICS_NODE]
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              #{event.id}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* User Hero Banner / Card */}
          <div className="p-3.5 sm:p-4 rounded bg-[#080808] border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="relative shrink-0">
                {event.avatarUrl ? (
                  <img
                    src={event.avatarUrl}
                    alt={event.username}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-zinc-900 border border-zinc-800 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-mono text-lg font-bold">
                    {event.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                {event.isBot && (
                  <span className="absolute -bottom-1 -right-1 text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-500/40 font-bold px-1.5 py-0.5 rounded">
                    BOT
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm sm:text-base font-bold font-mono text-zinc-100 truncate">
                    {event.username}
                  </h3>
                  {event.discriminator !== '0' && (
                    <span className="text-xs font-mono text-zinc-600 shrink-0">#{event.discriminator}</span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-zinc-500 mt-0.5 truncate">
                  ID: <span className="text-zinc-300 select-all">{event.userId}</span>
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className={`text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded border ${
                    event.isBot
                      ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40'
                      : 'bg-zinc-900 text-[#00FF41] border-[#00FF41]/40'
                  }`}>
                    {event.isBot ? 'DISCORD_BOT' : 'USER_ACCOUNT'}
                  </span>
                  {accountAgeDays < 7 && (
                    <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-500/40">
                      FRESH (&lt; 7d)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={copyUsername}
                className="flex-1 sm:flex-initial px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedUsername ? <Check className="w-3.5 h-3.5 text-[#00FF41]" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                <span>{copiedUsername ? 'COPIED' : 'COPY_USER'}</span>
              </button>
              <button
                onClick={copyJson}
                className="flex-1 sm:flex-initial px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-[#00FF41]" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                <span>{copiedJson ? 'COPIED' : 'RAW_JSON'}</span>
              </button>
            </div>
          </div>

          {/* Forensic Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div className="p-3 rounded bg-[#080808] border border-zinc-800 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1.5">
                <Server className="w-3 h-3 text-[#00FF41]" /> DESTINATION_GUILD
              </span>
              <p className="text-xs font-mono font-bold text-zinc-200 truncate">{event.guildName}</p>
              <p className="text-[9px] font-mono text-zinc-600 truncate">ID: {event.guildId}</p>
            </div>

            <div className="p-3 rounded bg-[#080808] border border-zinc-800 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#00FF41]" /> INGRESS_TIMESTAMP
              </span>
              <p className="text-xs font-mono font-bold text-zinc-200">{formatDate(event.joinedAt || event.createdAt)}</p>
              <p className="text-[9px] font-mono text-zinc-600">CAPTURED_VIA_BOT #{event.botId || 1}</p>
            </div>

            <div className="p-3 rounded bg-[#080808] border border-zinc-800 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-cyan-400" /> ACCOUNT_CREATION
              </span>
              <p className="text-xs font-mono font-bold text-zinc-200">{formatDate(event.accountCreatedAt)}</p>
              <p className="text-[9px] font-mono text-cyan-400">
                ACCOUNT_AGE: ~{accountAgeDays} DAYS
              </p>
            </div>

            <div className="p-3 rounded bg-[#080808] border border-zinc-800 space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-amber-400" /> INITIAL_ROLES
              </span>
              <p className="text-xs font-mono font-bold text-zinc-200">{event.rolesCount} ROLES</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {event.roleNames.length > 0 ? (
                  event.roleNames.map((r, idx) => (
                    <span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] font-mono text-zinc-600">NONE</span>
                )}
              </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="p-3 sm:p-3.5 rounded bg-[#080808] border border-zinc-800">
            <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              [DETECTED_PROFILE_FLAGS]
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {event.badges.length > 0 ? (
                event.badges.map((badge) => (
                  <span
                    key={badge}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800"
                  >
                    {badge}
                  </span>
                ))
              ) : (
                <span className="text-xs font-mono text-zinc-600">NO_SPECIAL_FLAGS_DETECTED</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-3.5 bg-[#080808] border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-600">
            RECORD #{event.id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-mono border border-zinc-800 transition-colors cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
