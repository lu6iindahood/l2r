import React, { useState } from 'react';
import { MemberEvent, BotConfigItem, BotStatusItem } from '../../types/index.js';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Server,
  Trash2,
  AlertTriangle,
  Check,
  Layers,
  Radio,
  Clock,
  Shield,
  Tag
} from 'lucide-react';
import { formatDate, formatRelativeTime, getBadgeColor } from '../../lib/utils.js';

interface MemberLogsTableProps {
  events: MemberEvent[];
  total: number;
  page: number;
  totalPages: number;
  search: string;
  filter: string;
  onPageChange: (newPage: number) => void;
  onSearchChange: (newSearch: string) => void;
  onFilterChange: (newFilter: string) => void;
  onSelectEvent: (event: MemberEvent) => void;
  onDeleteAllLogs: () => Promise<void>;
  isLoading: boolean;
  botConfigs?: BotConfigItem[];
  botStatuses?: BotStatusItem[];
  selectedBotId?: number | null;
  onSelectBotId?: (botId: number | null) => void;
}

export const MemberLogsTable: React.FC<MemberLogsTableProps> = ({
  events,
  total,
  page,
  totalPages,
  search,
  filter,
  onPageChange,
  onSearchChange,
  onFilterChange,
  onSelectEvent,
  onDeleteAllLogs,
  isLoading,
  botConfigs = [],
  botStatuses = [],
  selectedBotId = null,
  onSelectBotId,
}) => {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  const handleClearLogs = async () => {
    try {
      setIsClearing(true);
      await onDeleteAllLogs();
      setIsConfirmingClear(false);
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to clear logs:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const exportCsv = () => {
    if (events.length === 0) return;
    const headers = ['ID', 'User ID', 'Username', 'Discriminator', 'Guild Name', 'Guild ID', 'Is Bot', 'Badges', 'Roles Count', 'Account Created', 'Joined At'];
    const rows = events.map((e) => [
      e.id,
      e.userId,
      `"${e.username.replace(/"/g, '""')}"`,
      e.discriminator,
      `"${e.guildName.replace(/"/g, '""')}"`,
      e.guildId,
      e.isBot ? 'TRUE' : 'FALSE',
      `"${e.badges.join('; ')}"`,
      e.rolesCount,
      e.accountCreatedAt,
      e.joinedAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `discord_member_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filterOptions = [
    { id: 'all', label: 'ALL_JOINS' },
    { id: 'humans', label: 'HUMANS' },
    { id: 'bots', label: 'BOTS' },
    { id: 'nitro', label: 'NITRO' },
    { id: 'staff_early', label: 'STAFF/EARLY' },
  ];

  return (
    <div className="space-y-4 font-mono select-none">
      {/* Bot / Token Channels Bar */}
      {botConfigs.length > 0 && (
        <div className="p-3 rounded bg-[#0A0A0A] border border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
              <Layers className="w-3.5 h-3.5 text-[#00FF41]" />
              TOKEN_PAGE:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => onSelectBotId && onSelectBotId(null)}
                className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedBotId === null
                    ? 'bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/50 font-bold shadow-[0_0_8px_rgba(0,255,65,0.2)]'
                    : 'bg-[#080808] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>[ALL_TOKENS]</span>
              </button>

              {botConfigs.map((cfg) => {
                const status = botStatuses.find((s) => s.id === cfg.id);
                const isOnline = status?.status === 'online';
                const isSelected = selectedBotId === cfg.id;

                return (
                  <button
                    key={cfg.id}
                    onClick={() => onSelectBotId && onSelectBotId(cfg.id)}
                    className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#00FF41]/15 text-[#00FF41] border border-[#00FF41] font-bold shadow-[0_0_12px_rgba(0,255,65,0.25)]'
                        : 'bg-[#080808] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-[#00FF41] shadow-[0_0_5px_#00FF41]' : 'bg-zinc-700'}`} />
                    <span>#{cfg.id} {cfg.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedBotId !== null && (
            <div className="text-[10px] text-[#00FF41] bg-emerald-950/40 border border-[#00FF41]/30 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
              <span>● ISOLATED VIEW: BOT #{selectedBotId}</span>
            </div>
          )}
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="p-3 sm:p-4 rounded bg-[#0A0A0A] border border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="SEARCH USERNAME, USER ID, GUILD..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#080808] border border-zinc-800 focus:border-[#00FF41]/60 rounded text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-colors uppercase"
          />
        </div>

        {/* Filter Pills & Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onFilterChange(opt.id)}
              className={`px-2.5 py-1.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                filter === opt.id
                  ? 'bg-zinc-900 text-[#00FF41] border border-[#00FF41]/50 font-bold'
                  : 'bg-[#080808] text-zinc-500 hover:text-zinc-300 border border-zinc-800'
              }`}
            >
              {opt.label}
            </button>
          ))}

          {/* Export Button */}
          <button
            onClick={exportCsv}
            disabled={events.length === 0}
            className="px-2.5 py-1.5 rounded bg-[#080808] hover:bg-zinc-900 text-zinc-300 border border-zinc-800 text-[11px] flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">EXPORT</span>
          </button>

          {/* Delete All Logs Button */}
          {!isConfirmingClear ? (
            <button
              onClick={() => setIsConfirmingClear(true)}
              disabled={total === 0 || isLoading}
              className="px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-[11px] flex items-center gap-1.5 transition-all disabled:opacity-30 cursor-pointer font-bold"
              title="Purge logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{clearSuccess ? 'PURGED' : 'PURGE'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 animate-fadeIn">
              <button
                onClick={handleClearLogs}
                disabled={isClearing}
                className="px-2.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-lg"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isClearing ? '...' : 'CONFIRM'}</span>
              </button>
              <button
                onClick={() => setIsConfirmingClear(false)}
                disabled={isClearing}
                className="px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition-colors cursor-pointer"
              >
                CANCEL
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE VIEW (< md screens): Responsive Cyber Card List */}
      <div className="block md:hidden space-y-2.5">
        {isLoading ? (
          <div className="p-8 rounded bg-[#0A0A0A] border border-zinc-800 text-center text-zinc-500">
            <div className="inline-flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-[#00FF41] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs">LOADING_TELEMETRY...</span>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 rounded bg-[#0A0A0A] border border-zinc-800 text-center text-zinc-600 text-xs">
            NO_INGRESS_RECORDS_FOUND
          </div>
        ) : (
          events.map((ev) => {
            const accountAgeDays = Math.floor(
              (new Date(ev.joinedAt || ev.createdAt).getTime() - new Date(ev.accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="p-3.5 rounded bg-[#0A0A0A] border border-zinc-800/80 hover:border-[#00FF41]/40 transition-all cursor-pointer space-y-2.5 active:bg-zinc-900/60"
              >
                {/* User Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      {ev.avatarUrl ? (
                        <img
                          src={ev.avatarUrl}
                          alt={ev.username}
                          className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 text-xs font-bold">
                          {ev.username.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      {ev.isBot && (
                        <span className="absolute -bottom-1 -right-1 text-[7px] bg-cyan-950 text-cyan-400 border border-cyan-500/40 px-1 rounded font-bold">
                          BOT
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-zinc-100 text-xs truncate">{ev.username}</span>
                        {ev.discriminator !== '0' && (
                          <span className="text-zinc-600 text-[10px]">#{ev.discriminator}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 block truncate">ID: {ev.userId}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(ev);
                    }}
                    className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[#00FF41] border border-zinc-800 text-[10px] shrink-0"
                  >
                    INSPECT
                  </button>
                </div>

                {/* Server & Metadata */}
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-zinc-900">
                  <div className="flex items-center gap-1.5 text-zinc-300 truncate">
                    <Server className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span className="truncate">{ev.guildName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400 justify-end">
                    <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span>{formatRelativeTime(ev.joinedAt || ev.createdAt)}</span>
                  </div>
                </div>

                {/* Badges & Account Age */}
                <div className="flex items-center justify-between text-[10px] pt-1">
                  <div className="flex items-center gap-1">
                    <span className="text-zinc-500">AGE:</span>
                    <span className={accountAgeDays < 7 ? 'text-rose-400 font-bold' : 'text-zinc-400'}>
                      {accountAgeDays}d
                    </span>
                    {accountAgeDays < 7 && (
                      <span className="text-[8px] px-1 bg-rose-950/60 text-rose-400 rounded border border-rose-500/40">
                        NEW
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 max-w-[60%] justify-end">
                    {ev.badges.slice(0, 2).map((b) => (
                      <span key={b} className="text-[8px] px-1 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 truncate">
                        {b}
                      </span>
                    ))}
                    {ev.badges.length > 2 && (
                      <span className="text-[8px] text-zinc-600">+{ev.badges.length - 2}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP VIEW (>= md screens): Full High-Density Table */}
      <div className="hidden md:block rounded bg-[#0A0A0A] border border-zinc-800 overflow-hidden shadow-inner">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono">
            <thead>
              <tr className="border-b border-zinc-800 bg-[#080808] text-[10px] text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-4">IDENTIFIER / USER</th>
                <th className="py-3 px-4">TARGET_SERVER</th>
                <th className="py-3 px-4">BADGES & FLAGS</th>
                <th className="py-3 px-4">ACCOUNT_AGE</th>
                <th className="py-3 px-4">INGRESS_TIMESTAMP</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-[#00FF41] border-t-transparent rounded-full animate-spin"></div>
                      <span>QUERYING_SQLITE_TELEMETRY...</span>
                    </div>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-600">
                    NO_INGRESS_RECORDS_MATCHING_FILTER
                  </td>
                </tr>
              ) : (
                events.map((ev) => {
                  const accountAgeDays = Math.floor(
                    (new Date(ev.joinedAt || ev.createdAt).getTime() - new Date(ev.accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <tr
                      key={ev.id}
                      onClick={() => onSelectEvent(ev)}
                      className="hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                    >
                      {/* User Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            {ev.avatarUrl ? (
                              <img
                                src={ev.avatarUrl}
                                alt={ev.username}
                                className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 object-cover"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 text-[10px] font-bold">
                                {ev.username.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            {ev.isBot && (
                              <span className="absolute -bottom-1 -right-1 text-[7px] bg-cyan-950 text-cyan-400 border border-cyan-500/40 px-1 rounded font-bold">
                                BOT
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-zinc-200 group-hover:text-[#00FF41] transition-colors">
                                {ev.username}
                              </span>
                              {ev.discriminator !== '0' && (
                                <span className="text-zinc-600 text-[10px]">#{ev.discriminator}</span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-600 block truncate">ID: {ev.userId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Server Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Server className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span className="text-zinc-300 font-medium truncate max-w-[180px]">
                            {ev.guildName}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-600 block">ID: {ev.guildId.slice(0, 8)}...</span>
                      </td>

                      {/* Badges Column */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                          {ev.badges.length > 0 ? (
                            ev.badges.map((b) => (
                              <span
                                key={b}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800"
                              >
                                {b}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-zinc-600">NONE</span>
                          )}
                        </div>
                      </td>

                      {/* Account Age Column */}
                      <td className="py-3 px-4 text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <span className={accountAgeDays < 7 ? 'text-rose-400 font-bold' : 'text-zinc-400'}>
                            {accountAgeDays}d
                          </span>
                          {accountAgeDays < 7 && (
                            <span className="text-[8px] px-1 bg-rose-950/60 text-rose-400 rounded border border-rose-500/40">
                              NEW
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-zinc-600 block">
                          {formatDate(ev.accountCreatedAt).split(',')[0]}
                        </span>
                      </td>

                      {/* Joined At Column */}
                      <td className="py-3 px-4 text-zinc-300">
                        <div className="text-zinc-300">{formatRelativeTime(ev.joinedAt || ev.createdAt)}</div>
                        <span className="text-[9px] text-zinc-600 block">
                          {formatDate(ev.joinedAt || ev.createdAt)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(ev);
                          }}
                          className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 hover:text-[#00FF41] text-zinc-400 border border-zinc-800 text-[10px] transition-colors cursor-pointer"
                        >
                          [INSPECT]
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 sm:p-3.5 bg-[#0A0A0A] rounded border border-zinc-800 flex items-center justify-between">
        <div className="text-[10px] sm:text-[11px] text-zinc-500 truncate">
          SHOWING <strong className="text-zinc-300">{events.length}</strong> OF <strong className="text-zinc-300">{total}</strong> RECORDS
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] sm:text-xs text-zinc-400 px-1 sm:px-2">
            PAGE {page} OF {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
