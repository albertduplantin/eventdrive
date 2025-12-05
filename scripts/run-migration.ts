import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const sql = neon(databaseUrl);

  try {
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'migrations', 'add_invitations.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Running migration...');

    // Split by semicolons and execute each statement
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      await sql.query(statement);
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
