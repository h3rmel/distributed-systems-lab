import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables from root .env
dotenv.config({ path: '../../.env' });

/**
 * Migration runner
 * Applies all pending SQL migrations from ./drizzle directory
 */
async function runMigrations(): Promise<void> {
  const connectionString = `postgresql://${process.env.DB_USER || 'dev_user'}:${process.env.DB_PASSWORD || 'dev_password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'distributed_lab'}`;

  console.log('🔄 Running database migrations...');

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: './drizzle' });

  console.log('✅ Migrations completed successfully');

  await sql.end();
  process.exit(0);
}

runMigrations().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
