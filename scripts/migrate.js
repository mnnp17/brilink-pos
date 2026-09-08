const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read env variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
let databaseUrl = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('DATABASE_URL=')) {
      databaseUrl = line.split('=')[1].trim();
      // Remove any surrounding quotes
      if (databaseUrl.startsWith('"') && databaseUrl.endsWith('"')) {
        databaseUrl = databaseUrl.slice(1, -1);
      }
      if (databaseUrl.startsWith("'") && databaseUrl.endsWith("'")) {
        databaseUrl = databaseUrl.slice(1, -1);
      }
    }
  }
} catch (e) {
  console.error('Failed to read .env.local file:', e.message);
  process.exit(1);
}

if (!databaseUrl) {
  console.error('DATABASE_URL is missing in .env.local');
  process.exit(1);
}

// Special case: Supabase connection pooling URLs might have percent-encoded passwords.
// pg Client accepts standard postgres connection strings.

console.log('Connecting to database...');
const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false // Required for Supabase connections
  }
});

async function runMigrations() {
  try {
    await client.connect();
    console.log('Connected to Supabase database.');

    // 1. Create migration history table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public._migrations_history (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Read migration files from supabase/migrations
    const migrationsDir = path.join(__dirname, '../supabase/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.error('Migrations directory does not exist:', migrationsDir);
      process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort so they run in order

    // 3. Get applied migrations
    const { rows } = await client.query('SELECT migration_name FROM public._migrations_history');
    const appliedMigrations = new Set(rows.map(row => row.migration_name));

    // Check if the database is already initialized (e.g., users table exists)
    const { rows: tableCheck } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    const isDbInitialized = tableCheck[0].exists;

    if (isDbInitialized && appliedMigrations.size === 0) {
      console.log('Database seems already initialized with tables. Marking existing migrations as applied...');
      // We will mark all migrations before the new grant_permissions migration as applied
      for (const file of files) {
        if (file !== '20260820000002_grant_permissions.sql') {
          await client.query(
            'INSERT INTO public._migrations_history (migration_name) VALUES ($1) ON CONFLICT DO NOTHING',
            [file]
          );
          appliedMigrations.add(file);
          console.log(`Marked as already applied: ${file}`);
        }
      }
    }

    console.log(`Found ${files.length} migration files. ${appliedMigrations.size} already applied.`);

    // 4. Apply pending migrations
    for (const file of files) {
      if (appliedMigrations.has(file)) {
        console.log(`Skipping applied migration: ${file}`);
        continue;
      }

      console.log(`\nApplying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      // Begin transaction
      await client.query('BEGIN');
      try {
        // Run SQL content
        await client.query(sqlContent);
        
        // Record in history
        await client.query(
          'INSERT INTO public._migrations_history (migration_name) VALUES ($1)',
          [file]
        );
        
        await client.query('COMMIT');
        console.log(`Successfully applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Failed to apply migration ${file}:`, err.message);
        throw err; // Stop executing further migrations
      }
    }

    console.log('\nAll migrations are up to date!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
