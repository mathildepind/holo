import { describe, it, expect } from "vitest";
import { createTestDb } from "./test-helpers";
import { customers, products, salesOrders, orderItems, harvestLogs } from "./schema";
import {
  getCustomerById,
  getProductById,
  getProductBySku,
  getEnrichedOrder,
  getInventoryAvailability,
} from "./queries";

describe("getCustomerById", () => {
  it("returns the customer row for a known id", () => {
    const db = createTestDb();
    db.insert(customers)
      .values({
        name: "Bay Leaf Markets",
        location: "Bay Leaf - Palo Alto",
        address: "2100 El Camino Real, Palo Alto, CA",
      })
      .run();

    const result = getCustomerById(db, 1);

    expect(result).toMatchObject({
      id: 1,
      name: "Bay Leaf Markets",
      location: "Bay Leaf - Palo Alto",
      address: "2100 El Camino Real, Palo Alto, CA",
    });
  });

  it("returns undefined for an unknown id", () => {
    const db = createTestDb();
    expect(getCustomerById(db, 999)).toBeUndefined();
  });
});

describe("getProductById / getProductBySku", () => {
  function seedSpringMix(db: ReturnType<typeof createTestDb>) {
    db.insert(products)
      .values({
        sku: "SKU-SPR-6X4",
        name: "Spring Mix",
        packSize: "6 x 4.5 oz",
        unitPrice: 18.5,
        scanPrefix: "og-9024",
      })
      .run();
  }

  it("returns the product row by id", () => {
    const db = createTestDb();
    seedSpringMix(db);

    expect(getProductById(db, 1)).toMatchObject({
      id: 1,
      sku: "SKU-SPR-6X4",
      name: "Spring Mix",
      packSize: "6 x 4.5 oz",
      unitPrice: 18.5,
      scanPrefix: "og-9024",
    });
  });

  it("returns the product row by sku", () => {
    const db = createTestDb();
    seedSpringMix(db);

    expect(getProductBySku(db, "SKU-SPR-6X4")?.name).toBe("Spring Mix");
  });

  it("rejects duplicate SKUs", () => {
    const db = createTestDb();
    seedSpringMix(db);

    expect(() => seedSpringMix(db)).toThrow();
  });

  it("returns undefined for unknown id or sku", () => {
    const db = createTestDb();
    expect(getProductById(db, 999)).toBeUndefined();
    expect(getProductBySku(db, "SKU-MISSING")).toBeUndefined();
  });
});

describe("getEnrichedOrder", () => {
  function seedOrder(db: ReturnType<typeof createTestDb>) {
    db.insert(customers)
      .values({
        name: "Bay Leaf Markets",
        location: "Bay Leaf - Palo Alto",
        address: "2100 El Camino Real, Palo Alto, CA",
      })
      .run();
    db.insert(products)
      .values([
        {
          sku: "SKU-SPR-6X4",
          name: "Spring Mix",
          packSize: "6 x 4.5 oz",
          unitPrice: 18.5,
          scanPrefix: "og-9024",
        },
        {
          sku: "SKU-ARG-6X4",
          name: "Baby Arugula",
          packSize: "6 x 4.5 oz",
          unitPrice: 19.0,
          scanPrefix: "og-9031",
        },
      ])
      .run();
    db.insert(salesOrders)
      .values({
        customerId: 1,
        poNumber: "BL-0423-001",
        requestedDelivery: "2026-04-20",
        plannedShip: "2026-04-19",
        status: "entered",
        enteredAt: "2026-04-15T08:00:00Z",
      })
      .run();
    db.insert(orderItems)
      .values([
        { orderId: 1, productId: 1, quantityOrdered: 10, unitPrice: 18.5, discount: 0 },
        { orderId: 1, productId: 2, quantityOrdered: 6, unitPrice: 19.0, discount: 5 },
      ])
      .run();
  }

  it("joins customer and line-item products onto the order", () => {
    const db = createTestDb();
    seedOrder(db);

    const order = getEnrichedOrder(db, 1);

    expect(order).toMatchObject({
      id: 1,
      poNumber: "BL-0423-001",
      status: "entered",
      customer: { name: "Bay Leaf Markets" },
    });
    expect(order?.items).toHaveLength(2);
    expect(order?.items[0]).toMatchObject({
      quantityOrdered: 10,
      product: { sku: "SKU-SPR-6X4", name: "Spring Mix" },
    });
    expect(order?.items[1]).toMatchObject({
      quantityOrdered: 6,
      discount: 5,
      product: { sku: "SKU-ARG-6X4" },
    });
  });

  it("returns undefined for an unknown order id", () => {
    const db = createTestDb();
    seedOrder(db);
    expect(getEnrichedOrder(db, 999)).toBeUndefined();
  });

  it("rejects an order_items row whose order_id has no parent", () => {
    const db = createTestDb();
    seedOrder(db);
    expect(() =>
      db
        .insert(orderItems)
        .values({ orderId: 999, productId: 1, quantityOrdered: 1, unitPrice: 1, discount: 0 })
        .run()
    ).toThrow();
  });
});

describe("getInventoryAvailability", () => {
  function seedInventory(db: ReturnType<typeof createTestDb>) {
    db.insert(customers)
      .values({ name: "Bay Leaf Markets", location: "Palo Alto", address: "—" })
      .run();
    db.insert(products)
      .values([
        { sku: "SM-645", name: "Spring Mix", packSize: "6x4.5", unitPrice: 18.5, scanPrefix: "og-9024" },
        { sku: "BR-500", name: "Baby Romaine", packSize: "6x5", unitPrice: 24, scanPrefix: "og-7201" },
        { sku: "OA-100", name: "Organic Arugula", packSize: "6x4.5", unitPrice: 21, scanPrefix: "og-8841" },
      ])
      .run();
    // Open order — should count toward committed
    db.insert(salesOrders)
      .values({
        customerId: 1,
        poNumber: "BL-OPEN",
        requestedDelivery: "2026-04-20",
        plannedShip: "2026-04-19",
        status: "entered",
        enteredAt: "2026-04-15T08:00:00Z",
      })
      .run();
    // Delivered order — must NOT count toward committed
    db.insert(salesOrders)
      .values({
        customerId: 1,
        poNumber: "BL-PAST",
        requestedDelivery: "2026-04-10",
        plannedShip: "2026-04-09",
        status: "delivered",
        enteredAt: "2026-04-05T08:00:00Z",
      })
      .run();
    db.insert(orderItems)
      .values([
        { orderId: 1, productId: 1, quantityOrdered: 48, unitPrice: 18.5, discount: 0 },
        { orderId: 1, productId: 2, quantityOrdered: 24, unitPrice: 24, discount: 0 },
        // Delivered order committed nothing to availability
        { orderId: 2, productId: 1, quantityOrdered: 100, unitPrice: 18.5, discount: 0 },
      ])
      .run();
    db.insert(harvestLogs)
      .values([
        // Spring Mix: 60 fresh + 12 cooler = 72 available, 48 committed → gap +24
        { productId: 1, harvestDate: "2026-04-15", quantityTrays: 40, source: "fresh" },
        { productId: 1, harvestDate: "2026-04-15", quantityTrays: 20, source: "fresh" },
        { productId: 1, harvestDate: "2026-04-14", quantityTrays: 12, source: "cooler" },
        // Baby Romaine: 10 fresh, 0 cooler, 24 committed → gap -14
        { productId: 2, harvestDate: "2026-04-15", quantityTrays: 10, source: "fresh" },
        // Organic Arugula: no harvest, no orders → all zeros
      ])
      .run();
  }

  it("returns one row per product with fresh/cooler split", () => {
    const db = createTestDb();
    seedInventory(db);

    const rows = getInventoryAvailability(db);

    expect(rows).toHaveLength(3);

    const springMix = rows.find((r) => r.product.sku === "SM-645")!;
    expect(springMix).toMatchObject({
      freshTrays: 60,
      coolerTrays: 12,
      totalAvailable: 72,
      totalCommitted: 48,
      gap: 24,
    });

    const babyRomaine = rows.find((r) => r.product.sku === "BR-500")!;
    expect(babyRomaine).toMatchObject({
      freshTrays: 10,
      coolerTrays: 0,
      totalAvailable: 10,
      totalCommitted: 24,
      gap: -14,
    });
  });

  it("includes products with no harvest and no open orders", () => {
    const db = createTestDb();
    seedInventory(db);

    const arugula = getInventoryAvailability(db).find((r) => r.product.sku === "OA-100")!;
    expect(arugula).toMatchObject({
      freshTrays: 0,
      coolerTrays: 0,
      totalAvailable: 0,
      totalCommitted: 0,
      gap: 0,
    });
  });

  it("only counts open orders toward committed quantities", () => {
    const db = createTestDb();
    seedInventory(db);

    // Spring Mix has 100 committed on a delivered order — must not count
    const springMix = getInventoryAvailability(db).find((r) => r.product.sku === "SM-645")!;
    expect(springMix.totalCommitted).toBe(48);
  });
});
