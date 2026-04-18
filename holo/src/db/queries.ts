import { eq, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import {
  billsOfLading,
  carriers,
  customers,
  harvestLogs,
  orderItems,
  packItems,
  packRecords,
  products,
  salesOrders,
  shipments,
} from "./schema";

export type DraftPackItem = {
  productId: number;
  quantityPacked: number;
  discrepancyNote: string | null;
};

export type CreatePackInput = {
  orderId: number;
  draftItems: DraftPackItem[];
  packNotes: string;
  packedBy?: string;
  now?: Date;
};

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

export function createPackAndBOL(db: DB, input: CreatePackInput) {
  const when = input.now ?? new Date();
  const nowIso = when.toISOString();
  const packedBy = input.packedBy ?? "L. Greens";

  return db.transaction((tx) => {
    const order = tx
      .select()
      .from(salesOrders)
      .where(eq(salesOrders.id, input.orderId))
      .get();
    if (!order) throw new Error(`Order ${input.orderId} not found`);

    const inserted = tx
      .insert(packRecords)
      .values({
        orderId: input.orderId,
        status: "locked",
        packedBy,
        notes: input.packNotes,
        verifiedAt: nowIso,
      })
      .returning({ id: packRecords.id })
      .get();
    const packRecordId = inserted.id;

    tx.insert(packItems)
      .values(
        input.draftItems.map((d) => ({
          packRecordId,
          productId: d.productId,
          quantityPacked: d.quantityPacked,
          discrepancyNote: d.discrepancyNote,
        }))
      )
      .run();

    let hippoTruck = tx
      .select()
      .from(carriers)
      .where(eq(carriers.name, "Hippo Truck"))
      .get();
    if (!hippoTruck) {
      hippoTruck = tx
        .insert(carriers)
        .values({ name: "Hippo Truck", type: "internal" })
        .returning()
        .get();
    }

    const shipment = tx
      .insert(shipments)
      .values({
        carrierId: hippoTruck.id,
        shipDate: order.plannedShip,
        status: "scheduled",
        departedAt: null,
        deliveredAt: null,
      })
      .returning({ id: shipments.id })
      .get();
    const shipmentId = shipment.id;

    const countRow = tx
      .select({ c: sql<number>`count(*)` })
      .from(billsOfLading)
      .get();
    const seq = (countRow?.c ?? 0) + 1;
    const year = when.getUTCFullYear();
    const bolNumber = `BOL-${year}-${String(seq).padStart(4, "0")}`;

    const totalWeight = Math.round(
      input.draftItems.reduce((s, d) => s + d.quantityPacked * 2.5, 0)
    );
    const palletCount = Math.max(1, Math.ceil(totalWeight / 400));

    const bol = tx
      .insert(billsOfLading)
      .values({
        bolNumber,
        packRecordId,
        shipmentId,
        palletCount,
        totalWeight,
        tempRequirements: "34-38\u00B0F",
        generatedBy: packedBy,
        generatedAt: nowIso,
      })
      .returning({ id: billsOfLading.id })
      .get();

    return { bolId: bol.id, packRecordId, shipmentId, bolNumber };
  });
}

export function getEnrichedBOLs(db: DB) {
  return db.query.billsOfLading
    .findMany({
      with: {
        packRecord: {
          with: {
            order: {
              with: {
                customer: true,
                items: { with: { product: true } },
              },
            },
            items: { with: { product: true } },
          },
        },
        shipment: { with: { carrier: true } },
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

