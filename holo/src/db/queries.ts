import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { customers, products } from "./schema";

export function getCustomerById(db: BetterSQLite3Database, id: number) {
  return db.select().from(customers).where(eq(customers.id, id)).get();
}

export function getProductById(db: BetterSQLite3Database, id: number) {
  return db.select().from(products).where(eq(products.id, id)).get();
}

export function getProductBySku(db: BetterSQLite3Database, sku: string) {
  return db.select().from(products).where(eq(products.sku, sku)).get();
}
