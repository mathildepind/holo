import { eq, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  customers,
  harvestLogs,
  orderItems,
  products,
  salesOrders,
} from "./schema";

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

export function getInventoryAvailability(db: DB) {
  const allProducts = db.select().from(products).all();

  const harvestAgg = db
    .select({
      productId: harvestLogs.productId,
      source: harvestLogs.source,
      total: sql<number>`coalesce(sum(${harvestLogs.quantityTrays}), 0)`,
    })
    .from(harvestLogs)
    .groupBy(harvestLogs.productId, harvestLogs.source)
    .all();

  const committedAgg = db
    .select({
      productId: orderItems.productId,
      total: sql<number>`coalesce(sum(${orderItems.quantityOrdered}), 0)`,
    })
    .from(orderItems)
    .innerJoin(salesOrders, eq(salesOrders.id, orderItems.orderId))
    .where(eq(salesOrders.status, "entered"))
    .groupBy(orderItems.productId)
    .all();

  return allProducts.map((product) => {
    const freshTrays =
      harvestAgg.find((h) => h.productId === product.id && h.source === "fresh")?.total ?? 0;
    const coolerTrays =
      harvestAgg.find((h) => h.productId === product.id && h.source === "cooler")?.total ?? 0;
    const totalAvailable = freshTrays + coolerTrays;
    const totalCommitted =
      committedAgg.find((c) => c.productId === product.id)?.total ?? 0;

    return {
      product,
      freshTrays,
      coolerTrays,
      totalAvailable,
      totalCommitted,
      gap: totalAvailable - totalCommitted,
    };
  });
}

