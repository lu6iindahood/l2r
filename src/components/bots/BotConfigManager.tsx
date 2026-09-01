import React, { useState } from 'react';
import { BotConfigItem, BotStatusItem, MemberEvent } from '../../types/index.js';
import { 
  Bot, 
  Plus, 
  Key, 
  Eye, 
  EyeOff, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Server, 
  Wifi, 
  Hash, 
  Zap,
  Play,
  ArrowRight
} from 'lucide-react';
import { formatRelativeTime } from '../../lib/utils.js';

interface BotConfigManagerProps {
  configs: BotConfigItem[];
  statuses: BotStatusItem[];
  recentEvents?: MemberEvent[];
  onAddConfig: (name: string, token: string, logChannelId: string) => Promise<void>;
  onDeleteConfig: (id: number) => Promise<void>;
  onRefreshStatuses: () => Promise<void>;
  onTriggerTestEvent?: (customData?: { botId?: number; guildName?: string; username?: string }) => Promise<any>;
  onSelectEvent?: (event: MemberEvent) => void;
  onNavigateToLogs?: () => void;
}

export const BotConfigManager: React.FC<BotConfigManagerProps> = ({
  configs,
  statuses,
  recentEvents = [],
  onAddConfig,
  onDeleteConfig,
  onRefreshStatuses,
  onTriggerTestEvent,
  onSelectEvent,
  onNavigateToLogs,
}) => {
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [logChannelId, setLogChannelId] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [testingBotId, setTestingBotId] = useState<number | null>(null);
  const [testSuccessBotId, setTestSuccessBotId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleTestBot = async (botId: number) => {
    if (!onTriggerTestEvent) return;
    try {
      setTestingBotId(botId);
      await onTriggerTestEvent({ botId });
      setTestSuccessBotId(botId);
      setTimeout(() => setTestSuccessBotId(null), 3000);
    } catch (err: any) {
      console.error('Failed to trigger bot test event:', err);
    } finally {
      setTestingBotId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      setConfirmDeleteId(null);
      await onDeleteConfig(id);
      setFeedback({ type: 'success', message: `Bot instance #${id} decommissioned.` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete bot instance' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !token.trim()) {
      setFeedback({ type: 'error', message: 'Instance name and Discord Token are mandatory.' });
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddConfig(name.trim(), token.trim(), logChannelId.trim());
      setName('');
      setToken('');
      setLogChannelId('');
      setFeedback({ type: 'success', message: 'Bot token registered! Telemetry listener is active.' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add bot' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (botId: number) => {
    const st = statuses.find((s) => s.id === botId);
    if (!st) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
          OFFLINE
        </span>
      );
    }

    if (st.status === 'online' || st.status === 'simulated') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-[#00FF41] border border-[#00FF41]/40 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41] animate-pulse"></span>
          ONLINE
        </span>
      );
    }

    if (st.status === 'connecting') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-cyan-400 border border-cyan-500/40">
          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
          CONNECTING
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-500/40">
        ERROR
      </span>
    );
  };

  return (
    <div className="space-y-6 select-none font-mono">
      {/* Notice Banner */}
      <div className="p-4 rounded-lg bg-[#080808] border border-zinc-800 flex items-start gap-3.5">
        <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-[#00FF41] shrink-0 mt-0.5">
          <Zap className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-zinc-100 flex items-center gap-2">
            DISCORD SELFBOT & BOT EVENT INGESTION PIPELINE
          </h4>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            When you add a token, the listener monitors all Discord servers the account is in. When any user joins those servers, their badges, Snowflake ID, creation date, and role metadata are recorded into SQLite. Click <strong className="text-[#00FF41]">[TEST INFLOW]</strong> on any bot to simulate an incoming member join event right away.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Add Bot Token */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded bg-[#0A0A0A] border border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-mono font-bold text-xs text-[#00FF41] uppercase tracking-wider">
                [REGISTER_MONITOR_INSTANCE]
              </h3>
            </div>
            <p className="text-[10px] text-zinc-500 mb-4 uppercase">
              ATTACH DISCORD ACCOUNT TOKEN TO DISPATCH TELEMETRY LISTENER
            </p>

            {feedback && (
              <div
                className={`p-3 rounded text-xs font-mono mb-4 flex items-center gap-2 border ${
                  feedback.type === 'success'
                    ? 'bg-zinc-900 text-[#00FF41] border-[#00FF41]/50'
                    : 'bg-rose-950 text-rose-400 border-rose-500/40'
                }`}
              >
                {feedback.type === 'success' ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                  INSTANCE_IDENTIFIER / NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. SENTINEL_VANGUARD_01"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#080808] border border-zinc-800 focus:border-[#00FF41]/60 rounded text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-colors uppercase"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                  DISCORD_TOKEN (ACCOUNT / USER TOKEN)
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    placeholder="OTk2OTg4MTI4OTI4Njg4MjIw.G_..."
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    className="w-full pl-3 pr-9 py-2 bg-[#080808] border border-zinc-800 focus:border-[#00FF41]/60 rounded text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[9px] font-mono text-zinc-600 mt-1 uppercase">
                  STORED SECURELY IN SQLITE. HANDLED VIA DISCORD.JS-SELFBOT-V13.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                  RELAY_CHANNEL_ID (OPTIONAL)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 118949827361928374"
                  value={logChannelId}
                  onChange={(e) => setLogChannelId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080808] border border-zinc-800 focus:border-[#00FF41]/60 rounded text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
                <p className="text-[9px] font-mono text-zinc-600 mt-1 uppercase">
                  OPTIONAL TARGET FOR DISPATCHING REAL-TIME ALERT MESSAGES.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded bg-zinc-900 hover:bg-zinc-800 text-[#00FF41] border border-[#00FF41]/60 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-[#00FF41]" />
                  <span>{isSubmitting ? 'CONNECTING...' : 'REGISTER & BOOT MONITOR'}</span>
                </button>
              </div>
            </form>

            {/* Quick preset filler for instant testing */}
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setName(`SENTINEL_ALPHA_${Math.floor(10 + Math.random() * 90)}`);
                  setToken(`OTk2OTg4MTI4OTI4Njg4MjIw.SAMPLE_PRESET_${Math.random().toString(36).substring(7).toUpperCase()}`);
                  setLogChannelId('119283746592817263');
                }}
                className="w-full py-2 px-3 bg-[#080808] hover:bg-zinc-900 text-cyan-400 border border-zinc-800 rounded text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>[LOAD_PRESET_SAMPLE_TOKEN]</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Active Bot Fleet Table & Telemetry Inflow Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded bg-[#0A0A0A] border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-bold text-xs text-[#00FF41] uppercase tracking-wider">
                  [ACTIVE_TELEMETRY_FLEET] ({configs.length})
                </h3>
              </div>
              <button
                onClick={onRefreshStatuses}
                className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Ping all active bot gateways"
              >
                <RefreshCw className="w-3 h-3 text-[#00FF41]" />
                <span>SYNC_FLEET</span>
              </button>
            </div>

            {configs.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-zinc-600">
                NO_BOT_INSTANCES_REGISTERED_YET
              </div>
            ) : (
              <div className="space-y-3">
                {configs.map((config) => {
                  const status = statuses.find((s) => s.id === config.id);
                  const isTesting = testingBotId === config.id;
                  const isSuccess = testSuccessBotId === config.id;

                  return (
                    <div
                      key={config.id}
                      className="p-4 rounded bg-[#080808] border border-zinc-800 hover:border-zinc-700 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#00FF41] font-mono font-bold shrink-0">
                            {status?.avatarUrl ? (
                              <img
                                src={status.avatarUrl}
                                alt={config.name}
                                className="w-full h-full rounded object-cover"
                              />
                            ) : (
                              <Bot className="w-4 h-4 text-[#00FF41]" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-mono font-bold text-xs text-zinc-100 uppercase truncate">
                                {config.name}
                              </h4>
                              {getStatusBadge(config.id)}
                            </div>
                            <p className="text-[10px] font-mono text-zinc-500 mt-0.5 truncate">
                              TAG: <span className="text-zinc-300">{status?.tag || 'NOT_CONNECTED'}</span>
                            </p>
                          </div>
                        </div>

                        {/* Action buttons on bot card */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Test / Simulate Join Button for this Bot */}
                          <button
                            onClick={() => handleTestBot(config.id)}
                            disabled={isTesting}
                            className={`px-2.5 py-1.5 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                              isSuccess
                                ? 'bg-[#00FF41]/20 text-[#00FF41] border-[#00FF41]/50'
                                : 'bg-zinc-900 hover:bg-zinc-800 text-[#00FF41] hover:text-[#00FF41] border-zinc-700 hover:border-[#00FF41]/50'
                            }`}
                            title="Simulates a realistic member join event associated with this bot"
                          >
                            <Play className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                            <span>{isTesting ? 'TESTING...' : isSuccess ? 'TELEMETRY_LOGGED!' : 'TEST INFLOW'}</span>
                          </button>

                          {confirmDeleteId === config.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(config.id)}
                                disabled={deletingId === config.id}
                                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-mono font-bold transition-colors cursor-pointer"
                              >
                                {deletingId === config.id ? 'DELETING...' : 'CONFIRM'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={deletingId === config.id}
                                className="px-1.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono transition-colors cursor-pointer"
                              >
                                CANCEL
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(config.id)}
                              disabled={deletingId === config.id}
                              className="p-1.5 rounded bg-zinc-900 hover:bg-rose-950 hover:text-rose-400 text-zinc-500 border border-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
                              title="Decommission instance"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bot Telemetry Metrics */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-900">
                        <div className="p-2 rounded bg-[#050505] border border-zinc-900">
                          <span className="text-[9px] font-mono text-zinc-500 block uppercase">TOKEN_MASK</span>
                          <span className="text-[11px] font-mono text-zinc-300 font-semibold truncate block">
                            {config.tokenMasked}
                          </span>
                        </div>

                        <div className="p-2 rounded bg-[#050505] border border-zinc-900">
                          <span className="text-[9px] font-mono text-zinc-500 block uppercase">GUILDS_MAPPED</span>
                          <span className="text-[11px] font-mono text-[#00FF41] font-bold flex items-center gap-1">
                            <Server className="w-3 h-3 text-[#00FF41]" />
                            {status?.guildCount ?? 0}
                          </span>
                        </div>

                        <div className="p-2 rounded bg-[#050505] border border-zinc-900">
                          <span className="text-[9px] font-mono text-zinc-500 block uppercase">GATEWAY_PING</span>
                          <span className="text-[11px] font-mono text-cyan-400 font-bold flex items-center gap-1">
                            <Wifi className="w-3 h-3 text-cyan-400" />
                            {status?.ping ? `${status.ping}ms` : '—'}
                          </span>
                        </div>
                      </div>

                      {config.logChannelId && (
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500">
                          <Hash className="w-3 h-3 text-amber-400" />
                          <span>RELAY_CHANNEL: <code className="text-zinc-300">{config.logChannelId}</code></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Telemetry Preview on Bot Fleet Page */}
          <div className="p-5 rounded bg-[#0A0A0A] border border-zinc-800 space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#00FF41]" />
                <h3 className="font-bold text-xs text-zinc-200 tracking-wider">
                  RECENT_INFLOW_STREAM (LAST 5 EVENTS)
                </h3>
              </div>

              {onNavigateToLogs && (
                <button
                  onClick={onNavigateToLogs}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>VIEW_FULL_AUDIT_LOGS</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {recentEvents.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-600">
                No member join events recorded yet. Click <span className="text-[#00FF41] font-bold">[TEST INFLOW]</span> above or <span className="text-[#00FF41] font-bold">[SIMULATE_JOIN]</span> in the top header to record telemetry.
              </div>
            ) : (
              <div className="space-y-2">
                {recentEvents.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onSelectEvent?.(event)}
                    className="p-2.5 rounded bg-[#050505] border border-zinc-900 hover:border-zinc-700 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#00FF41] font-bold text-xs shrink-0 overflow-hidden">
                        {event.avatarUrl ? (
                          <img src={event.avatarUrl} alt={event.username} className="w-full h-full object-cover" />
                        ) : (
                          event.username.slice(0, 1).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-200 truncate">
                            {event.username}
                          </span>
                          {event.badges && event.badges.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 truncate">
                              {event.badges[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 truncate">
                          {event.guildName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right shrink-0">
                      <span className="text-[9px] text-zinc-500">
                        {formatRelativeTime(event.joinedAt || event.createdAt)}
                      </span>
                      <span className="text-[9px] text-[#00FF41] font-bold bg-[#00FF41]/10 px-1.5 py-0.5 rounded border border-[#00FF41]/30">
                        LOGGED
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

