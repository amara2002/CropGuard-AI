// test-db-local.mjs
import 'dotenv/config';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in .env');
  process.exit(1);
}

console.log('🔌 Connecting to:', connectionString.replace(/:.*@/, ':****@'));

// Local PostgreSQL – no SSL needed
const sql = postgres(connectionString, {
  connect_timeout: 10,
  max: 1,
  ssl: { rejectUnauthorized: false },
});

try {
  const result = await sql`SELECT 1 AS connected`;
  console.log('✅ DB connected successfully!', result);
  await sql.end();
  process.exit(0);
} catch (err) {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
}