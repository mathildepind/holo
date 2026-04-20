import type { DB } from "./queries";
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

// Seed fixture anchored to the morning of 2025-03-10 (DEMO_TODAY).
// Mirrors the case-study sample CSVs: orders 1001-1003 are delivered with
// full traceability (pack record → scans → BOL); 1004 ships today and
// awaits packing (scans 823-831 are today's harvest, not yet assigned to a
// pack item); 1005 is open for tomorrow's harvest.
export function seedDb(db: DB) {
  db.insert(customers)
    .values([
      { id: 1, name: "Bay Leaf Markets", location: "Bay Leaf - Palo Alto", address: "340 University Ave, Palo Alto, CA 94301" },
      { id: 2, name: "Coastal Harvest Co-op", location: "Coastal Co-op - Menlo Park", address: "1100 El Camino Real, Menlo Park, CA 94025" },
      { id: 3, name: "Golden Gate Provisions", location: "GG Provisions - South SF", address: "488 Grand Ave, South San Francisco, CA 94080" },
    ])
    .run();

  db.insert(products)
    .values([
      { id: 1, sku: "SM-645", name: "Spring Mix", packSize: "6 × 4.5 oz", unitPrice: 18.5, caseWeightLb: 2.5, scanPrefix: "og-9024" },
      { id: 2, sku: "BR-500", name: "Baby Romaine", packSize: "6 × 5 oz", unitPrice: 24.0, caseWeightLb: 2.75, scanPrefix: "cv-1912" },
      { id: 3, sku: "CL-410", name: "Crispy Leaf", packSize: "6 × 4.5 oz", unitPrice: 22.5, caseWeightLb: 2.5, scanPrefix: "cv-1905" },
      { id: 4, sku: "OA-100", name: "Organic Arugula", packSize: "6 × 4.5 oz", unitPrice: 21.0, caseWeightLb: 2.5, scanPrefix: "og-1974" },
      { id: 5, sku: "BK-200", name: "Organic Baby Kale", packSize: "6 × 4.5 oz", unitPrice: 19.75, caseWeightLb: 2.5, scanPrefix: "og-1981" },
      { id: 6, sku: "OS-300", name: "Organic Spinach", packSize: "6 × 4.5 oz", unitPrice: 20.0, caseWeightLb: 2.5, scanPrefix: "og-1936" },
      { id: 7, sku: "TG-150", name: "Tender Greens", packSize: "6 × 4.5 oz", unitPrice: 19.0, caseWeightLb: 2.5, scanPrefix: "cv-1943" },
    ])
    .run();

  db.insert(salesOrders)
    .values([
      { id: 1001, customerId: 1, poNumber: "BLM-250303", requestedDelivery: "2025-03-03", plannedShip: "2025-03-03", status: "delivered", enteredAt: "2025-02-28T18:00:00Z" },
      { id: 1002, customerId: 2, poNumber: "CHC-250304", requestedDelivery: "2025-03-04", plannedShip: "2025-03-04", status: "delivered", enteredAt: "2025-03-01T20:00:00Z" },
      { id: 1003, customerId: 3, poNumber: "GGP-250306", requestedDelivery: "2025-03-06", plannedShip: "2025-03-06", status: "delivered", enteredAt: "2025-03-03T16:00:00Z" },
      { id: 1004, customerId: 1, poNumber: "BLM-250310", requestedDelivery: "2025-03-10", plannedShip: "2025-03-10", status: "entered", enteredAt: "2025-03-07T17:30:00Z" },
      { id: 1005, customerId: 2, poNumber: "CHC-250311", requestedDelivery: "2025-03-11", plannedShip: "2025-03-11", status: "entered", enteredAt: "2025-03-08T19:00:00Z" },
    ])
    .run();

  db.insert(orderItems)
    .values([
      // Order 1001 — Bay Leaf (delivered 2025-03-03)
      { id: 5001, orderId: 1001, productId: 1, quantityOrdered: 4, unitPrice: 13, discount: 0 },
      { id: 5002, orderId: 1001, productId: 2, quantityOrdered: 3, unitPrice: 14, discount: 0 },
      { id: 5003, orderId: 1001, productId: 7, quantityOrdered: 2, unitPrice: 13, discount: 0 },
      // Order 1002 — Coastal Harvest Co-op (delivered 2025-03-04)
      { id: 5004, orderId: 1002, productId: 4, quantityOrdered: 3, unitPrice: 15, discount: 0 },
      { id: 5005, orderId: 1002, productId: 5, quantityOrdered: 2, unitPrice: 15, discount: 0 },
      // Order 1003 — Golden Gate Provisions (delivered 2025-03-06)
      { id: 5006, orderId: 1003, productId: 1, quantityOrdered: 6, unitPrice: 13, discount: 0 },
      { id: 5007, orderId: 1003, productId: 2, quantityOrdered: 3, unitPrice: 14, discount: 0 },
      // Order 1004 — Bay Leaf (ships today)
      { id: 5008, orderId: 1004, productId: 1, quantityOrdered: 4, unitPrice: 13, discount: 0 },
      { id: 5009, orderId: 1004, productId: 3, quantityOrdered: 3, unitPrice: 13, discount: 0 },
      { id: 5010, orderId: 1004, productId: 7, quantityOrdered: 2, unitPrice: 13, discount: 0 },
      // Order 1005 — Coastal Harvest Co-op (ships tomorrow)
      { id: 5011, orderId: 1005, productId: 4, quantityOrdered: 4, unitPrice: 15, discount: 0 },
      { id: 5012, orderId: 1005, productId: 6, quantityOrdered: 3, unitPrice: 15, discount: 0 },
    ])
    .run();

  db.insert(carriers)
    .values([
      { id: 1, name: "Hippo Truck", type: "internal" },
      { id: 2, name: "FreshRoute Logistics", type: "external" },
    ])
    .run();

  db.insert(shipments)
    .values([
      { id: 1, carrierId: 1, shipDate: "2025-03-03", status: "delivered", departedAt: "2025-03-03T08:30:00Z", deliveredAt: "2025-03-03T11:15:00Z" },
      { id: 2, carrierId: 1, shipDate: "2025-03-04", status: "delivered", departedAt: "2025-03-04T09:00:00Z", deliveredAt: "2025-03-04T13:45:00Z" },
      { id: 3, carrierId: 1, shipDate: "2025-03-06", status: "delivered", departedAt: "2025-03-06T07:45:00Z", deliveredAt: "2025-03-06T10:30:00Z" },
    ])
    .run();

  db.insert(packRecords)
    .values([
      { id: 1, orderId: 1001, status: "locked", packedBy: "L. Greens", notes: "Clean pack.", verifiedAt: "2025-03-03T03:45:00Z" },
      { id: 2, orderId: 1002, status: "locked", packedBy: "L. Greens", notes: "Clean pack — arugula and baby kale in great shape.", verifiedAt: "2025-03-04T04:10:00Z" },
      { id: 3, orderId: 1003, status: "locked", packedBy: "L. Greens", notes: "Clean pack.", verifiedAt: "2025-03-06T02:55:00Z" },
    ])
    .run();

  db.insert(packItems)
    .values([
      { id: 1, packRecordId: 1, productId: 1, quantityPacked: 4, discrepancyNote: null },
      { id: 2, packRecordId: 1, productId: 2, quantityPacked: 3, discrepancyNote: null },
      { id: 3, packRecordId: 1, productId: 7, quantityPacked: 2, discrepancyNote: null },
      { id: 4, packRecordId: 2, productId: 4, quantityPacked: 3, discrepancyNote: null },
      { id: 5, packRecordId: 2, productId: 5, quantityPacked: 2, discrepancyNote: null },
      { id: 6, packRecordId: 3, productId: 1, quantityPacked: 6, discrepancyNote: null },
      { id: 7, packRecordId: 3, productId: 2, quantityPacked: 3, discrepancyNote: null },
    ])
    .run();

  db.insert(billsOfLading)
    .values([
      // Weights: 1001 = 4×2.5 + 3×2.75 + 2×2.5 = 23.25 → 23, 1002 = 3×2.5 + 2×2.5 = 12.5 → 13,
      // 1003 = 6×2.5 + 3×2.75 = 23.25 → 23. New packs continue from 0043.
      { id: 1, bolNumber: "BOL-2025-0040", packRecordId: 1, shipmentId: 1, palletCount: 1, totalWeight: 23, tempRequirements: "34-38\u00B0F", generatedBy: "Roman E.", generatedAt: "2025-03-03T04:00:00Z" },
      { id: 2, bolNumber: "BOL-2025-0041", packRecordId: 2, shipmentId: 2, palletCount: 1, totalWeight: 13, tempRequirements: "34-38\u00B0F", generatedBy: "Roman E.", generatedAt: "2025-03-04T04:30:00Z" },
      { id: 3, bolNumber: "BOL-2025-0042", packRecordId: 3, shipmentId: 3, palletCount: 1, totalWeight: 23, tempRequirements: "34-38\u00B0F", generatedBy: "Roman E.", generatedAt: "2025-03-06T03:15:00Z" },
    ])
    .run();

  // Inventory scans: one per case. Historical scans (801-822) are linked to
  // pack_items for orders 1001-1003 and checked out when the pallets departed.
  // Today's harvest (823-831) is staged for order 1004's pack run — scanned
  // off the line this morning, but not yet assigned to a pack_item.
  db.insert(inventoryScans)
    .values([
      // Order 1001 — harvested + checked out 2025-03-03
      { id: 801, scanCode: "og-9024-25A09-0001", productId: 1, batchCode: "25A09", packItemId: 1, scannedAt: "2025-03-03T03:46:00Z", checkoutAt: "2025-03-03T09:05:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 802, scanCode: "og-9024-25A09-0002", productId: 1, batchCode: "25A09", packItemId: 1, scannedAt: "2025-03-03T03:46:30Z", checkoutAt: "2025-03-03T09:05:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 803, scanCode: "og-9024-25A09-0003", productId: 1, batchCode: "25A09", packItemId: 1, scannedAt: "2025-03-03T03:47:00Z", checkoutAt: "2025-03-03T09:05:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 804, scanCode: "og-9024-25A09-0004", productId: 1, batchCode: "25A09", packItemId: 1, scannedAt: "2025-03-03T03:47:30Z", checkoutAt: "2025-03-03T09:05:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 805, scanCode: "cv-1912-25A09-0001", productId: 2, batchCode: "25A09", packItemId: 2, scannedAt: "2025-03-03T03:50:00Z", checkoutAt: "2025-03-03T09:05:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 806, scanCode: "cv-1912-25A09-0002", productId: 2, batchCode: "25A09", packItemId: 2, scannedAt: "2025-03-03T03:50:30Z", checkoutAt: "2025-03-03T09:05:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 807, scanCode: "cv-1912-25A09-0003", productId: 2, batchCode: "25A09", packItemId: 2, scannedAt: "2025-03-03T03:51:00Z", checkoutAt: "2025-03-03T09:05:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 808, scanCode: "cv-1943-25A09-0001", productId: 7, batchCode: "25A09", packItemId: 3, scannedAt: "2025-03-03T03:53:00Z", checkoutAt: "2025-03-03T09:05:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 809, scanCode: "cv-1943-25A09-0002", productId: 7, batchCode: "25A09", packItemId: 3, scannedAt: "2025-03-03T03:53:30Z", checkoutAt: "2025-03-03T09:05:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      // Order 1002 — harvested + checked out 2025-03-04
      { id: 810, scanCode: "og-1974-25A09-0001", productId: 4, batchCode: "25A09", packItemId: 4, scannedAt: "2025-03-04T04:11:00Z", checkoutAt: "2025-03-04T09:30:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 811, scanCode: "og-1974-25A09-0002", productId: 4, batchCode: "25A09", packItemId: 4, scannedAt: "2025-03-04T04:11:30Z", checkoutAt: "2025-03-04T09:30:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 812, scanCode: "og-1974-25A09-0003", productId: 4, batchCode: "25A09", packItemId: 4, scannedAt: "2025-03-04T04:12:00Z", checkoutAt: "2025-03-04T09:30:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 813, scanCode: "og-1981-25A09-0001", productId: 5, batchCode: "25A09", packItemId: 5, scannedAt: "2025-03-04T04:14:00Z", checkoutAt: "2025-03-04T09:30:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 814, scanCode: "og-1981-25A09-0002", productId: 5, batchCode: "25A09", packItemId: 5, scannedAt: "2025-03-04T04:14:30Z", checkoutAt: "2025-03-04T09:30:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      // Order 1003 — harvested + checked out 2025-03-06
      { id: 815, scanCode: "og-9024-25A09-0005", productId: 1, batchCode: "25A09", packItemId: 6, scannedAt: "2025-03-06T02:56:00Z", checkoutAt: "2025-03-06T08:15:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 816, scanCode: "og-9024-25A09-0006", productId: 1, batchCode: "25A09", packItemId: 6, scannedAt: "2025-03-06T02:56:30Z", checkoutAt: "2025-03-06T08:15:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 817, scanCode: "og-9024-25A09-0007", productId: 1, batchCode: "25A09", packItemId: 6, scannedAt: "2025-03-06T02:57:00Z", checkoutAt: "2025-03-06T08:15:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 818, scanCode: "og-9024-25A09-0008", productId: 1, batchCode: "25A09", packItemId: 6, scannedAt: "2025-03-06T02:57:30Z", checkoutAt: "2025-03-06T08:15:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 819, scanCode: "og-9024-25A09-0009", productId: 1, batchCode: "25A09", packItemId: 6, scannedAt: "2025-03-06T02:58:00Z", checkoutAt: "2025-03-06T08:15:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 820, scanCode: "cv-1912-25A09-0004", productId: 2, batchCode: "25A09", packItemId: 7, scannedAt: "2025-03-06T03:00:00Z", checkoutAt: "2025-03-06T08:15:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 821, scanCode: "cv-1912-25A09-0005", productId: 2, batchCode: "25A09", packItemId: 7, scannedAt: "2025-03-06T03:00:30Z", checkoutAt: "2025-03-06T08:15:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 822, scanCode: "cv-1912-25A09-0006", productId: 2, batchCode: "25A09", packItemId: 7, scannedAt: "2025-03-06T03:01:00Z", checkoutAt: "2025-03-06T08:15:00Z", isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      // Today's harvest — ready for order 1004, not yet assigned to a pack_item.
      { id: 823, scanCode: "og-9024-25B09-0001", productId: 1, batchCode: "25B09", packItemId: null, scannedAt: "2025-03-10T03:21:00Z", checkoutAt: null, isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 824, scanCode: "og-9024-25B09-0002", productId: 1, batchCode: "25B09", packItemId: null, scannedAt: "2025-03-10T03:21:30Z", checkoutAt: null, isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 825, scanCode: "og-9024-25B09-0003", productId: 1, batchCode: "25B09", packItemId: null, scannedAt: "2025-03-10T03:22:00Z", checkoutAt: null, isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 826, scanCode: "og-9024-25B09-0004", productId: 1, batchCode: "25B09", packItemId: null, scannedAt: "2025-03-10T03:22:30Z", checkoutAt: null, isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 827, scanCode: "cv-1905-25A09-0001", productId: 3, batchCode: "25A09", packItemId: null, scannedAt: "2025-03-10T03:24:00Z", checkoutAt: null, isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 828, scanCode: "cv-1905-25A09-0002", productId: 3, batchCode: "25A09", packItemId: null, scannedAt: "2025-03-10T03:24:30Z", checkoutAt: null, isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 829, scanCode: "cv-1905-25A09-0003", productId: 3, batchCode: "25A09", packItemId: null, scannedAt: "2025-03-10T03:25:00Z", checkoutAt: null, isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 830, scanCode: "cv-1943-25A09-0003", productId: 7, batchCode: "25A09", packItemId: null, scannedAt: "2025-03-10T03:27:00Z", checkoutAt: null, isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
      { id: 831, scanCode: "cv-1943-25A09-0004", productId: 7, batchCode: "25A09", packItemId: null, scannedAt: "2025-03-10T03:27:30Z", checkoutAt: null, isProduction: true, isDonation: false, isCheckoutOverridden: false, isAddedInFulfillment: false },
    ])
    .run();
}
