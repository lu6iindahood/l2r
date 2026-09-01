import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar.js';
import { Header } from './components/layout/Header.js';
import { StatCards } from './components/dashboard/StatCards.js';
import { JoinsChart } from './components/dashboard/JoinsChart.js';
import { BadgeBreakdownChart } from './components/dashboard/BadgeBreakdownChart.js';
import { TopGuildsList } from './components/dashboard/TopGuildsList.js';
import { LiveFeedStream } from './components/dashboard/LiveFeedStream.js';
import { MemberLogsTable } from './components/members/MemberLogsTable.js';
import { MemberDetailModal } from './components/members/MemberDetailModal.js';
import { BotConfigManager } from './components/bots/BotConfigManager.js';
import { TelemetryTerminal } from './components/terminal/TelemetryTerminal.js';
import { UserCheck, ExternalLink, X, Zap, LayoutDashboard, Users, Bot, Terminal as TerminalIcon } from 'lucide-react';
import { 
  StatsData, 
  MemberEvent, 
  BotConfigItem, 
  BotStatusItem 
} from './types/index.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'members' | 'bots' | 'terminal'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [botStatuses, setBotStatuses] = useState<BotStatusItem[]>([]);
  const [botConfigs, setBotConfigs] = useState<BotConfigItem[]>([]);
  
  // Member table state
  const [members, setMembers] = useState<MemberEvent[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedBotId, setSelectedBotId] = useState<number | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selected member for modal
  const [selectedMember, setSelectedMember] = useState<MemberEvent | null>(null);
  const [latestInjectedEvent, setLatestInjectedEvent] = useState<MemberEvent | null>(null);

  // Previous total members ref to detect new joins
  const prevTotalRef = React.useRef(0);

  // Trigger Windows Notification
  const triggerSystemNotification = useCallback((member: MemberEvent) => {
    if (!('Notification' in window)) return;
    
    const title = '⚠️ NEW TARGET DETECTED';
    const body = `User: ${member.username}\nServer: ${member.guildName}`;
    
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: member.avatarUrl || undefined });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body, icon: member.avatarUrl || undefined });
        }
      });
    }
  }, []);

  // Play simple clean notification sound (crisp double chime)
  const playNotificationSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Tone 1
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.1, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Tone 2
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.08); // A5
      gain2.gain.setValueAtTime(0.12, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.28);
    } catch (e) {
      console.log('Audio playback failed', e);
    }
  }, []);

  // Request notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Detect new joins and play sound + notification
  useEffect(() => {
    if (prevTotalRef.current !== 0 && totalMembers > prevTotalRef.current) {
      playNotificationSound();
      const newestMember = members[0];
      if (newestMember) {
        triggerSystemNotification(newestMember);
      }
    }
    prevTotalRef.current = totalMembers;
  }, [totalMembers, members, playNotificationSound, triggerSystemNotification]);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  // Fetch Bot Statuses
  const fetchBotStatuses = useCallback(async () => {
    try {
      const res = await fetch('/api/bot/status');
      if (res.ok) {
        const data = await res.json();
        setBotStatuses(data);
      }
    } catch (err) {
      console.error('Failed to fetch bot statuses:', err);
    }
  }, []);

  // Fetch Bot Configs
  const fetchBotConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setBotConfigs(data);
      }
    } catch (err) {
      console.error('Failed to fetch bot configs:', err);
    }
  }, []);

  // Fetch Member Logs
  const fetchMembers = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoadingMembers(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        search: search.trim(),
        filter: filter,
      });
      if (selectedBotId !== null) {
        params.set('botId', String(selectedBotId));
      }
      const res = await fetch(`/api/members?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.items || []);
        setTotalMembers(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch member logs:', err);
    } finally {
      if (!isBackground) setIsLoadingMembers(false);
    }
  }, [page, search, filter, selectedBotId]);

  // Initial load and periodic refresh
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStats(), fetchBotStatuses(), fetchBotConfigs(), fetchMembers()]);
    setIsRefreshing(false);
  }, [fetchStats, fetchBotStatuses, fetchBotConfigs, fetchMembers]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(() => {
      fetchStats();
      fetchBotStatuses();
      fetchMembers(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [refreshAll, fetchStats, fetchBotStatuses, fetchMembers]);

  // Trigger test simulated join event
  const handleTriggerTestEvent = async (customData?: { botId?: number; guildName?: string; username?: string }) => {
    try {
      const res = await fetch('/api/test/generate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customData || {}),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.event) {
          setLatestInjectedEvent(data.event);
          setTimeout(() => {
            setLatestInjectedEvent((curr) => (curr?.id === data.event.id ? null : curr));
          }, 8000);
        }
        await Promise.all([fetchStats(), fetchMembers()]);
        return data.event;
      }
    } catch (err) {
      console.error('Failed to inject test event:', err);
    }
    return null;
  };

  // Add Bot Config
  const handleAddBotConfig = async (name: string, token: string, logChannelId: string) => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, token, logChannelId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add bot');
    }
    await Promise.all([fetchBotConfigs(), fetchBotStatuses()]);
  };

  // Delete Bot Config
  const handleDeleteBotConfig = async (id: number) => {
    try {
      const res = await fetch(`/api/config/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete bot instance');
      }
      await Promise.all([fetchBotConfigs(), fetchBotStatuses()]);
    } catch (err: any) {
      console.error('Delete bot error:', err);
      throw err;
    }
  };

  // Delete All Logs
  const handleDeleteAllLogs = async () => {
    try {
      const res = await fetch('/api/members', {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to clear member logs');
      }
      await Promise.all([fetchStats(), fetchMembers()]);
    } catch (err: any) {
      console.error('Clear logs error:', err);
      throw err;
    }
  };

  const activeBotCount = botStatuses.filter((b) => b.status === 'online' || b.status === 'simulated').length;

  const getHeaderDetails = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'GATEWAY TELEMETRY DASHBOARD',
          subtitle: 'Live member join analytics, bot fleet health & server inflow',
        };
      case 'members':
        if (selectedBotId !== null) {
          const matched = botConfigs.find((b) => b.id === selectedBotId);
          return {
            title: `MEMBER AUDIT LOGS // BOT #${selectedBotId}`,
            subtitle: `Dedicated join telemetry channel for [${matched?.name || 'Bot #' + selectedBotId}]`,
          };
        }
        return {
          title: 'MEMBER INFLOW AUDIT LOGS',
          subtitle: 'Global member event archive across all bot tokens',
        };
      case 'bots':
        return {
          title: 'DISCORD SELFBOT FLEET CONFIG',
          subtitle: 'Manage active tokens, event listeners & relay channels',
        };
      case 'terminal':
        return {
          title: 'RAW GATEWAY STREAM CONSOLE',
          subtitle: 'Real-time WebSocket event buffer & diagnostic tools',
        };
    }
  };

  const headerInfo = getHeaderDetails();

  return (
    <div className="min-h-screen bg-[#05080c] cyber-grid flex text-slate-100 font-sans">
      {/* Responsive Sidebar (Slide-over drawer on mobile, persistent on desktop) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        activeBotCount={activeBotCount}
        totalEvents={stats?.totalEvents || 0}
        botConfigs={botConfigs}
        botStatuses={botStatuses}
        selectedBotId={selectedBotId}
        onSelectBotId={(id) => {
          setSelectedBotId(id);
          setPage(1);
        }}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onRefresh={refreshAll}
          isRefreshing={isRefreshing}
          onTriggerTestEvent={handleTriggerTestEvent}
          botStatuses={botStatuses}
          botConfigs={botConfigs}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 p-3 sm:p-6 pb-24 lg:pb-6 space-y-4 sm:space-y-6 overflow-y-auto">
          {/* TAB 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Metric Stat Cards */}
              <StatCards stats={stats} botStatuses={botStatuses} />

              {/* Central Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 14-Day Joins Chart */}
                <div className="lg:col-span-8">
                  <JoinsChart data={stats?.dailyJoins || []} />
                </div>

                {/* Top Badges Breakdown */}
                <div className="lg:col-span-4">
                  <BadgeBreakdownChart badges={stats?.topBadges || []} />
                </div>
              </div>

              {/* Bottom Row: Active Guilds & Live Stream */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5">
                  <TopGuildsList
                    guilds={stats?.topGuilds || []}
                    totalEvents={stats?.totalEvents || 0}
                  />
                </div>

                <div className="lg:col-span-7">
                  <LiveFeedStream
                    events={members}
                    onSelectEvent={setSelectedMember}
                    onViewAll={() => setCurrentTab('members')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEMBER LOGS */}
          {currentTab === 'members' && (
            <MemberLogsTable
              events={members}
              total={totalMembers}
              page={page}
              totalPages={totalPages}
              search={search}
              filter={filter}
              onPageChange={setPage}
              onSearchChange={(s) => {
                setSearch(s);
                setPage(1);
              }}
              onFilterChange={(f) => {
                setFilter(f);
                setPage(1);
              }}
              onSelectEvent={setSelectedMember}
              onDeleteAllLogs={handleDeleteAllLogs}
              isLoading={isLoadingMembers}
              botConfigs={botConfigs}
              botStatuses={botStatuses}
              selectedBotId={selectedBotId}
              onSelectBotId={(id) => {
                setSelectedBotId(id);
                setPage(1);
              }}
            />
          )}

          {/* TAB 3: BOT CONFIG */}
          {currentTab === 'bots' && (
            <BotConfigManager
              configs={botConfigs}
              statuses={botStatuses}
              recentEvents={members}
              onAddConfig={handleAddBotConfig}
              onDeleteConfig={handleDeleteBotConfig}
              onRefreshStatuses={fetchBotStatuses}
              onTriggerTestEvent={handleTriggerTestEvent}
              onSelectEvent={setSelectedMember}
              onNavigateToLogs={() => setCurrentTab('members')}
            />
          )}

          {/* TAB 4: TELEMETRY TERMINAL */}
          {currentTab === 'terminal' && (
            <TelemetryTerminal
              events={members}
              botStatuses={botStatuses}
              onTriggerTestEvent={handleTriggerTestEvent}
              onDeleteAllLogs={handleDeleteAllLogs}
            />
          )}
        </main>
      </div>

      {/* Floating Live Telemetry Event Toast */}
      {latestInjectedEvent && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#0a0f16]/95 border border-[#00FF41]/60 shadow-[0_0_25px_rgba(0,255,65,0.2)] rounded-lg p-4 font-mono backdrop-blur-md animate-fadeIn transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                {latestInjectedEvent.avatarUrl ? (
                  <img
                    src={latestInjectedEvent.avatarUrl}
                    alt={latestInjectedEvent.username}
                    className="w-10 h-10 rounded-full border border-[#00FF41]/50 object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-[#00FF41]/50 flex items-center justify-center text-[#00FF41] font-bold text-sm">
                    {latestInjectedEvent.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#00FF41] border-2 border-[#0a0f16]" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-[#00FF41]/10 text-[#00FF41] px-1.5 py-0.5 rounded font-bold border border-[#00FF41]/30 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> LIVE INFLOW
                  </span>
                  <span className="text-[10px] text-zinc-500">JUST NOW</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-100 truncate mt-0.5">
                  {latestInjectedEvent.username}
                  {latestInjectedEvent.discriminator !== '0' && (
                    <span className="text-zinc-500 text-[10px]">#{latestInjectedEvent.discriminator}</span>
                  )}
                </h4>
                <p className="text-[10px] text-zinc-400 truncate">
                  in <span className="text-[#00FF41] font-semibold">{latestInjectedEvent.guildName}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setLatestInjectedEvent(null)}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setSelectedMember(latestInjectedEvent);
                setLatestInjectedEvent(null);
              }}
              className="px-2.5 py-1 rounded bg-[#00FF41]/10 hover:bg-[#00FF41]/20 text-[#00FF41] border border-[#00FF41]/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <UserCheck className="w-3 h-3" />
              <span>FORENSICS</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('members');
                setLatestInjectedEvent(null);
              }}
              className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>VIEW IN LOGS</span>
              <ExternalLink className="w-3 h-3 text-cyan-400" />
            </button>
          </div>
        </div>
      )}

      {/* Forensics Detail Modal */}
      {selectedMember && (
        <MemberDetailModal
          event={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {/* Mobile Bottom Navigation Bar (< lg screens) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#080808]/95 border-t border-zinc-800 backdrop-blur-md px-2 py-1.5 flex items-center justify-around font-mono select-none shadow-2xl">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded text-[10px] transition-all cursor-pointer ${
            currentTab === 'dashboard'
              ? 'text-[#00FF41] font-bold'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>DASHBOARD</span>
        </button>

        <button
          onClick={() => {
            setSelectedBotId(null);
            setCurrentTab('members');
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded text-[10px] transition-all cursor-pointer relative ${
            currentTab === 'members'
              ? 'text-[#00FF41] font-bold'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>LOGS</span>
          {stats?.totalEvents ? (
            <span className="absolute top-0.5 right-2 text-[8px] bg-zinc-900 text-[#00FF41] border border-[#00FF41]/40 px-1 rounded-full">
              {stats.totalEvents > 99 ? '99+' : stats.totalEvents}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setCurrentTab('bots')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded text-[10px] transition-all cursor-pointer relative ${
            currentTab === 'bots'
              ? 'text-[#00FF41] font-bold'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>BOTS</span>
          {activeBotCount > 0 && (
            <span className="absolute top-1 right-3.5 w-1.5 h-1.5 rounded-full bg-[#00FF41] shadow-[0_0_5px_#00FF41]" />
          )}
        </button>

        <button
          onClick={() => setCurrentTab('terminal')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded text-[10px] transition-all cursor-pointer ${
            currentTab === 'terminal'
              ? 'text-cyan-400 font-bold'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <TerminalIcon className="w-4 h-4" />
          <span>CONSOLE</span>
        </button>
      </nav>
    </div>
  );
}
