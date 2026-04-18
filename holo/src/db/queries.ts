import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { customers } from "./schema";

export function getCustomerById(db: BetterSQLite3Database, id: number) {
  return db.select().from(customers).where(eq(customers.id, id)).get();
}
