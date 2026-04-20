import { describe, it, expect } from "vitest";
import { createTestDb } from "./test-helpers";
import {
  customers,
  products,
  salesOrders,
  orderItems,
  inventoryScans,
  packRecords,
  packItems,
  carriers,
  shipments,
  billsOfLading,
} from "./schema";
import { DEMO_TODAY, addDaysISO } from "@/lib/demo-config";
import {
  getCustomerById,
  getProductById,
  getProductBySku,
  getEnrichedOrder,
  getOpenOrders,
  getAllEnrichedOrders,
  getInventoryAvailability,
  getEnrichedBOLs,
  createPackAndBOL,
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
        caseWeightLb: 2.5,
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
      caseWeightLb: 2.5,
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
          caseWeightLb: 2.5,
          scanPrefix: "og-9024",
        },
        {
          sku: "SKU-ARG-6X4",
          name: "Baby Arugula",
          packSize: "6 x 4.5 oz",
          unitPrice: 19.0,
          caseWeightLb: 2.5,
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

describe("getAllEnrichedOrders / getOpenOrders", () => {
  const today = DEMO_TODAY;
  const tomorrow = addDaysISO(today, 1);
  const dayAfter = addDaysISO(today, 2);
  const yesterday = addDaysISO(today, -1);

  function seedMixedOrders(db: ReturnType<typeof createTestDb>) {
    db.insert(customers)
      .values({ name: "Bay Leaf Markets", location: "Palo Alto", address: "—" })
      .run();
    db.insert(products)
      .values({ sku: "SM-645", name: "Spring Mix", packSize: "6x4.5", unitPrice: 18.5, caseWeightLb: 2.5, scanPrefix: "og-9024" })
      .run();
    db.insert(salesOrders)
      .values([
        // Delivering today, not delivered → open
        { customerId: 1, poNumber: "BL-OPEN-TODAY", requestedDelivery: today, plannedShip: today, status: "entered", enteredAt: `${yesterday}T08:00:00Z` },
        // Delivered already → not open
        { customerId: 1, poNumber: "BL-PAST", requestedDelivery: yesterday, plannedShip: yesterday, status: "delivered", enteredAt: `${yesterday}T06:00:00Z` },
        // Delivering tomorrow, not delivered → open
        { customerId: 1, poNumber: "BL-OPEN-TMRW", requestedDelivery: tomorrow, plannedShip: tomorrow, status: "entered", enteredAt: `${today}T08:00:00Z` },
        // Too far out → not open
        { customerId: 1, poNumber: "BL-FUTURE", requestedDelivery: dayAfter, plannedShip: dayAfter, status: "entered", enteredAt: `${today}T09:00:00Z` },
      ])
      .run();
    db.insert(orderItems)
      .values([
        { orderId: 1, productId: 1, quantityOrdered: 10, unitPrice: 18.5, discount: 0 },
        { orderId: 2, productId: 1, quantityOrdered: 20, unitPrice: 18.5, discount: 0 },
        { orderId: 3, productId: 1, quantityOrdered: 15, unitPrice: 18.5, discount: 0 },
        { orderId: 4, productId: 1, quantityOrdered: 5, unitPrice: 18.5, discount: 0 },
      ])
      .run();
  }

  it("getAllEnrichedOrders returns every order with customer + items joined", () => {
    const db = createTestDb();
    seedMixedOrders(db);

    const rows = getAllEnrichedOrders(db);
    expect(rows).toHaveLength(4);
    expect(rows.every((o) => o.customer.name === "Bay Leaf Markets")).toBe(true);
    expect(rows.every((o) => o.items.length === 1 && o.items[0].product.sku === "SM-645")).toBe(true);
  });

  it("getOpenOrders returns non-delivered orders shipping today or tomorrow", () => {
    const db = createTestDb();
    seedMixedOrders(db);

    const open = getOpenOrders(db);
    expect(open.map((o) => o.poNumber).sort()).toEqual(["BL-OPEN-TMRW", "BL-OPEN-TODAY"]);
  });

  it("both helpers return [] when no orders exist", () => {
    const db = createTestDb();
    expect(getAllEnrichedOrders(db)).toEqual([]);
    expect(getOpenOrders(db)).toEqual([]);
  });
});

describe("getInventoryAvailability", () => {
  const today = DEMO_TODAY;
  const tomorrow = addDaysISO(today, 1);
  const yesterday = addDaysISO(today, -1);
  const lastWeek = addDaysISO(today, -7);

  function baseSeed(db: ReturnType<typeof createTestDb>) {
    db.insert(customers)
      .values({ name: "Bay Leaf Markets", location: "Palo Alto", address: "—" })
      .run();
    db.insert(products)
      .values([
        { sku: "SM-645", name: "Spring Mix", packSize: "6x4.5", unitPrice: 18.5, caseWeightLb: 2.5, scanPrefix: "og-9024" },
        { sku: "BR-500", name: "Baby Romaine", packSize: "6x5", unitPrice: 24, caseWeightLb: 2.75, scanPrefix: "og-7201" },
        { sku: "OA-100", name: "Organic Arugula", packSize: "6x4.5", unitPrice: 21, caseWeightLb: 2.5, scanPrefix: "og-8841" },
      ])
      .run();
  }

  function addScan(
    db: ReturnType<typeof createTestDb>,
    scanCode: string,
    productId: number,
    scannedAt: string,
    checkoutAt: string | null,
  ) {
    db.insert(inventoryScans)
      .values({
        scanCode,
        productId,
        batchCode: "TEST",
        packItemId: null,
        scannedAt,
        checkoutAt,
        isProduction: true,
        isDonation: false,
        isCheckoutOverridden: false,
        isAddedInFulfillment: false,
      })
      .run();
  }

  it("splits fresh (scanned today) from cooler (older + not checked out)", () => {
    const db = createTestDb();
    baseSeed(db);

    // Spring Mix: 3 scanned today (fresh), 2 scanned yesterday + no checkout (cooler),
    // 1 scanned last week + checked out (consumed — ignored).
    addScan(db, "SM-T-1", 1, `${today}T03:00:00Z`, null);
    addScan(db, "SM-T-2", 1, `${today}T03:01:00Z`, null);
    addScan(db, "SM-T-3", 1, `${today}T03:02:00Z`, null);
    addScan(db, "SM-Y-1", 1, `${yesterday}T03:00:00Z`, null);
    addScan(db, "SM-Y-2", 1, `${yesterday}T03:01:00Z`, null);
    addScan(db, "SM-OLD", 1, `${lastWeek}T03:00:00Z`, `${lastWeek}T09:00:00Z`);

    // Baby Romaine: 1 fresh today.
    addScan(db, "BR-T-1", 2, `${today}T03:10:00Z`, null);

    const springMix = getInventoryAvailability(db).find((r) => r.product.sku === "SM-645")!;
    expect(springMix).toMatchObject({
      freshCases: 3,
      coolerCases: 2,
      totalAvailable: 5,
    });

    const babyRomaine = getInventoryAvailability(db).find((r) => r.product.sku === "BR-500")!;
    expect(babyRomaine).toMatchObject({
      freshCases: 1,
      coolerCases: 0,
      totalAvailable: 1,
    });
  });

  it("splits committed into today vs tomorrow and excludes delivered orders", () => {
    const db = createTestDb();
    baseSeed(db);

    db.insert(salesOrders)
      .values([
        { customerId: 1, poNumber: "BL-TODAY", requestedDelivery: today, plannedShip: today, status: "entered", enteredAt: `${yesterday}T08:00:00Z` },
        { customerId: 1, poNumber: "BL-TMRW", requestedDelivery: tomorrow, plannedShip: tomorrow, status: "entered", enteredAt: `${today}T08:00:00Z` },
        { customerId: 1, poNumber: "BL-PAST", requestedDelivery: yesterday, plannedShip: yesterday, status: "delivered", enteredAt: `${lastWeek}T08:00:00Z` },
      ])
      .run();
    db.insert(orderItems)
      .values([
        { orderId: 1, productId: 1, quantityOrdered: 10, unitPrice: 18.5, discount: 0 },
        { orderId: 2, productId: 1, quantityOrdered: 4, unitPrice: 18.5, discount: 0 },
        // Delivered — must not count anywhere
        { orderId: 3, productId: 1, quantityOrdered: 100, unitPrice: 18.5, discount: 0 },
      ])
      .run();
    // Seed enough today-harvest Spring Mix to cover today's commitment.
    for (let i = 0; i < 12; i++) addScan(db, `SM-${i}`, 1, `${today}T03:${String(i).padStart(2, "0")}:00Z`, null);

    const springMix = getInventoryAvailability(db).find((r) => r.product.sku === "SM-645")!;
    expect(springMix).toMatchObject({
      freshCases: 12,
      coolerCases: 0,
      totalAvailable: 12,
      committedToday: 10,
      committedTomorrow: 4,
      gap: 2, // 12 - 10 today
    });
  });

  it("returns zeros for a product with no scans and no orders", () => {
    const db = createTestDb();
    baseSeed(db);

    const arugula = getInventoryAvailability(db).find((r) => r.product.sku === "OA-100")!;
    expect(arugula).toMatchObject({
      freshCases: 0,
      coolerCases: 0,
      totalAvailable: 0,
      committedToday: 0,
      committedTomorrow: 0,
      gap: 0,
    });
  });
});

describe("getEnrichedBOLs", () => {
  function seedFulfillment(db: ReturnType<typeof createTestDb>) {
    db.insert(customers)
      .values({ name: "Bay Leaf Markets", location: "Palo Alto", address: "—" })
      .run();
    db.insert(products)
      .values([
        { sku: "SM-645", name: "Spring Mix", packSize: "6x4.5", unitPrice: 18.5, caseWeightLb: 2.5, scanPrefix: "og-9024" },
        { sku: "BR-500", name: "Baby Romaine", packSize: "6x5", unitPrice: 24, caseWeightLb: 2.75, scanPrefix: "og-7201" },
      ])
      .run();
    db.insert(salesOrders)
      .values({
        customerId: 1,
        poNumber: "BL-0412",
        requestedDelivery: "2026-04-13",
        plannedShip: "2026-04-12",
        status: "delivered",
        enteredAt: "2026-04-11T16:00:00Z",
      })
      .run();
    db.insert(orderItems)
      .values([
        { orderId: 1, productId: 1, quantityOrdered: 48, unitPrice: 18.5, discount: 0 },
        { orderId: 1, productId: 2, quantityOrdered: 24, unitPrice: 24, discount: 0 },
      ])
      .run();
    db.insert(packRecords)
      .values({
        orderId: 1,
        status: "locked",
        packedBy: "L. Greens",
        notes: "Clean pack.",
        verifiedAt: "2026-04-12T04:45:00Z",
      })
      .run();
    db.insert(packItems)
      .values([
        { packRecordId: 1, productId: 1, quantityPacked: 48, discrepancyNote: null },
        {
          packRecordId: 1,
          productId: 2,
          quantityPacked: 22,
          discrepancyNote: "Short 2 — quality pull",
        },
      ])
      .run();
    db.insert(carriers).values({ name: "Hippo Truck", type: "internal" }).run();
    db.insert(shipments)
      .values({
        carrierId: 1,
        shipDate: "2026-04-12",
        status: "delivered",
        departedAt: "2026-04-12T06:00:00Z",
        deliveredAt: "2026-04-13T09:30:00Z",
      })
      .run();
    db.insert(billsOfLading)
      .values({
        bolNumber: "BOL-2026-0001",
        packRecordId: 1,
        shipmentId: 1,
        palletCount: 4,
        totalWeight: 1240,
        tempRequirements: "34-38F",
        generatedBy: "Roman E.",
        generatedAt: "2026-04-12T05:10:00Z",
      })
      .run();
  }

  it("returns an empty array when no BOLs exist", () => {
    const db = createTestDb();
    expect(getEnrichedBOLs(db)).toEqual([]);
  });

  it("nests packRecord (with order + items) and shipment (with carrier)", () => {
    const db = createTestDb();
    seedFulfillment(db);

    const bols = getEnrichedBOLs(db);

    expect(bols).toHaveLength(1);
    const bol = bols[0];

    expect(bol).toMatchObject({
      bolNumber: "BOL-2026-0001",
      palletCount: 4,
      totalWeight: 1240,
      generatedBy: "Roman E.",
    });

    expect(bol.packRecord).toMatchObject({
      status: "locked",
      packedBy: "L. Greens",
      order: {
        poNumber: "BL-0412",
        customer: { name: "Bay Leaf Markets" },
      },
    });
    expect(bol.packRecord.order.items).toHaveLength(2);
    expect(bol.packRecord.items).toHaveLength(2);
    expect(bol.packRecord.items[0]).toMatchObject({
      quantityPacked: 48,
      discrepancyNote: null,
      product: { sku: "SM-645" },
    });
    expect(bol.packRecord.items[1]).toMatchObject({
      quantityPacked: 22,
      discrepancyNote: "Short 2 — quality pull",
      product: { sku: "BR-500" },
    });

    expect(bol.shipment).toMatchObject({
      shipDate: "2026-04-12",
      status: "delivered",
      carrier: { name: "Hippo Truck", type: "internal" },
    });
  });

  it("rejects a BOL with no parent pack record", () => {
    const db = createTestDb();
    seedFulfillment(db);

    expect(() =>
      db
        .insert(billsOfLading)
        .values({
          bolNumber: "BOL-ORPHAN",
          packRecordId: 999,
          shipmentId: 1,
          palletCount: 1,
          totalWeight: 100,
          tempRequirements: "—",
          generatedBy: "—",
          generatedAt: "2026-04-12T00:00:00Z",
        })
        .run()
    ).toThrow();
  });
});

describe("createPackAndBOL", () => {
  function seedOpenOrder(db: ReturnType<typeof createTestDb>) {
    db.insert(customers)
      .values({ name: "Bay Leaf Markets", location: "Palo Alto", address: "—" })
      .run();
    db.insert(products)
      .values([
        { sku: "SM-645", name: "Spring Mix", packSize: "6x4.5", unitPrice: 18.5, caseWeightLb: 2.5, scanPrefix: "og-9024" },
        { sku: "BR-500", name: "Baby Romaine", packSize: "6x5", unitPrice: 24, caseWeightLb: 2.75, scanPrefix: "og-7201" },
      ])
      .run();
    db.insert(salesOrders)
      .values({
        customerId: 1,
        poNumber: "BL-0418",
        requestedDelivery: "2026-04-19",
        plannedShip: "2026-04-18",
        status: "entered",
        enteredAt: "2026-04-17T08:00:00Z",
      })
      .run();
    db.insert(orderItems)
      .values([
        { orderId: 1, productId: 1, quantityOrdered: 48, unitPrice: 18.5, discount: 0 },
        { orderId: 1, productId: 2, quantityOrdered: 24, unitPrice: 24, discount: 0 },
      ])
      .run();
  }

  const frozenNow = new Date("2026-04-18T05:00:00Z");

  it("inserts pack record, pack items, shipment, carrier, and BOL atomically", () => {
    const db = createTestDb();
    seedOpenOrder(db);

    const result = createPackAndBOL(db, {
      orderId: 1,
      draftItems: [
        { productId: 1, quantityPacked: 48, discrepancyNote: null },
        { productId: 2, quantityPacked: 22, discrepancyNote: "Short 2 — quality pull" },
      ],
      packNotes: "Clean pack.",
      now: frozenNow,
    });

    expect(result.bolNumber).toMatch(/^BOL-2026-\d{4}$/);

    const [bol] = getEnrichedBOLs(db);
    expect(bol.id).toBe(result.bolId);
    expect(bol.generatedAt).toBe(frozenNow.toISOString());
    expect(bol.packRecord).toMatchObject({
      status: "locked",
      notes: "Clean pack.",
      verifiedAt: frozenNow.toISOString(),
    });
    expect(bol.packRecord.items).toHaveLength(2);
    expect(bol.packRecord.items[0]).toMatchObject({
      quantityPacked: 48,
      discrepancyNote: null,
    });
    expect(bol.packRecord.items[1]).toMatchObject({
      quantityPacked: 22,
      discrepancyNote: "Short 2 — quality pull",
    });
    expect(bol.shipment).toMatchObject({
      status: "scheduled",
      shipDate: "2026-04-18",
      carrier: { name: "Hippo Truck", type: "internal" },
    });
  });

  it("reuses the existing Hippo Truck carrier across multiple runs", () => {
    const db = createTestDb();
    seedOpenOrder(db);

    createPackAndBOL(db, {
      orderId: 1,
      draftItems: [{ productId: 1, quantityPacked: 48, discrepancyNote: null }],
      packNotes: "",
      now: frozenNow,
    });

    // Add a second open order
    db.insert(salesOrders)
      .values({
        customerId: 1,
        poNumber: "BL-0419",
        requestedDelivery: "2026-04-20",
        plannedShip: "2026-04-19",
        status: "entered",
        enteredAt: "2026-04-18T08:00:00Z",
      })
      .run();
    db.insert(orderItems)
      .values({ orderId: 2, productId: 1, quantityOrdered: 12, unitPrice: 18.5, discount: 0 })
      .run();

    createPackAndBOL(db, {
      orderId: 2,
      draftItems: [{ productId: 1, quantityPacked: 12, discrepancyNote: null }],
      packNotes: "",
      now: frozenNow,
    });

    const allCarriers = db.select().from(carriers).all();
    expect(allCarriers).toHaveLength(1);
    expect(getEnrichedBOLs(db)).toHaveLength(2);
  });

  it("increments the BOL sequence number per run", () => {
    const db = createTestDb();
    seedOpenOrder(db);

    const first = createPackAndBOL(db, {
      orderId: 1,
      draftItems: [{ productId: 1, quantityPacked: 48, discrepancyNote: null }],
      packNotes: "",
      now: frozenNow,
    });

    db.insert(salesOrders)
      .values({
        customerId: 1,
        poNumber: "BL-0419",
        requestedDelivery: "2026-04-20",
        plannedShip: "2026-04-19",
        status: "entered",
        enteredAt: "2026-04-18T08:00:00Z",
      })
      .run();
    db.insert(orderItems)
      .values({ orderId: 2, productId: 1, quantityOrdered: 12, unitPrice: 18.5, discount: 0 })
      .run();

    const second = createPackAndBOL(db, {
      orderId: 2,
      draftItems: [{ productId: 1, quantityPacked: 12, discrepancyNote: null }],
      packNotes: "",
      now: frozenNow,
    });

    expect(second.bolNumber).not.toBe(first.bolNumber);
  });

  it("rolls back every insert when the order id does not exist", () => {
    const db = createTestDb();
    seedOpenOrder(db);

    expect(() =>
      createPackAndBOL(db, {
        orderId: 999,
        draftItems: [{ productId: 1, quantityPacked: 1, discrepancyNote: null }],
        packNotes: "",
        now: frozenNow,
      })
    ).toThrow();

    expect(db.select().from(packRecords).all()).toHaveLength(0);
    expect(db.select().from(packItems).all()).toHaveLength(0);
    expect(db.select().from(shipments).all()).toHaveLength(0);
    expect(db.select().from(billsOfLading).all()).toHaveLength(0);
    expect(db.select().from(carriers).all()).toHaveLength(0);
  });
});
