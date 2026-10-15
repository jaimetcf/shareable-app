import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { schema } from "./schema";

export type Database = NodePgDatabase<typeof schema>;

let database: Database | null = null;

function databaseUrl() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set.");
  }
  return url;
}

function isNeonUrl(url: string) {
  try {
    return new URL(url).hostname.endsWith("neon.tech");
  } catch {
    return url.includes("neon.tech");
  }
}

export function getDb() {
  if (database) return database;

  const url = databaseUrl();
  if (isNeonUrl(url)) {
    database = drizzleNeon(neon(url), { schema }) as unknown as Database;
    return database;
  }

  database = drizzlePg(new Pool({ connectionString: url }), { schema });
  return database;
}
