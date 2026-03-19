import { randomUUID } from 'node:crypto';
import postgres from 'postgres';

const SEED_COUNT = 50;
const PROVIDERS = ['stripe', 'paypal', 'shopify', 'github', 'twilio'] as const;

interface SeedRow {
  provider: string;
  event_id: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

async function seed(): Promise<void> {
  const sql = postgres({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'dev_user',
    password: process.env.DB_PASSWORD ?? 'dev_password',
    database: process.env.DB_NAME ?? 'distributed_lab',
  });

  const rows: SeedRow[] = Array.from({ length: SEED_COUNT }, (_, i) => {
    const provider = PROVIDERS[i % PROVIDERS.length];
    return {
      provider,
      event_id: `seed-${provider}-${randomUUID()}`,
      timestamp: new Date(Date.now() - (SEED_COUNT - i) * 1000),
      data: { type: `${provider}.event`, index: i, seeded: true },
    };
  });

  const inserted = await sql`
    INSERT INTO webhook_events (provider, event_id, timestamp, data)
    SELECT * FROM ${sql(rows.map((r) => [r.provider, r.event_id, r.timestamp, JSON.stringify(r.data)]))}
    ON CONFLICT (event_id) DO NOTHING
  `.catch(async () => {
    for (const row of rows) {
      await sql`
        INSERT INTO webhook_events (provider, event_id, timestamp, data)
        VALUES (${row.provider}, ${row.event_id}, ${row.timestamp}, ${JSON.stringify(row.data)})
        ON CONFLICT (event_id) DO NOTHING
      `;
    }
    return rows;
  });

  console.log(`Seeded ${Array.isArray(inserted) ? inserted.length : rows.length} webhook events.`);
  await sql.end();
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
