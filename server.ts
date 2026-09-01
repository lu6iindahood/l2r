import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { client, initDatabase } from './src/db/index.js';
import { discordManager } from './src/server/discordManager.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize SQLite & Sync Bots
async function bootstrap() {
  await initDatabase();
  await discordManager.syncBots();
}
bootstrap();

// ----------------------------------------------------
// 1. GET /api/stats
// Returns analytics (total events, unique users, active guilds, top 10 badges, and joins per day for the last 14 days)
// ----------------------------------------------------
app.get('/api/stats', async (req, res) => {
  try {
    // Total events
    const totalEventsRes = await client.execute('SELECT COUNT(*) as total FROM member_events');
    const totalEvents = Number(totalEventsRes.rows[0]?.total || 0);

    // Unique users
    const uniqueUsersRes = await client.execute('SELECT COUNT(DISTINCT userId) as count FROM member_events');
    const uniqueUsers = Number(uniqueUsersRes.rows[0]?.count || 0);

    // Active guilds
    const activeGuildsRes = await client.execute('SELECT COUNT(DISTINCT guildId) as count FROM member_events');
    const activeGuilds = Number(activeGuildsRes.rows[0]?.count || 0);

    // Bot vs Real users
    const botCountRes = await client.execute('SELECT COUNT(*) as bots FROM member_events WHERE isBot = 1');
    const botCount = Number(botCountRes.rows[0]?.bots || 0);

    // Top Badges
    const allBadgesRes = await client.execute('SELECT badges FROM member_events');
    const badgeFrequency: Record<string, number> = {};

    for (const row of allBadgesRes.rows) {
      try {
        const badges: string[] = JSON.parse(String(row.badges || '[]'));
        for (const badge of badges) {
          badgeFrequency[badge] = (badgeFrequency[badge] || 0) + 1;
        }
      } catch (_) {}
    }

    const topBadges = Object.entries(badgeFrequency)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Joins per day for the last 14 days
    // In SQLite, date(createdAt / 1000, 'unixepoch') groups by YYYY-MM-DD
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const historyRes = await client.execute({
      sql: `
        SELECT 
          date(createdAt / 1000, 'unixepoch') as day,
          COUNT(*) as count,
          SUM(CASE WHEN isBot = 1 THEN 1 ELSE 0 END) as botCount
        FROM member_events
        WHERE createdAt >= ?
        GROUP BY day
        ORDER BY day ASC
      `,
      args: [fourteenDaysAgo],
    });

    // Format 14-day history ensuring all 14 days are represented
    const historyMap = new Map<string, { count: number; botCount: number }>();
    for (const row of historyRes.rows) {
      if (row.day) {
        historyMap.set(String(row.day), {
          count: Number(row.count || 0),
          botCount: Number(row.botCount || 0),
        });
      }
    }

    const dailyJoins = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().split('T')[0];
      const entry = historyMap.get(dayStr) || { count: 0, botCount: 0 };
      dailyJoins.push({
        date: dayStr,
        displayDate: `${d.getMonth() + 1}/${d.getDate()}`,
        joins: entry.count,
        bots: entry.botCount,
        humans: Math.max(0, entry.count - entry.botCount),
      });
    }

    // Guild distribution
    const guildStatsRes = await client.execute(`
      SELECT guildName, guildId, COUNT(*) as count 
      FROM member_events 
      GROUP BY guildId, guildName 
      ORDER BY count DESC 
      LIMIT 6
    `);
    const topGuilds = guildStatsRes.rows.map((r: any) => ({
      guildId: String(r.guildId),
      guildName: String(r.guildName),
      count: Number(r.count),
    }));

    res.json({
      totalEvents,
      uniqueUsers,
      activeGuilds,
      botCount,
      humanCount: Math.max(0, totalEvents - botCount),
      botPercentage: totalEvents > 0 ? ((botCount / totalEvents) * 100).toFixed(1) : '0',
      topBadges,
      dailyJoins,
      topGuilds,
    });
  } catch (err: any) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch analytics' });
  }
});

// ----------------------------------------------------
// 2. GET /api/members & DELETE /api/members (Clear all logs)
// ----------------------------------------------------
app.get('/api/members', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const search = String(req.query.search || '').trim();
    const filter = String(req.query.filter || 'all'); // 'all', 'bots', 'humans', 'nitro', 'early'
    const botId = req.query.botId && req.query.botId !== 'all' ? parseInt(String(req.query.botId), 10) : null;
    const offset = (page - 1) * limit;

    let sqlWhere = '';
    const args: any[] = [];

    const conditions: string[] = [];

    if (botId && !isNaN(botId)) {
      conditions.push('botId = ?');
      args.push(botId);
    }

    if (search) {
      conditions.push('(username LIKE ? OR guildName LIKE ? OR userId LIKE ? OR guildId LIKE ?)');
      const term = `%${search}%`;
      args.push(term, term, term, term);
    }

    if (filter === 'bots') {
      conditions.push('isBot = 1');
    } else if (filter === 'humans') {
      conditions.push('isBot = 0');
    } else if (filter === 'nitro') {
      conditions.push('badges LIKE ?');
      args.push('%Nitro%');
    } else if (filter === 'staff_early') {
      conditions.push('(badges LIKE ? OR badges LIKE ?)');
      args.push('%Early Supporter%', '%Staff%');
    }

    if (conditions.length > 0) {
      sqlWhere = 'WHERE ' + conditions.join(' AND ');
    }

    // Count total matches
    const countQuery = `SELECT COUNT(*) as count FROM member_events ${sqlWhere}`;
    const totalCountRes = await client.execute({ sql: countQuery, args });
    const total = Number(totalCountRes.rows[0]?.count || 0);

    // Fetch paginated events sorted strictly ORDER BY id DESC
    const dataQuery = `
      SELECT * FROM member_events 
      ${sqlWhere}
      ORDER BY id DESC 
      LIMIT ? OFFSET ?
    `;
    const paginatedArgs = [...args, limit, offset];
    const dataRes = await client.execute({ sql: dataQuery, args: paginatedArgs });

    const items = dataRes.rows.map((row: any) => {
      let roleNames: string[] = [];
      let badges: string[] = [];
      try {
        roleNames = JSON.parse(String(row.roleNames || '[]'));
      } catch (_) {}
      try {
        badges = JSON.parse(String(row.badges || '[]'));
      } catch (_) {}

      return {
        id: Number(row.id),
        userId: String(row.userId),
        username: String(row.username),
        discriminator: String(row.discriminator),
        guildId: String(row.guildId),
        guildName: String(row.guildName),
        avatarUrl: row.avatarUrl ? String(row.avatarUrl) : null,
        bannerUrl: row.bannerUrl ? String(row.bannerUrl) : null,
        isBot: Boolean(row.isBot),
        isSystem: Boolean(row.isSystem),
        pending: Boolean(row.pending),
        rolesCount: Number(row.rolesCount),
        roleNames,
        badges,
        accountCreatedAt: String(row.accountCreatedAt),
        joinedAt: String(row.joinedAt),
        botId: row.botId ? Number(row.botId) : null,
        createdAt: Number(row.createdAt),
      };
    });

    res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err: any) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch member logs' });
  }
});

app.delete('/api/members', async (req, res) => {
  try {
    await client.execute('DELETE FROM member_events');
    res.json({ success: true, message: 'All member events successfully cleared.' });
  } catch (err: any) {
    console.error('Error clearing member logs:', err);
    res.status(500).json({ error: err.message || 'Failed to clear logs' });
  }
});

// ----------------------------------------------------
// 3. GET /api/config & POST /api/config & DELETE / PUT
// CRUD operations to manage bot tokens
// ----------------------------------------------------
app.get('/api/config', async (req, res) => {
  try {
    const botsRes = await client.execute('SELECT * FROM bot_config ORDER BY id ASC');
    const bots = botsRes.rows.map((r: any) => {
      const token = String(r.token || '');
      const maskedToken = token.length > 8
        ? `${token.slice(0, 4)}••••••••${token.slice(-4)}`
        : '••••••••';

      return {
        id: Number(r.id),
        name: String(r.name),
        tokenMasked: maskedToken,
        tokenLength: token.length,
        logChannelId: r.logChannelId ? String(r.logChannelId) : null,
        updatedAt: r.updatedAt ? Number(r.updatedAt) : null,
      };
    });

    res.json(bots);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch bot configurations' });
  }
});

app.post('/api/config', async (req, res) => {
  try {
    const { name, token, logChannelId } = req.body;
    if (!name || !token) {
      return res.status(400).json({ error: 'Name and Discord Token are required.' });
    }

    const now = Date.now();
    const result = await client.execute({
      sql: `INSERT INTO bot_config (name, token, logChannelId, updatedAt) VALUES (?, ?, ?, ?)`,
      args: [String(name).trim(), String(token).trim(), logChannelId ? String(logChannelId).trim() : null, now],
    });

    await discordManager.syncBots();

    res.json({
      success: true,
      id: Number(result.lastInsertRowid),
      message: 'Bot token registered and instance scheduled for connection.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save bot configuration' });
  }
});

app.put('/api/config/:id', async (req, res) => {
  try {
    const botId = parseInt(req.params.id, 10);
    const { name, token, logChannelId } = req.body;

    if (token) {
      await client.execute({
        sql: `UPDATE bot_config SET name = ?, token = ?, logChannelId = ?, updatedAt = ? WHERE id = ?`,
        args: [String(name), String(token), logChannelId ? String(logChannelId).trim() : null, Date.now(), botId],
      });
    } else {
      await client.execute({
        sql: `UPDATE bot_config SET name = ?, logChannelId = ?, updatedAt = ? WHERE id = ?`,
        args: [String(name), logChannelId ? String(logChannelId).trim() : null, Date.now(), botId],
      });
    }

    await discordManager.reloadBot(botId);
    res.json({ success: true, message: 'Bot configuration updated.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update bot config' });
  }
});

app.delete('/api/config/:id', async (req, res) => {
  try {
    const botId = parseInt(req.params.id, 10);
    if (isNaN(botId)) {
      return res.status(400).json({ error: 'Invalid bot ID' });
    }

    // Explicitly disconnect & unregister from discordManager
    await discordManager.removeBot(botId);

    // Unlink member_events botId referencing this bot
    await client.execute({
      sql: 'UPDATE member_events SET botId = NULL WHERE botId = ?',
      args: [botId],
    });

    // Delete record from bot_config
    await client.execute({
      sql: 'DELETE FROM bot_config WHERE id = ?',
      args: [botId],
    });

    await discordManager.syncBots();
    res.json({ success: true, message: `Bot #${botId} decommissioned.` });
  } catch (err: any) {
    console.error('Error deleting bot config:', err);
    res.status(500).json({ error: err.message || 'Failed to delete bot config' });
  }
});

// ----------------------------------------------------
// 4. GET /api/bot/status
// Returns connection status of running bots
// ----------------------------------------------------
app.get('/api/bot/status', (req, res) => {
  const statuses = discordManager.getStatuses();
  res.json(statuses);
});

// ----------------------------------------------------
// 5. POST /api/test/generate-event
// Generates a realistic simulated member join event for instant testing & visual telemetry
// ----------------------------------------------------
app.post('/api/test/generate-event', async (req, res) => {
  try {
    const event = await discordManager.simulateJoinEvent(req.body);
    res.json({
      success: true,
      event,
      message: `Join telemetry emitted for ${event.username} in ${event.guildName}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate test event' });
  }
});

// ----------------------------------------------------
// 6. Vite Middleware & Static Serving Setup
// ----------------------------------------------------
async function startApp() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Selfbot Monitor] Server running on http://0.0.0.0:${PORT}`);
  });
}

startApp();
