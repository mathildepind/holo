import { and, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { DEMO_TODAY, addDaysISO } from "@/lib/demo-config";
import * as schema from "./schema";
import {
  billsOfLading,
  carriers,
  customers,
  inventoryScans,
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

const enrichedOrderWith = {
  customer: true,
  items: { with: { product: true } },
} as const;

export function getEnrichedOrder(db: DB, id: number) {
  return db.query.salesOrders
    .findFirst({
      where: eq(salesOrders.id, id),
      with: enrichedOrderWith,
    })
    .sync();
}

export function getAllEnrichedOrders(db: DB) {
  return db.query.salesOrders.findMany({ with: enrichedOrderWith }).sync();
}

// Open orders for the dashboard: deliveries scheduled for today or tomorrow
// that have not already been delivered. "Today" is DEMO_TODAY for the demo.
export function getOpenOrders(db: DB) {
  const tomorrow = addDaysISO(DEMO_TODAY, 1);
  return db.query.salesOrders
    .findMany({
      where: and(
        inArray(salesOrders.requestedDelivery, [DEMO_TODAY, tomorrow]),
        sql`${salesOrders.status} != 'delivered'`,
      ),
      with: enrichedOrderWith,
    })
    .sync();
}

// Default pack-verify moment: 05:00 UTC on DEMO_TODAY — matches the sidebar
// clock so BOL numbers stay in the same year as the seed data.
const DEMO_NOW = new Date(`${DEMO_TODAY}T05:00:00Z`);

export function createPackAndBOL(db: DB, input: CreatePackInput) {
  const when = input.now ?? DEMO_NOW;
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

    tx.update(salesOrders)
      .set({ status: "fulfilled" })
      .where(eq(salesOrders.id, input.orderId))
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

    const productRows = tx.select().from(products).all();
    const weightByProduct = new Map(productRows.map((p) => [p.id, p.caseWeightLb]));
    const totalWeight = Math.round(
      input.draftItems.reduce(
        (s, d) => s + d.quantityPacked * (weightByProduct.get(d.productId) ?? 2.5),
        0,
      ),
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

// Availability = (today's harvest scans) + (cooler: older scans not checked out).
// Committed is split today vs. tomorrow so the dashboard can show that tomorrow's
// commitments will be covered by tomorrow's harvest. Gap is today-only.
export function getInventoryAvailability(db: DB) {
  const today = DEMO_TODAY;
  const tomorrow = addDaysISO(today, 1);
  const allProducts = db.select().from(products).all();

  const freshAgg = db
    .select({
      productId: inventoryScans.productId,
      total: sql<number>`count(*)`,
    })
    .from(inventoryScans)
    .where(sql`substr(${inventoryScans.scannedAt}, 1, 10) = ${today}`)
    .groupBy(inventoryScans.productId)
    .all();

  const coolerAgg = db
    .select({
      productId: inventoryScans.productId,
      total: sql<number>`count(*)`,
    })
    .from(inventoryScans)
    .where(
      and(
        isNull(inventoryScans.checkoutAt),
        lt(sql`substr(${inventoryScans.scannedAt}, 1, 10)`, today),
      ),
    )
    .groupBy(inventoryScans.productId)
    .all();

  const committedRows = db
    .select({
      productId: orderItems.productId,
      requestedDelivery: salesOrders.requestedDelivery,
      total: sql<number>`coalesce(sum(${orderItems.quantityOrdered}), 0)`,
    })
    .from(orderItems)
    .innerJoin(salesOrders, eq(salesOrders.id, orderItems.orderId))
    .where(
      and(
        or(
          eq(salesOrders.requestedDelivery, today),
          eq(salesOrders.requestedDelivery, tomorrow),
        ),
        sql`${salesOrders.status} != 'delivered'`,
      ),
    )
    .groupBy(orderItems.productId, salesOrders.requestedDelivery)
    .all();

  return allProducts.map((product) => {
    const freshCases = freshAgg.find((r) => r.productId === product.id)?.total ?? 0;
    const coolerCases = coolerAgg.find((r) => r.productId === product.id)?.total ?? 0;
    const totalAvailable = freshCases + coolerCases;
    const committedToday =
      committedRows.find(
        (r) => r.productId === product.id && r.requestedDelivery === today,
      )?.total ?? 0;
    const committedTomorrow =
      committedRows.find(
        (r) => r.productId === product.id && r.requestedDelivery === tomorrow,
      )?.total ?? 0;

    return {
      product,
      freshCases,
      coolerCases,
      totalAvailable,
      committedToday,
      committedTomorrow,
      gap: totalAvailable - committedToday,
    };
  });
}

