export interface MemberEvent {
  id: number;
  userId: string;
  username: string;
  discriminator: string;
  guildId: string;
  guildName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isBot: boolean;
  isSystem: boolean;
  pending: boolean;
  rolesCount: number;
  roleNames: string[];
  badges: string[];
  accountCreatedAt: string;
  joinedAt: string;
  botId: number | null;
  createdAt: number;
}

export interface DailyJoin {
  date: string;
  displayDate: string;
  joins: number;
  bots: number;
  humans: number;
}

export interface TopBadge {
  name: string;
  count: number;
}

export interface TopGuild {
  guildId: string;
  guildName: string;
  count: number;
}

export interface StatsData {
  totalEvents: number;
  uniqueUsers: number;
  activeGuilds: number;
  botCount: number;
  humanCount: number;
  botPercentage: string;
  topBadges: TopBadge[];
  dailyJoins: DailyJoin[];
  topGuilds: TopGuild[];
}

export interface BotConfigItem {
  id: number;
  name: string;
  tokenMasked: string;
  tokenLength: number;
  logChannelId: string | null;
  updatedAt: number | null;
}

export interface BotStatusItem {
  id: number;
  name: string;
  tokenMasked: string;
  logChannelId: string | null;
  status: 'online' | 'offline' | 'connecting' | 'error' | 'simulated';
  tag: string | null;
  avatarUrl: string | null;
  guildCount: number;
  ping: number;
  lastConnected: string | null;
  error?: string;
}
