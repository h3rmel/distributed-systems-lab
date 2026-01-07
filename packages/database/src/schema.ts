import { pgTable, serial, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

/**
 * Webhook events table
 * Stores all ingested webhook events from various providers
 */
export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: serial('id').primaryKey(),
    provider: varchar('provider', { length: 255 }).notNull(),
    eventId: varchar('event_id', { length: 255 }).notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    data: jsonb('data').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerIdx: index('provider_idx').on(table.provider),
    eventIdIdx: index('event_id_idx').on(table.eventId),
    timestampIdx: index('timestamp_idx').on(table.timestamp),
  }),
);
