import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const connectionString = process.env.DATABASE_URL ?? "postgres://invalid/invalid";

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export async function canConnectToDatabase(): Promise<boolean> {
  if (!hasDatabaseUrl) return false;
  try {
    await pool.query("select 1");
    return true;
  } catch {
    return false;
  }
}
