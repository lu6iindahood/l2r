import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const botConfig = sqliteTable('bot_config', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  token: text('token').notNull(),
  logChannelId: text('logChannelId'),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const memberEvents = sqliteTable('member_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('userId').notNull(),
  username: text('username').notNull(),
  discriminator: text('discriminator').notNull(),
  guildId: text('guildId').notNull(),
  guildName: text('guildName').notNull(),
  avatarUrl: text('avatarUrl'),
  bannerUrl: text('bannerUrl'),
  isBot: integer('isBot', { mode: 'boolean' }).notNull().default(false),
  isSystem: integer('isSystem', { mode: 'boolean' }).notNull().default(false),
  pending: integer('pending', { mode: 'boolean' }).notNull().default(false),
  rolesCount: integer('rolesCount').notNull().default(0),
  roleNames: text('roleNames').notNull().default('[]'), // JSON string array
  badges: text('badges').notNull().default('[]'), // JSON string array
  accountCreatedAt: text('accountCreatedAt').notNull(),
  joinedAt: text('joinedAt').notNull(),
  botId: integer('botId').references(() => botConfig.id),
  createdAt: integer('createdAt', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type BotConfig = typeof botConfig.$inferSelect;
export type NewBotConfig = typeof botConfig.$inferInsert;

export type MemberEvent = typeof memberEvents.$inferSelect;
export type NewMemberEvent = typeof memberEvents.$inferInsert;
