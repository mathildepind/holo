import type {
  Customer, Product, SalesOrder, OrderItem,
  InventoryScan, PackRecord, PackItem, Carrier, Shipment, BillOfLading,
  EnrichedOrder, EnrichedPackRecord, EnrichedBOL, InventoryAvailability,
} from "./types";

// Simulated "today" for the demo — anchored to the morning of 2025-03-10.
// All seed dates match the case-study sample CSVs verbatim (no shift).
// At this moment: orders 1001-1003 are delivered, 1004 is freshly packed
// (ships in a few hours), 1005 is open and awaits tomorrow's harvest.
// Orders 1006-1010 from the CSV are excluded because their entered_timestamp
// is after DEMO_TODAY — they don't exist yet in this snapshot.
export const DEMO_TODAY = "2025-03-10";

export const customers: Customer[] = [
  { id: 1, name: "Bay Leaf Markets", location: "Bay Leaf - Palo Alto", address: "340 University Ave, Palo Alto, CA 94301" },
  { id: 2, name: "Coastal Harvest Co-op", location: "Coastal Co-op - Menlo Park", address: "1100 El Camino Real, Menlo Park, CA 94025" },
  { id: 3, name: "Golden Gate Provisions", location: "GG Provisions - South SF", address: "488 Grand Ave, South San Francisco, CA 94080" },
];

export const products: Product[] = [
  { id: 1, sku: "SM-645", name: "Spring Mix", packSize: "6 × 4.5 oz", unitPrice: 18.5, caseWeightLb: 2.5, scanPrefix: "og-9024" },
  { id: 2, sku: "BR-500", name: "Baby Romaine", packSize: "6 × 5 oz", unitPrice: 24.0, caseWeightLb: 2.75, scanPrefix: "cv-1912" },
  { id: 3, sku: "CL-410", name: "Crispy Leaf", packSize: "6 × 4.5 oz", unitPrice: 22.5, caseWeightLb: 2.5, scanPrefix: "cv-1905" },
  { id: 4, sku: "OA-100", name: "Organic Arugula", packSize: "6 × 4.5 oz", unitPrice: 21.0, caseWeightLb: 2.5, scanPrefix: "og-1974" },
  { id: 5, sku: "BK-200", name: "Organic Baby Kale", packSize: "6 × 4.5 oz", unitPrice: 19.75, caseWeightLb: 2.5, scanPrefix: "og-1981" },
  { id: 6, sku: "OS-300", name: "Organic Spinach", packSize: "6 × 4.5 oz", unitPrice: 20.0, caseWeightLb: 2.5, scanPrefix: "og-1936" },
  { id: 7, sku: "TG-150", name: "Tender Greens", packSize: "6 × 4.5 oz", unitPrice: 19.0, caseWeightLb: 2.5, scanPrefix: "cv-1943" },
];

// Seeded from `customer_orders.csv`. Status is derived from which timestamp
// column has fired by DEMO_TODAY (early morning 2025-03-10): delivered →
// delivered, released → released, fulfilled → fulfilled, otherwise entered.
// Order 1004 has fulfilled_timestamp = 03-10T03:20Z (done) but its
// released_timestamp = 03-10T08:15Z has not yet fired at this sim moment.
export const salesOrders: SalesOrder[] = [
  { id: 1001, customerId: 1, poNumber: "BLM-250303", requestedDelivery: "2025-03-03", plannedShip: "2025-03-03", status: "delivered", enteredAt: "2025-02-28T18:00:00Z" },
  { id: 1002, customerId: 2, poNumber: "CHC-250304", requestedDelivery: "2025-03-04", plannedShip: "2025-03-04", status: "delivered", enteredAt: "2025-03-01T20:00:00Z" },
  { id: 1003, customerId: 3, poNumber: "GGP-250306", requestedDelivery: "2025-03-06", plannedShip: "2025-03-06", status: "delivered", enteredAt: "2025-03-03T16:00:00Z" },
  { id: 1004, customerId: 1, poNumber: "BLM-250310", requestedDelivery: "2025-03-10", plannedShip: "2025-03-10", status: "fulfilled", enteredAt: "2025-03-07T17:30:00Z" },
  { id: 1005, customerId: 2, poNumber: "CHC-250311", requestedDelivery: "2025-03-11", plannedShip: "2025-03-11", status: "entered", enteredAt: "2025-03-08T19:00:00Z" },
];

// Seeded from `customer_order_items.csv`. productId is resolved from the
// sku_description field in the CSV.
export const orderItems: OrderItem[] = [
  // Order 1001 — Bay Leaf (delivered 2025-03-03)
  { id: 5001, orderId: 1001, productId: 1, quantityOrdered: 4, unitPrice: 13, discount: 0 }, // Spring Mix
  { id: 5002, orderId: 1001, productId: 2, quantityOrdered: 3, unitPrice: 14, discount: 0 }, // Baby Romaine
  { id: 5003, orderId: 1001, productId: 7, quantityOrdered: 2, unitPrice: 13, discount: 0 }, // Tender Greens
  // Order 1002 — Coastal Harvest Co-op (delivered 2025-03-04)
  { id: 5004, orderId: 1002, productId: 4, quantityOrdered: 3, unitPrice: 15, discount: 0 }, // Organic Arugula
  { id: 5005, orderId: 1002, productId: 5, quantityOrdered: 2, unitPrice: 15, discount: 0 }, // Organic Baby Kale
  // Order 1003 — Golden Gate Provisions (delivered 2025-03-06)
  { id: 5006, orderId: 1003, productId: 1, quantityOrdered: 6, unitPrice: 13, discount: 0 }, // Spring Mix
  { id: 5007, orderId: 1003, productId: 2, quantityOrdered: 3, unitPrice: 14, discount: 0 }, // Baby Romaine
  // Order 1004 — Bay Leaf (ships today)
  { id: 5008, orderId: 1004, productId: 1, quantityOrdered: 4, unitPrice: 13, discount: 0 }, // Spring Mix
  { id: 5009, orderId: 1004, productId: 3, quantityOrdered: 3, unitPrice: 13, discount: 0 }, // Crispy Leaf
  { id: 5010, orderId: 1004, productId: 7, quantityOrdered: 2, unitPrice: 13, discount: 0 }, // Tender Greens
  // Order 1005 — Coastal Harvest Co-op (ships tomorrow)
  { id: 5011, orderId: 1005, productId: 4, quantityOrdered: 4, unitPrice: 15, discount: 0 }, // Organic Arugula
  { id: 5012, orderId: 1005, productId: 6, quantityOrdered: 3, unitPrice: 15, discount: 0 }, // Organic Spinach
];

// Seeded from `inventory_scans.csv`. Only scans for orders entered by
// DEMO_TODAY (2025-03-10) are included — rows for orders 1005-1007 from
// the CSV would be dated in the future relative to this snapshot.
// Product id is resolved from the scan prefix:
//   og-9024 → Spring Mix (1)         cv-1912 → Baby Romaine (2)
//   cv-1905 → Crispy Leaf (3)        og-1974 → Organic Arugula (4)
//   og-1981 → Organic Baby Kale (5)  og-1936 → Organic Spinach (6)
//   cv-1943 → Tender Greens (7)
function scan(
  id: number, scanCode: string, productId: number,
  scannedAt: string, checkoutAt: string | null, customerOrderId: number | null,
  flags: { overridden?: boolean; addedInFulfillment?: boolean } = {},
): InventoryScan {
  return {
    id, scanCode, productId, scannedAt, checkoutAt, customerOrderId,
    isProduction: true, isDonation: false,
    isCheckoutOverridden: flags.overridden ?? false,
    isAddedInFulfillment: flags.addedInFulfillment ?? false,
  };
}

export const inventoryScans: InventoryScan[] = [
  // Order 1001 — harvested 2025-03-03, checked out same day 09:05Z
  scan(801, "og-9024-25A09-0001", 1, "2025-03-03T03:46:00Z", "2025-03-03T09:05:00Z", 1001),
  scan(802, "og-9024-25A09-0002", 1, "2025-03-03T03:46:30Z", "2025-03-03T09:05:00Z", 1001),
  scan(803, "og-9024-25A09-0003", 1, "2025-03-03T03:47:00Z", "2025-03-03T09:05:00Z", 1001),
  scan(804, "og-9024-25A09-0004", 1, "2025-03-03T03:47:30Z", "2025-03-03T09:05:00Z", 1001),
  scan(805, "cv-1912-25A09-0001", 2, "2025-03-03T03:50:00Z", "2025-03-03T09:05:00Z", 1001),
  scan(806, "cv-1912-25A09-0002", 2, "2025-03-03T03:50:30Z", "2025-03-03T09:05:00Z", 1001),
  scan(807, "cv-1912-25A09-0003", 2, "2025-03-03T03:51:00Z", "2025-03-03T09:05:00Z", 1001),
  scan(808, "cv-1943-25A09-0001", 7, "2025-03-03T03:53:00Z", "2025-03-03T09:05:00Z", 1001),
  scan(809, "cv-1943-25A09-0002", 7, "2025-03-03T03:53:30Z", "2025-03-03T09:05:00Z", 1001),
  // Order 1002 — harvested 2025-03-04, checked out same day 09:30Z
  scan(810, "og-1974-25A09-0001", 4, "2025-03-04T04:11:00Z", "2025-03-04T09:30:00Z", 1002),
  scan(811, "og-1974-25A09-0002", 4, "2025-03-04T04:11:30Z", "2025-03-04T09:30:00Z", 1002),
  scan(812, "og-1974-25A09-0003", 4, "2025-03-04T04:12:00Z", "2025-03-04T09:30:00Z", 1002),
  scan(813, "og-1981-25A09-0001", 5, "2025-03-04T04:14:00Z", "2025-03-04T09:30:00Z", 1002),
  scan(814, "og-1981-25A09-0002", 5, "2025-03-04T04:14:30Z", "2025-03-04T09:30:00Z", 1002),
  // Order 1003 — harvested 2025-03-06, checked out same day 08:15Z
  scan(815, "og-9024-25A09-0005", 1, "2025-03-06T02:56:00Z", "2025-03-06T08:15:00Z", 1003),
  scan(816, "og-9024-25A09-0006", 1, "2025-03-06T02:56:30Z", "2025-03-06T08:15:00Z", 1003),
  scan(817, "og-9024-25A09-0007", 1, "2025-03-06T02:57:00Z", "2025-03-06T08:15:00Z", 1003),
  scan(818, "og-9024-25A09-0008", 1, "2025-03-06T02:57:30Z", "2025-03-06T08:15:00Z", 1003),
  scan(819, "og-9024-25A09-0009", 1, "2025-03-06T02:58:00Z", "2025-03-06T08:15:00Z", 1003),
  scan(820, "cv-1912-25A09-0004", 2, "2025-03-06T03:00:00Z", "2025-03-06T08:15:00Z", 1003),
  scan(821, "cv-1912-25A09-0005", 2, "2025-03-06T03:00:30Z", "2025-03-06T08:15:00Z", 1003),
  scan(822, "cv-1912-25A09-0006", 2, "2025-03-06T03:01:00Z", "2025-03-06T08:15:00Z", 1003),
  // Order 1004 — harvested 2025-03-10 (today), scheduled checkout 08:30Z
  scan(823, "og-9024-25B09-0001", 1, "2025-03-10T03:21:00Z", "2025-03-10T08:30:00Z", 1004),
  scan(824, "og-9024-25B09-0002", 1, "2025-03-10T03:21:30Z", "2025-03-10T08:30:00Z", 1004),
  scan(825, "og-9024-25B09-0003", 1, "2025-03-10T03:22:00Z", "2025-03-10T08:30:00Z", 1004),
  scan(826, "og-9024-25B09-0004", 1, "2025-03-10T03:22:30Z", "2025-03-10T08:30:00Z", 1004),
  scan(827, "cv-1905-25A09-0001", 3, "2025-03-10T03:24:00Z", "2025-03-10T08:30:00Z", 1004),
  scan(828, "cv-1905-25A09-0002", 3, "2025-03-10T03:24:30Z", "2025-03-10T08:30:00Z", 1004),
  scan(829, "cv-1905-25A09-0003", 3, "2025-03-10T03:25:00Z", "2025-03-10T08:30:00Z", 1004),
  scan(830, "cv-1943-25A09-0003", 7, "2025-03-10T03:27:00Z", "2025-03-10T08:30:00Z", 1004),
  scan(831, "cv-1943-25A09-0004", 7, "2025-03-10T03:27:30Z", "2025-03-10T08:30:00Z", 1004),
];

export const carriers: Carrier[] = [
  { id: 1, name: "Hippo Truck", type: "internal" },
  { id: 2, name: "FreshRoute Logistics", type: "external" },
];

// Historical shipments for the three delivered orders (1001-1003). All
// moved on Hippo Truck per the CSV. Timestamps come from the
// released_timestamp / delivered_timestamp columns.
export const shipments: Shipment[] = [
  { id: 1, carrierId: 1, shipDate: "2025-03-03", status: "delivered", departedAt: "2025-03-03T08:30:00Z", deliveredAt: "2025-03-03T11:15:00Z" },
  { id: 2, carrierId: 1, shipDate: "2025-03-04", status: "delivered", departedAt: "2025-03-04T09:00:00Z", deliveredAt: "2025-03-04T13:45:00Z" },
  { id: 3, carrierId: 1, shipDate: "2025-03-06", status: "delivered", departedAt: "2025-03-06T07:45:00Z", deliveredAt: "2025-03-06T10:30:00Z" },
];

// Pack records for orders 1001-1003. verifiedAt is fulfilled_timestamp.
export const packRecords: PackRecord[] = [
  { id: 1, orderId: 1001, status: "locked", packedBy: "L. Greens", notes: "Clean pack.", verifiedAt: "2025-03-03T03:45:00Z" },
  { id: 2, orderId: 1002, status: "locked", packedBy: "L. Greens", notes: "Clean pack — arugula and baby kale in great shape.", verifiedAt: "2025-03-04T04:10:00Z" },
  { id: 3, orderId: 1003, status: "locked", packedBy: "L. Greens", notes: "Clean pack.", verifiedAt: "2025-03-06T02:55:00Z" },
];

// Packed quantities match the CSV order_items exactly — no discrepancies.
export const packItems: PackItem[] = [
  // Pack Record 1 — Order 1001
  { id: 1, packRecordId: 1, productId: 1, quantityPacked: 4, discrepancyNote: null },
  { id: 2, packRecordId: 1, productId: 2, quantityPacked: 3, discrepancyNote: null },
  { id: 3, packRecordId: 1, productId: 7, quantityPacked: 2, discrepancyNote: null },
  // Pack Record 2 — Order 1002
  { id: 4, packRecordId: 2, productId: 4, quantityPacked: 3, discrepancyNote: null },
  { id: 5, packRecordId: 2, productId: 5, quantityPacked: 2, discrepancyNote: null },
  // Pack Record 3 — Order 1003
  { id: 6, packRecordId: 3, productId: 1, quantityPacked: 6, discrepancyNote: null },
  { id: 7, packRecordId: 3, productId: 2, quantityPacked: 3, discrepancyNote: null },
];

// Weights derived from quantityPacked × caseWeightLb:
//   1001: 4×2.5 + 3×2.75 + 2×2.5 = 23.25 → 23 lb, 1 pallet
//   1002: 3×2.5 + 2×2.5         = 12.5  → 13 lb, 1 pallet
//   1003: 6×2.5 + 3×2.75         = 23.25 → 23 lb, 1 pallet
// BOL sequence continues where the new-pack generator picks up at 0043.
export const billsOfLading: BillOfLading[] = [
  { id: 1, bolNumber: "BOL-2025-0040", packRecordId: 1, shipmentId: 1, palletCount: 1, totalWeight: 23, tempRequirements: "34–38°F", generatedBy: "Roman E.", generatedAt: "2025-03-03T04:00:00Z" },
  { id: 2, bolNumber: "BOL-2025-0041", packRecordId: 2, shipmentId: 2, palletCount: 1, totalWeight: 13, tempRequirements: "34–38°F", generatedBy: "Roman E.", generatedAt: "2025-03-04T04:30:00Z" },
  { id: 3, bolNumber: "BOL-2025-0042", packRecordId: 3, shipmentId: 3, palletCount: 1, totalWeight: 23, tempRequirements: "34–38°F", generatedBy: "Roman E.", generatedAt: "2025-03-06T03:15:00Z" },
];

// ── Enriched helpers ───────────────────────────────────────────────────────────

export function getEnrichedOrder(orderId: number): EnrichedOrder | undefined {
  const order = salesOrders.find((o) => o.id === orderId);
  if (!order) return undefined;
  const customer = customers.find((c) => c.id === order.customerId)!;
  const items = orderItems
    .filter((i) => i.orderId === orderId)
    .map((i) => ({ ...i, product: products.find((p) => p.id === i.productId)! }));
  return { ...order, customer, items };
}

export function getEnrichedPackRecord(packRecordId: number): EnrichedPackRecord | undefined {
  const pr = packRecords.find((r) => r.id === packRecordId);
  if (!pr) return undefined;
  const order = getEnrichedOrder(pr.orderId)!;
  const items = packItems
    .filter((i) => i.packRecordId === packRecordId)
    .map((i) => ({ ...i, product: products.find((p) => p.id === i.productId)! }));
  return { ...pr, order, items };
}

export function getEnrichedBOLs(): EnrichedBOL[] {
  return billsOfLading.map((bol) => {
    const packRecord = getEnrichedPackRecord(bol.packRecordId)!;
    const shipment = shipments.find((s) => s.id === bol.shipmentId)!;
    const carrier = carriers.find((c) => c.id === shipment.carrierId)!;
    return { ...bol, packRecord, shipment: { ...shipment, carrier } };
  });
}

function addDaysISO(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Open orders for the dashboard: deliveries scheduled for today or tomorrow
// that have not already been delivered.
export function getOpenOrders(): EnrichedOrder[] {
  const tomorrow = addDaysISO(DEMO_TODAY, 1);
  return salesOrders
    .filter((o) => o.status !== "delivered")
    .filter((o) => o.requestedDelivery === DEMO_TODAY || o.requestedDelivery === tomorrow)
    .map((o) => getEnrichedOrder(o.id)!);
}

export function getAllEnrichedOrders(): EnrichedOrder[] {
  return salesOrders.map((o) => getEnrichedOrder(o.id)!);
}

export function getInventoryAvailability(): InventoryAvailability[] {
  const openOrders = getOpenOrders();
  const today = DEMO_TODAY; // YYYY-MM-DD (UTC)
  const tomorrow = addDaysISO(today, 1);

  const todayOrders = openOrders.filter((o) => o.requestedDelivery === today);
  const tomorrowOrders = openOrders.filter((o) => o.requestedDelivery === tomorrow);

  const sumFor = (orders: EnrichedOrder[], productId: number) =>
    orders.reduce((sum, order) => {
      const item = order.items.find((i) => i.productId === productId);
      return sum + (item?.quantityOrdered ?? 0);
    }, 0);

  return products.map((product) => {
    const productScans = inventoryScans.filter((s) => s.productId === product.id);

    // Today's harvest: any scan whose UTC calendar day equals DEMO_TODAY.
    const freshCases = productScans.filter((s) => s.scannedAt.slice(0, 10) === today).length;

    // Cooler: scanned before today AND not yet checked out.
    const coolerCases = productScans.filter(
      (s) => s.checkoutAt === null && s.scannedAt.slice(0, 10) < today,
    ).length;

    const totalAvailable = freshCases + coolerCases;
    const committedToday = sumFor(todayOrders, product.id);
    const committedTomorrow = sumFor(tomorrowOrders, product.id);

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
