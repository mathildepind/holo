import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { customers, products, salesOrders } from "./schema";

export type DB = BetterSQLite3Database<typeof schema>;

export function getCustomerById(db: DB, id: number) {
  return db.select().from(customers).where(eq(customers.id, id)).get();
}

export function getProductById(db: DB, id: number) {
  return db.select().from(products).where(eq(products.id, id)).get();
}

export function getProductBySku(db: DB, sku: string) {
  return db.select().from(products).where(eq(products.sku, sku)).get();
}

export function getEnrichedOrder(db: DB, id: number) {
  return db.query.salesOrders
    .findFirst({
      where: eq(salesOrders.id, id),
      with: {
        customer: true,
        items: {
          with: { product: true },
        },
      },
    })
    .sync();
}
