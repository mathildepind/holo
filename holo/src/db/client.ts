import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { sql } from "drizzle-orm";
import path from "node:path";
import * as schema from "./schema";
import { customers } from "./schema";
import { seedDb } from "./seed";

type AppDb = BetterSQLite3Database<typeof schema>;

let _db: AppDb | null = null;

export function getDb(): AppDb {
  if (_db) return _db;

  const isTest = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
  const sqlite = new Database(isTest ? ":memory:" : "./holo.db");
  sqlite.pragma("foreign_keys = ON");
  _db = drizzle(sqlite, { schema });

  migrate(_db, {
    migrationsFolder: path.resolve(process.cwd(), "src/db/migrations"),
  });

  const count = _db
    .select({ c: sql<number>`count(*)` })
    .from(customers)
    .get();
  if ((count?.c ?? 0) === 0) seedDb(_db);

  return _db;
}
