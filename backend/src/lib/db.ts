import { neon, types } from '@neondatabase/serverless';
import { env } from './env';

// Return DATE columns (OID 1082) as plain 'YYYY-MM-DD' strings. The default parser
// turns them into local-midnight Date objects, which shift by a day across timezones.
types.setTypeParser(1082, (value: string) => value);

/**
 * Neon Database client tag function — parameterized SQL queries.
 * Backend ONLY. Never expose your DATABASE_URL.
 *
 * Fallback connection string is used when env var is missing so that importing this
 * module never throws on cold start. When misconfigured, the app short-circuits
 * API calls with a 503 status code.
 */
const connectionString = env.databaseUrl || 'postgres://placeholder:placeholder@localhost:5432/neondb';

export const sql = neon(connectionString);
