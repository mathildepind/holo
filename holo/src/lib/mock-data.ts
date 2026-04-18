import type {
  Customer, Product, SalesOrder, OrderItem,
  HarvestLog, PackRecord, PackItem, Carrier, Shipment, BillOfLading,
  EnrichedOrder, EnrichedPackRecord, EnrichedBOL, InventoryAvailability,
} from "./types";

export const customers: Customer[] = [
  { id: 1, name: "Bay Leaf Markets", location: "Bay Leaf - Palo Alto", address: "340 University Ave, Palo Alto, CA 94301" },
  { id: 2, name: "Coastal Harvest Co-op", location: "Coastal Co-op - Menlo Park", address: "1100 El Camino Real, Menlo Park, CA 94025" },
  { id: 3, name: "Golden Gate Provisions", location: "GG Provisions - South SF", address: "488 Grand Ave, South San Francisco, CA 94080" },
];

export const products: Product[] = [
  { id: 1, sku: "SM-645", name: "Spring Mix", packSize: "6 × 4.5 oz", unitPrice: 18.5, scanPrefix: "og-9024" },
  { id: 2, sku: "BR-500", name: "Baby Romaine", packSize: "6 × 5 oz", unitPrice: 24.0, scanPrefix: "og-7201" },
  { id: 3, sku: "CL-410", name: "Crispy Leaf", packSize: "6 × 4.5 oz", unitPrice: 22.5, scanPrefix: "og-7310" },
  { id: 4, sku: "OA-100", name: "Organic Arugula", packSize: "6 × 4.5 oz", unitPrice: 21.0, scanPrefix: "og-8841" },
  { id: 5, sku: "BK-200", name: "Organic Baby Kale", packSize: "6 × 4.5 oz", unitPrice: 19.75, scanPrefix: "og-9531" },
  { id: 6, sku: "OS-300", name: "Organic Spinach", packSize: "6 × 4.5 oz", unitPrice: 20.0, scanPrefix: "og-8650" },
  { id: 7, sku: "TG-150", name: "Tender Greens", packSize: "6 × 4.5 oz", unitPrice: 19.0, scanPrefix: "og-9140" },
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

export const harvestLogs: HarvestLog[] = [
  // Today's fresh harvest
  { id: 1, productId: 1, harvestDate: "2025-04-15", quantityTrays: 60, source: "fresh" },
  { id: 2, productId: 2, harvestDate: "2025-04-15", quantityTrays: 30, source: "fresh" },
  { id: 3, productId: 3, harvestDate: "2025-04-15", quantityTrays: 40, source: "fresh" },
  { id: 4, productId: 4, harvestDate: "2025-04-15", quantityTrays: 15, source: "fresh" },
  { id: 5, productId: 5, harvestDate: "2025-04-15", quantityTrays: 20, source: "fresh" },
  { id: 9, productId: 6, harvestDate: "2025-04-15", quantityTrays: 25, source: "fresh" },
  { id: 10, productId: 7, harvestDate: "2025-04-15", quantityTrays: 18, source: "fresh" },
  // Cooler stock
  { id: 6, productId: 1, harvestDate: "2025-04-14", quantityTrays: 12, source: "cooler" },
  { id: 7, productId: 2, harvestDate: "2025-04-14", quantityTrays: 8, source: "cooler" },
  { id: 8, productId: 4, harvestDate: "2025-04-14", quantityTrays: 6, source: "cooler" },
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

  return products.map((product) => {
    const freshTrays = harvestLogs
      .filter((h) => h.productId === product.id && h.source === "fresh")
      .reduce((sum, h) => sum + h.quantityTrays, 0);

    const coolerTrays = harvestLogs
      .filter((h) => h.productId === product.id && h.source === "cooler")
      .reduce((sum, h) => sum + h.quantityTrays, 0);

    const totalAvailable = freshTrays + coolerTrays;

    const totalCommitted = openOrders.reduce((sum, order) => {
      const item = order.items.find((i) => i.productId === product.id);
      return sum + (item?.quantityOrdered ?? 0);
    }, 0);

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
