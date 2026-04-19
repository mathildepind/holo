import type {
  Customer, Product, SalesOrder, OrderItem,
  InventoryScan, PackRecord, PackItem, Carrier, Shipment, BillOfLading,
  EnrichedOrder, EnrichedPackRecord, EnrichedBOL, InventoryAvailability,
} from "./types";

// Simulated "today" for the demo — dates in the seed data are anchored to this.
export const DEMO_TODAY = "2025-04-15";

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

export const salesOrders: SalesOrder[] = [
  { id: 101, customerId: 1, poNumber: "BL-20250415", requestedDelivery: "2025-04-16", plannedShip: "2025-04-15", status: "entered", enteredAt: "2025-04-14T17:30:00Z" },
  { id: 102, customerId: 2, poNumber: "CH-20250415", requestedDelivery: "2025-04-16", plannedShip: "2025-04-15", status: "entered", enteredAt: "2025-04-14T18:10:00Z" },
  { id: 103, customerId: 3, poNumber: "GG-20250415", requestedDelivery: "2025-04-17", plannedShip: "2025-04-16", status: "entered", enteredAt: "2025-04-14T19:00:00Z" },
  { id: 104, customerId: 1, poNumber: "BL-20250412", requestedDelivery: "2025-04-13", plannedShip: "2025-04-12", status: "delivered", enteredAt: "2025-04-11T16:00:00Z" },
  { id: 105, customerId: 2, poNumber: "CH-20250410", requestedDelivery: "2025-04-11", plannedShip: "2025-04-10", status: "delivered", enteredAt: "2025-04-09T14:00:00Z" },
];

export const orderItems: OrderItem[] = [
  // Order 101 - Bay Leaf
  { id: 1001, orderId: 101, productId: 1, quantityOrdered: 48, unitPrice: 18.5, discount: 0 },
  { id: 1002, orderId: 101, productId: 2, quantityOrdered: 24, unitPrice: 24.0, discount: 0 },
  { id: 1003, orderId: 101, productId: 4, quantityOrdered: 12, unitPrice: 21.0, discount: 0 },
  // Order 102 - Coastal Harvest Co-op
  { id: 1004, orderId: 102, productId: 1, quantityOrdered: 36, unitPrice: 18.5, discount: 5 },
  { id: 1005, orderId: 102, productId: 3, quantityOrdered: 24, unitPrice: 22.5, discount: 0 },
  { id: 1006, orderId: 102, productId: 5, quantityOrdered: 18, unitPrice: 19.75, discount: 0 },
  // Order 103 - Golden Gate Provisions
  { id: 1007, orderId: 103, productId: 2, quantityOrdered: 50, unitPrice: 24.0, discount: 10 },
  { id: 1008, orderId: 103, productId: 1, quantityOrdered: 30, unitPrice: 18.5, discount: 0 },
  // Order 104 - Bay Leaf (delivered)
  { id: 1009, orderId: 104, productId: 1, quantityOrdered: 48, unitPrice: 18.5, discount: 0 },
  { id: 1010, orderId: 104, productId: 2, quantityOrdered: 24, unitPrice: 24.0, discount: 0 },
  // Order 105 - Coastal Harvest Co-op (delivered)
  { id: 1011, orderId: 105, productId: 3, quantityOrdered: 30, unitPrice: 22.5, discount: 0 },
  { id: 1012, orderId: 105, productId: 5, quantityOrdered: 24, unitPrice: 19.75, discount: 0 },
];

// Seeded from the case-study `inventory_scans.csv` sample (62 rows).
// Dates shifted by +27 days so the "today" date (2025-04-15) lines up with the
// order-1007 harvest in the sample. Scans are 1 case each.
// Product id is looked up from the scan prefix:
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
  // Order 1001 — harvested 2025-03-30, checked out same day 09:05Z
  scan(801, "og-9024-25A09-0001", 1, "2025-03-30T03:46:00Z", "2025-03-30T09:05:00Z", 1001),
  scan(802, "og-9024-25A09-0002", 1, "2025-03-30T03:46:30Z", "2025-03-30T09:05:00Z", 1001),
  scan(803, "og-9024-25A09-0003", 1, "2025-03-30T03:47:00Z", "2025-03-30T09:05:00Z", 1001),
  scan(804, "og-9024-25A09-0004", 1, "2025-03-30T03:47:30Z", "2025-03-30T09:05:00Z", 1001),
  scan(805, "cv-1912-25A09-0001", 2, "2025-03-30T03:50:00Z", "2025-03-30T09:05:00Z", 1001),
  scan(806, "cv-1912-25A09-0002", 2, "2025-03-30T03:50:30Z", "2025-03-30T09:05:00Z", 1001),
  scan(807, "cv-1912-25A09-0003", 2, "2025-03-30T03:51:00Z", "2025-03-30T09:05:00Z", 1001),
  scan(808, "cv-1943-25A09-0001", 7, "2025-03-30T03:53:00Z", "2025-03-30T09:05:00Z", 1001),
  scan(809, "cv-1943-25A09-0002", 7, "2025-03-30T03:53:30Z", "2025-03-30T09:05:00Z", 1001),
  // Order 1002 — harvested 2025-03-31, checked out same day 09:30Z
  scan(810, "og-1974-25A09-0001", 4, "2025-03-31T04:11:00Z", "2025-03-31T09:30:00Z", 1002),
  scan(811, "og-1974-25A09-0002", 4, "2025-03-31T04:11:30Z", "2025-03-31T09:30:00Z", 1002),
  scan(812, "og-1974-25A09-0003", 4, "2025-03-31T04:12:00Z", "2025-03-31T09:30:00Z", 1002),
  scan(813, "og-1981-25A09-0001", 5, "2025-03-31T04:14:00Z", "2025-03-31T09:30:00Z", 1002),
  scan(814, "og-1981-25A09-0002", 5, "2025-03-31T04:14:30Z", "2025-03-31T09:30:00Z", 1002),
  // Order 1003 — harvested 2025-04-02, checked out same day 08:15Z
  scan(815, "og-9024-25A09-0005", 1, "2025-04-02T02:56:00Z", "2025-04-02T08:15:00Z", 1003),
  scan(816, "og-9024-25A09-0006", 1, "2025-04-02T02:56:30Z", "2025-04-02T08:15:00Z", 1003),
  scan(817, "og-9024-25A09-0007", 1, "2025-04-02T02:57:00Z", "2025-04-02T08:15:00Z", 1003),
  scan(818, "og-9024-25A09-0008", 1, "2025-04-02T02:57:30Z", "2025-04-02T08:15:00Z", 1003),
  scan(819, "og-9024-25A09-0009", 1, "2025-04-02T02:58:00Z", "2025-04-02T08:15:00Z", 1003),
  scan(820, "cv-1912-25A09-0004", 2, "2025-04-02T03:00:00Z", "2025-04-02T08:15:00Z", 1003),
  scan(821, "cv-1912-25A09-0005", 2, "2025-04-02T03:00:30Z", "2025-04-02T08:15:00Z", 1003),
  scan(822, "cv-1912-25A09-0006", 2, "2025-04-02T03:01:00Z", "2025-04-02T08:15:00Z", 1003),
  // Order 1004 — harvested 2025-04-06, checked out same day 08:30Z
  scan(823, "og-9024-25B09-0001", 1, "2025-04-06T03:21:00Z", "2025-04-06T08:30:00Z", 1004),
  scan(824, "og-9024-25B09-0002", 1, "2025-04-06T03:21:30Z", "2025-04-06T08:30:00Z", 1004),
  scan(825, "og-9024-25B09-0003", 1, "2025-04-06T03:22:00Z", "2025-04-06T08:30:00Z", 1004),
  scan(826, "og-9024-25B09-0004", 1, "2025-04-06T03:22:30Z", "2025-04-06T08:30:00Z", 1004),
  scan(827, "cv-1905-25A09-0001", 3, "2025-04-06T03:24:00Z", "2025-04-06T08:30:00Z", 1004),
  scan(828, "cv-1905-25A09-0002", 3, "2025-04-06T03:24:30Z", "2025-04-06T08:30:00Z", 1004),
  scan(829, "cv-1905-25A09-0003", 3, "2025-04-06T03:25:00Z", "2025-04-06T08:30:00Z", 1004),
  scan(830, "cv-1943-25A09-0003", 7, "2025-04-06T03:27:00Z", "2025-04-06T08:30:00Z", 1004),
  scan(831, "cv-1943-25A09-0004", 7, "2025-04-06T03:27:30Z", "2025-04-06T08:30:00Z", 1004),
  // Order 1005 — harvested 2025-04-07, checked out same day 08:45Z
  scan(832, "og-1974-25B09-0001", 4, "2025-04-07T03:51:00Z", "2025-04-07T08:45:00Z", 1005),
  scan(833, "og-1974-25B09-0002", 4, "2025-04-07T03:51:30Z", "2025-04-07T08:45:00Z", 1005),
  scan(834, "og-1974-25B09-0003", 4, "2025-04-07T03:52:00Z", "2025-04-07T08:45:00Z", 1005),
  scan(835, "og-1974-25B09-0004", 4, "2025-04-07T03:52:30Z", "2025-04-07T08:45:00Z", 1005, { overridden: true, addedInFulfillment: true }),
  scan(836, "og-1936-25A09-0001", 6, "2025-04-07T03:55:00Z", "2025-04-07T08:45:00Z", 1005),
  scan(837, "og-1936-25A09-0002", 6, "2025-04-07T03:55:30Z", "2025-04-07T08:45:00Z", 1005),
  scan(838, "og-1936-25A09-0003", 6, "2025-04-07T03:56:00Z", "2025-04-07T08:45:00Z", 1005),
  // Order 1006 — harvested 2025-04-13, still in cooler (checkout NULL)
  scan(839, "og-9024-25A10-0001", 1, "2025-04-13T04:01:00Z", null, 1006),
  scan(840, "og-9024-25A10-0002", 1, "2025-04-13T04:01:30Z", null, 1006),
  scan(841, "og-9024-25A10-0003", 1, "2025-04-13T04:02:00Z", null, 1006),
  scan(842, "og-9024-25A10-0004", 1, "2025-04-13T04:02:30Z", null, 1006),
  scan(843, "og-9024-25A10-0005", 1, "2025-04-13T04:03:00Z", null, 1006),
  scan(844, "cv-1912-25A10-0001", 2, "2025-04-13T04:05:00Z", null, 1006),
  scan(845, "cv-1912-25A10-0002", 2, "2025-04-13T04:05:30Z", null, 1006),
  scan(846, "cv-1912-25A10-0003", 2, "2025-04-13T04:06:00Z", null, 1006),
  scan(847, "cv-1912-25A10-0004", 2, "2025-04-13T04:06:30Z", null, 1006),
  scan(848, "cv-1943-25A10-0001", 7, "2025-04-13T04:08:00Z", null, 1006),
  scan(849, "cv-1943-25A10-0002", 7, "2025-04-13T04:08:30Z", null, 1006),
  scan(850, "cv-1943-25A10-0003", 7, "2025-04-13T04:09:00Z", null, 1006),
  // Order 1007 — harvested 2025-04-15 (today), scheduled checkout 2025-04-16 08:00Z
  scan(851, "og-9024-25A10-0006", 1, "2025-04-15T21:30:00Z", "2025-04-16T08:00:00Z", 1007),
  scan(852, "og-9024-25A10-0007", 1, "2025-04-15T21:30:30Z", "2025-04-16T08:00:00Z", 1007),
  scan(853, "og-9024-25A10-0008", 1, "2025-04-15T21:31:00Z", "2025-04-16T08:00:00Z", 1007),
  scan(854, "og-9024-25A10-0009", 1, "2025-04-15T21:31:30Z", "2025-04-16T08:00:00Z", 1007),
  scan(855, "og-9024-25A10-0010", 1, "2025-04-15T21:32:00Z", "2025-04-16T08:00:00Z", 1007),
  scan(856, "og-9024-25A10-0011", 1, "2025-04-15T21:32:30Z", "2025-04-16T08:00:00Z", 1007),
  scan(857, "og-9024-25A10-0012", 1, "2025-04-15T21:33:00Z", "2025-04-16T08:00:00Z", 1007),
  scan(858, "og-9024-25A10-0013", 1, "2025-04-15T21:33:30Z", "2025-04-16T08:00:00Z", 1007),
  scan(859, "cv-1905-25A10-0001", 3, "2025-04-15T21:36:00Z", "2025-04-16T08:00:00Z", 1007),
  scan(860, "cv-1905-25A10-0002", 3, "2025-04-15T21:36:30Z", "2025-04-16T08:00:00Z", 1007),
  scan(861, "cv-1905-25A10-0003", 3, "2025-04-15T21:37:00Z", "2025-04-16T08:00:00Z", 1007),
  scan(862, "cv-1905-25A10-0004", 3, "2025-04-15T21:37:30Z", "2025-04-16T08:00:00Z", 1007),
];

export const carriers: Carrier[] = [
  { id: 1, name: "Hippo Truck", type: "internal" },
  { id: 2, name: "FreshRoute Logistics", type: "external" },
];

export const shipments: Shipment[] = [
  { id: 1, carrierId: 1, shipDate: "2025-04-12", status: "delivered", departedAt: "2025-04-12T06:00:00Z", deliveredAt: "2025-04-13T09:30:00Z" },
  { id: 2, carrierId: 2, shipDate: "2025-04-10", status: "delivered", departedAt: "2025-04-10T07:00:00Z", deliveredAt: "2025-04-11T10:00:00Z" },
];

export const packRecords: PackRecord[] = [
  {
    id: 1, orderId: 104, status: "locked", packedBy: "L. Greens",
    notes: "Clean pack. Baby Romaine quality excellent.", verifiedAt: "2025-04-12T04:45:00Z",
  },
  {
    id: 2, orderId: 105, status: "locked", packedBy: "L. Greens",
    notes: "Short 6 cases of Green Leaf — quality pull on outer leaves. Customer notified.", verifiedAt: "2025-04-10T05:15:00Z",
  },
];

export const packItems: PackItem[] = [
  // Pack Record 1 (Order 104)
  { id: 1, packRecordId: 1, productId: 1, quantityPacked: 48, discrepancyNote: null },
  { id: 2, packRecordId: 1, productId: 2, quantityPacked: 24, discrepancyNote: null },
  // Pack Record 2 (Order 105)
  { id: 3, packRecordId: 2, productId: 3, quantityPacked: 24, discrepancyNote: "Short 6 cases — quality pull on outer leaves. Customer approved." },
  { id: 4, packRecordId: 2, productId: 5, quantityPacked: 24, discrepancyNote: null },
];

export const billsOfLading: BillOfLading[] = [
  {
    id: 1, bolNumber: "BOL-2025-0041", packRecordId: 1, shipmentId: 1,
    palletCount: 4, totalWeight: 1240, tempRequirements: "34–38°F",
    generatedBy: "Roman E.", generatedAt: "2025-04-12T05:10:00Z",
  },
  {
    id: 2, bolNumber: "BOL-2025-0040", packRecordId: 2, shipmentId: 2,
    palletCount: 3, totalWeight: 980, tempRequirements: "34–38°F",
    generatedBy: "Roman E.", generatedAt: "2025-04-10T05:45:00Z",
  },
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

export function getOpenOrders(): EnrichedOrder[] {
  return salesOrders
    .filter((o) => o.status === "entered")
    .map((o) => getEnrichedOrder(o.id)!);
}

export function getAllEnrichedOrders(): EnrichedOrder[] {
  return salesOrders.map((o) => getEnrichedOrder(o.id)!);
}

export function getInventoryAvailability(): InventoryAvailability[] {
  const openOrders = getOpenOrders();
  const today = DEMO_TODAY; // YYYY-MM-DD (UTC)

  return products.map((product) => {
    const productScans = inventoryScans.filter((s) => s.productId === product.id);

    // Today's harvest: any scan whose UTC calendar day equals DEMO_TODAY.
    const freshCases = productScans.filter((s) => s.scannedAt.slice(0, 10) === today).length;

    // Cooler: scanned before today AND not yet checked out.
    const coolerCases = productScans.filter(
      (s) => s.checkoutAt === null && s.scannedAt.slice(0, 10) < today,
    ).length;

    const totalAvailable = freshCases + coolerCases;

    const totalCommitted = openOrders.reduce((sum, order) => {
      const item = order.items.find((i) => i.productId === product.id);
      return sum + (item?.quantityOrdered ?? 0);
    }, 0);

    return {
      product,
      freshCases,
      coolerCases,
      totalAvailable,
      totalCommitted,
      gap: totalAvailable - totalCommitted,
    };
  });
}
