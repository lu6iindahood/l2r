import { Client } from 'discord.js-selfbot-v13';
import { client as dbClient } from '../db/index.js';

export interface BotInstanceStatus {
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

// Safe Webhook Dispatcher (Uses independent HTTP request without touching user token)
async function sendSafeWebhook(webhookUrl: string | null, content: string) {
  if (!webhookUrl) return;
  if (webhookUrl.startsWith('https://discord.com/api/webhooks/') || webhookUrl.startsWith('https://canary.discord.com/api/webhooks/')) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
    } catch (err) {
      console.warn('[DiscordManager] Webhook dispatch failed:', err);
    }
  }
}

class DiscordManager {
  private clients: Map<number, Client> = new Map();
  private statuses: Map<number, BotInstanceStatus> = new Map();

  constructor() {
    console.log('[DiscordManager] Initialized Stealth Ingress Telemetry Engine');
  }

  // Load all bots from DB and attempt connection
  public async syncBots() {
    try {
      const result = await dbClient.execute('SELECT * FROM bot_config ORDER BY id ASC');
      const bots = result.rows;

      const currentIds = new Set(bots.map((b: any) => Number(b.id)));
      
      for (const [id, client] of this.clients.entries()) {
        if (!currentIds.has(id)) {
          console.log(`[DiscordManager] Disconnecting removed bot #${id}`);
          try {
            client.destroy();
          } catch (_) {}
          this.clients.delete(id);
          this.statuses.delete(id);
        }
      }

      for (const id of Array.from(this.statuses.keys())) {
        if (!currentIds.has(id)) {
          this.statuses.delete(id);
        }
      }

      for (const bot of bots) {
        const botId = Number(bot.id);
        const name = String(bot.name || `Bot #${botId}`);
        const token = String(bot.token || '');
        const logChannelId = bot.logChannelId ? String(bot.logChannelId) : null;

        const masked = token.length > 10
          ? `${token.slice(0, 4)}...${token.slice(-4)}`
          : '••••••••';

        if (!this.clients.has(botId) && !this.statuses.has(botId)) {
          this.statuses.set(botId, {
            id: botId,
            name,
            tokenMasked: masked,
            logChannelId,
            status: 'connecting',
            tag: null,
            avatarUrl: null,
            guildCount: 0,
            ping: 0,
            lastConnected: null,
          });

          this.startBot(botId, name, token, logChannelId);
        }
      }
    } catch (err) {
      console.error('[DiscordManager] Error syncing bots:', err);
    }
  }

  public async removeBot(id: number) {
    const client = this.clients.get(id);
    if (client) {
      try {
        client.destroy();
      } catch (_) {}
      this.clients.delete(id);
    }
    this.statuses.delete(id);
  }

  private async startBot(botId: number, name: string, token: string, logChannelId: string | null) {
    try {
      // Configure passive stealth client matching Discord Desktop Application
      const client = new Client({
        checkUpdate: false,
        readyStatus: false,
        patchVoice: false,
        syncStatus: false,
        ws: {
          properties: {
            os: "Windows",
            browser: "Discord Client",
            release_channel: "stable",
            client_version: "1.0.9168",
            os_version: "10.0.19045",
            os_arch: "x64",
            system_locale: "en-US",
            client_build_number: 338142,
            client_event_source: null
          }
        }
      });

      this.clients.set(botId, client);

      client.on('ready', () => {
        console.log(`[DiscordManager] 🛡️ [Stealth Mode] Bot #${botId} [${client.user?.tag}] listening to Member Ingress across ${client.guilds.cache.size} Guilds!`);
        this.statuses.set(botId, {
          id: botId,
          name,
          tokenMasked: `${token.slice(0, 4)}...${token.slice(-4)}`,
          logChannelId,
          status: 'online',
          tag: client.user?.tag || `${name}#0000`,
          avatarUrl: client.user?.displayAvatarURL({ dynamic: true }) || null,
          guildCount: client.guilds.cache.size,
          ping: client.ws.ping,
          lastConnected: new Date().toISOString(),
        });
      });

      // Pure Passive Gateway Member Ingress Listener (Zero REST write actions from user token)
      client.on('guildMemberAdd', async (member) => {
        await this.handleGuildMemberAdd(botId, member, logChannelId);
      });

      client.on('error', (err) => {
        console.warn(`[DiscordManager] Bot #${botId} connection warning:`, err?.message || err);
        const curr = this.statuses.get(botId);
        if (curr) {
          this.statuses.set(botId, {
            ...curr,
            status: 'error',
            error: err.message,
          });
        }
      });

      await client.login(token);
    } catch (err: any) {
      console.warn(`[DiscordManager] Bot #${botId} failed to login (Token invalid or locked by Discord):`, err?.message || err);
      const curr = this.statuses.get(botId);
      this.statuses.set(botId, {
        id: botId,
        name,
        tokenMasked: `${token.slice(0, 4)}...${token.slice(-4)}`,
        logChannelId,
        status: 'error',
        tag: null,
        avatarUrl: null,
        guildCount: 0,
        ping: 0,
        lastConnected: null,
        error: err?.message || 'Authentication failed or account challenged',
      });
    }
  }

  private async handleGuildMemberAdd(botId: number, member: any, logChannelId: string | null) {
    try {
      if (!member || !member.user || !member.guild) return;

      const user = member.user;
      const flags = user.flags ? user.flags.toArray() : [];
      
      const badges: string[] = [];
      if (flags.includes('DISCORD_EMPLOYEE') || flags.includes('STAFF')) badges.push('Discord Staff');
      if (flags.includes('PARTNERED_SERVER_OWNER') || flags.includes('PARTNER')) badges.push('Partner');
      if (flags.includes('HYPESQUAD_EVENTS') || flags.includes('HYPESQUAD')) badges.push('HypeSquad Events');
      if (flags.includes('BUGHUNTER_LEVEL_1')) badges.push('Bug Hunter');
      if (flags.includes('BUGHUNTER_LEVEL_2')) badges.push('Bug Hunter Gold');
      if (flags.includes('HOUSE_BRAVERY')) badges.push('HypeSquad Bravery');
      if (flags.includes('HOUSE_BRILLIANCE')) badges.push('HypeSquad Brilliance');
      if (flags.includes('HOUSE_BALANCE')) badges.push('HypeSquad Balance');
      if (flags.includes('EARLY_SUPPORTER') || flags.includes('PREMIUM_EARLY_SUPPORTER')) badges.push('Early Supporter');
      if (flags.includes('VERIFIED_BOT_DEVELOPER') || flags.includes('EARLY_VERIFIED_BOT_DEVELOPER')) badges.push('Early Verified Bot Developer');
      if (flags.includes('ACTIVE_DEVELOPER')) badges.push('Active Developer');
      if (user.avatar && user.avatar.startsWith('a_')) badges.push('Nitro');

      const roleNames = member.roles?.cache
        ? member.roles.cache.map((r: any) => r.name).filter((n: string) => n !== '@everyone')
        : [];

      const accountCreatedAt = user.createdAt ? user.createdAt.toISOString() : new Date().toISOString();
      const joinedAt = member.joinedAt ? member.joinedAt.toISOString() : new Date().toISOString();

      await dbClient.execute({
        sql: `INSERT INTO member_events (
          userId, username, discriminator, guildId, guildName, avatarUrl, bannerUrl,
          isBot, isSystem, pending, rolesCount, roleNames, badges,
          accountCreatedAt, joinedAt, botId, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          user.id,
          user.username,
          user.discriminator || '0',
          member.guild.id,
          member.guild.name,
          user.displayAvatarURL ? user.displayAvatarURL({ dynamic: true }) : null,
          null,
          user.bot ? 1 : 0,
          user.system ? 1 : 0,
          member.pending ? 1 : 0,
          roleNames.length,
          JSON.stringify(roleNames),
          JSON.stringify(badges),
          accountCreatedAt,
          joinedAt,
          botId,
          Date.now(),
        ],
      });

      console.log(`[DiscordManager] ⚡ Member Inflow: ${user.username} joined ${member.guild.name}`);

      // Safe Webhook Dispatch (Does NOT use user token to avoid spam detection)
      if (logChannelId && logChannelId.startsWith('https://')) {
        await sendSafeWebhook(
          logChannelId,
          `📡 **[Member Join]** \`@${user.username}\` joined **${member.guild.name}** (Badges: ${badges.join(', ') || 'None'})`
        );
      }
    } catch (err) {
      console.error('[DiscordManager] Error recording member event:', err);
    }
  }

  // Simulate Member Join Event for visual testing
  public async simulateJoinEvent(customData?: any) {
    const sampleUsernames = ['toxic085057', 'zeuhfflen', 'grdns', 'simonpetur', 'goblineater08031', 'krypton_valkyrie', 'wavey24', 'kelo11'];
    const badgesPool = [['Nitro'], ['Active Developer'], ['HypeSquad Bravery'], ['Early Supporter', 'Nitro'], []];
    const randomAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&crop=faces',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&crop=faces',
    ];

    const sampleGuilds = [
      { id: '109827364518293847', name: 'Criminality // Official' },
      { id: '109827364518293848', name: 'Cheesy Products Store' },
      { id: '109827364518293849', name: 'Softy HQ' },
      { id: '109827364518293850', name: 'Polaris Network' },
    ];

    let targetBotId: number | null = customData?.botId || null;
    if (!targetBotId && this.statuses.size > 0) {
      targetBotId = Array.from(this.statuses.keys())[0];
    }

    const selectedGuild = sampleGuilds[Math.floor(Math.random() * sampleGuilds.length)];
    const username = customData?.username || sampleUsernames[Math.floor(Math.random() * sampleUsernames.length)];
    const discriminator = customData?.discriminator || (Math.random() > 0.6 ? '0' : String(Math.floor(1000 + Math.random() * 9000)));
    const guildId = customData?.guildId || selectedGuild.id;
    const guildName = customData?.guildName || selectedGuild.name;
    const isBot = customData?.isBot ?? false;
    const badges = customData?.badges || badgesPool[Math.floor(Math.random() * badgesPool.length)];
    const avatarUrl = randomAvatars[Math.floor(Math.random() * randomAvatars.length)];
    const userId = `98${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`;

    const roles = ['@everyone', 'Verified Security'];
    const now = new Date();
    const accountCreatedAt = new Date(Date.now() - (60 + Math.floor(Math.random() * 800)) * 86400000).toISOString();

    const insertResult = await dbClient.execute({
      sql: `INSERT INTO member_events (
        userId, username, discriminator, guildId, guildName, avatarUrl, bannerUrl,
        isBot, isSystem, pending, rolesCount, roleNames, badges,
        accountCreatedAt, joinedAt, botId, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        userId,
        username,
        discriminator,
        guildId,
        guildName,
        avatarUrl,
        null,
        isBot ? 1 : 0,
        0,
        0,
        roles.length,
        JSON.stringify(roles),
        JSON.stringify(badges),
        accountCreatedAt,
        now.toISOString(),
        targetBotId,
        now.getTime(),
      ],
    });

    return {
      id: Number(insertResult.lastInsertRowid || Date.now()),
      userId,
      username,
      discriminator,
      guildId,
      guildName,
      avatarUrl,
      isBot,
      badges,
      accountCreatedAt,
      joinedAt: now.toISOString(),
      createdAt: now.getTime(),
      botId: targetBotId,
    };
  }

  public getStatuses(): BotInstanceStatus[] {
    return Array.from(this.statuses.values());
  }

  public async reloadBot(id: number) {
    const client = this.clients.get(id);
    if (client) {
      try {
        client.destroy();
      } catch (_) {}
      this.clients.delete(id);
    }
    this.statuses.delete(id);
    await this.syncBots();
  }
}

export const discordManager = new DiscordManager();
