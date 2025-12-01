import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function checkEnum() {
  try {
    // Check transport_type enum values
    const result = await sql`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = 'transport_type'::regtype
      ORDER BY enumsortorder
    `;

    console.log('Current transport_type enum values in database:');
    result.forEach(row => console.log(`  - ${row.enumlabel}`));

    process.exit(0);
  } catch (error) {
    console.error('Error checking enum:', error);
    process.exit(1);
  }
}

checkEnum();
