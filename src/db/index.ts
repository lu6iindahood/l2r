import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.js';
import path from 'path';

// Use local SQLite file
const dbPath = path.join(process.cwd(), 'selfbot.db');
const client = createClient({
  url: `file:${dbPath}`,
});

export const db = drizzle(client, { schema });
export { client };

// Initialize tables if they don't exist
export async function initDatabase() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS bot_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        token TEXT NOT NULL,
        logChannelId TEXT,
        updatedAt INTEGER
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS member_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        username TEXT NOT NULL,
        discriminator TEXT NOT NULL,
        guildId TEXT NOT NULL,
        guildName TEXT NOT NULL,
        avatarUrl TEXT,
        bannerUrl TEXT,
        isBot INTEGER NOT NULL DEFAULT 0,
        isSystem INTEGER NOT NULL DEFAULT 0,
        pending INTEGER NOT NULL DEFAULT 0,
        rolesCount INTEGER NOT NULL DEFAULT 0,
        roleNames TEXT NOT NULL DEFAULT '[]',
        badges TEXT NOT NULL DEFAULT '[]',
        accountCreatedAt TEXT NOT NULL,
        joinedAt TEXT NOT NULL,
        botId INTEGER REFERENCES bot_config(id),
        createdAt INTEGER
      );
    `);

    // Check if initial seeding is needed for preview
    const countRes = await client.execute('SELECT COUNT(*) as count FROM member_events');
    const rowCount = Number(countRes.rows[0]?.count || 0);

    const botCountRes = await client.execute('SELECT COUNT(*) as count FROM bot_config');
    const botCount = Number(botCountRes.rows[0]?.count || 0);

    if (botCount === 0) {
      await client.execute({
        sql: `INSERT INTO bot_config (name, token, logChannelId, updatedAt) VALUES (?, ?, ?, ?)`,
        args: [
          'Primary Telemetry Worker (Shadow-01)',
          'OTk2OTg4MTI4OTI4Njg4MjIw.G_SAMPLE_TOKEN_SECRET_XXXX',
          '118949827361928374',
          Date.now(),
        ],
      });
      await client.execute({
        sql: `INSERT INTO bot_config (name, token, logChannelId, updatedAt) VALUES (?, ?, ?, ?)`,
        args: [
          'Secondary Sentinel (Ghost-02)',
          'MTEyOTk4MTI4OTI4Njg4OTkw.X_SAMPLE_SENTINEL_TOKEN_YYYY',
          '118949827361928399',
          Date.now(),
        ],
      });
    }

    if (rowCount === 0) {
      console.log('Seeding initial telemetry data for dashboard analytics...');
      await seedInitialData();
    }
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
}

async function seedInitialData() {
  const sampleBadges = [
    ['Nitro', 'HypeSquad Bravery', 'Early Supporter'],
    ['Active Developer', 'HypeSquad Brilliance'],
    ['HypeSquad Balance', 'Nitro'],
    ['Bug Hunter', 'Active Developer', 'Nitro'],
    ['HypeSquad Bravery'],
    ['Nitro'],
    [],
    ['Active Developer'],
    ['HypeSquad Brilliance', 'Early Verified Bot Developer'],
    ['Server Booster', 'Nitro'],
  ];

  const guilds = [
    { id: '109827364518293847', name: 'Cyber Security Operations // RedTeam' },
    { id: '109827364518293848', name: 'DevSecOps & Threat Intel Hub' },
    { id: '109827364518293849', name: 'Elite Web3 Builders & Auditing' },
    { id: '109827364518293850', name: 'ZeroDay Research Labs' },
  ];

  const sampleUsers = [
    { username: 'krypton_valkyrie', disc: '0001', isBot: false, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces' },
    { username: 'neuro_phantom', disc: '1337', isBot: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces' },
    { username: 'matrix_sentry_v2', disc: '0', isBot: true, avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&h=128&fit=crop&crop=faces' },
    { username: 'ciphersmith', disc: '4040', isBot: false, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&crop=faces' },
    { username: 'hex_spectre', disc: '0042', isBot: false, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&crop=faces' },
    { username: 'quantum_recon', disc: '9999', isBot: false, avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=128&h=128&fit=crop&crop=faces' },
    { username: 'zero_byte', disc: '0', isBot: false, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=128&h=128&fit=crop&crop=faces' },
    { username: 'aegis_sentinel_bot', disc: '8821', isBot: true, avatar: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=128&h=128&fit=crop&crop=faces' },
    { username: 'void_walker', disc: '7721', isBot: false, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=128&h=128&fit=crop&crop=faces' },
    { username: 'kali_daemon', disc: '3310', isBot: false, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=128&h=128&fit=crop&crop=faces' },
  ];

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  // Generate 45 realistic events spread over the last 14 days
  for (let i = 0; i < 45; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const eventTime = new Date(now - daysAgo * DAY_MS - Math.floor(Math.random() * DAY_MS));
    const user = sampleUsers[i % sampleUsers.length];
    const guild = guilds[i % guilds.length];
    const badges = sampleBadges[i % sampleBadges.length];
    const roles = ['@everyone', i % 2 === 0 ? 'Member' : 'Verified Security', i % 4 === 0 ? 'Bug Hunter' : 'Pioneer'].slice(0, 1 + (i % 3));
    const accountCreatedAt = new Date(eventTime.getTime() - (30 + Math.floor(Math.random() * 1200)) * DAY_MS).toISOString();

    await client.execute({
      sql: `INSERT INTO member_events (
        userId, username, discriminator, guildId, guildName, avatarUrl, bannerUrl,
        isBot, isSystem, pending, rolesCount, roleNames, badges,
        accountCreatedAt, joinedAt, botId, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        `98${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`,
        user.username,
        user.disc,
        guild.id,
        guild.name,
        user.avatar,
        null,
        user.isBot ? 1 : 0,
        0,
        0,
        roles.length,
        JSON.stringify(roles),
        JSON.stringify(badges),
        accountCreatedAt,
        eventTime.toISOString(),
        (i % 2) + 1,
        eventTime.getTime(),
      ],
    });
  }
}
