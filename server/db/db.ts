import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is missing from your .env file.");
  process.exit(1);
}

const client = postgres(connectionString, {
  max: 10,
  connect_timeout: 10,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const db = drizzle(client, { schema });