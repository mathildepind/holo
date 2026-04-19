export type Customer = {
  id: number;
  name: string;
  location: string;
  address: string;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  packSize: string;
  unitPrice: number;
  caseWeightLb: number;
  scanPrefix: string;
};

export type SalesOrder = {
  id: number;
  customerId: number;
  poNumber: string;
  requestedDelivery: string;
  plannedShip: string;
  status: "entered" | "fulfilled" | "released" | "delivered";
  enteredAt: string;
};

export type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  quantityOrdered: number;
  unitPrice: number;
  discount: number;
};

export type HarvestLog = {
  id: number;
  productId: number;
  harvestDate: string;
  quantityTrays: number;
  source: "fresh" | "cooler";
};

export type PackRecord = {
  id: number;
  orderId: number;
  status: "draft" | "verified" | "locked";
  packedBy: string;
  notes: string;
  verifiedAt: string | null;
};

export type PackItem = {
  id: number;
  packRecordId: number;
  productId: number;
  quantityPacked: number;
  discrepancyNote: string | null;
};

export type Carrier = {
  id: number;
  name: string;
  type: "internal" | "external";
};

export type Shipment = {
  id: number;
  carrierId: number;
  shipDate: string;
  status: "scheduled" | "in_transit" | "delivered";
  departedAt: string | null;
  deliveredAt: string | null;
};

export type BillOfLading = {
  id: number;
  bolNumber: string;
  packRecordId: number;
  shipmentId: number;
  palletCount: number;
  totalWeight: number;
  tempRequirements: string;
  generatedBy: string;
  generatedAt: string;
};

// Enriched types for UI
export type EnrichedOrder = SalesOrder & {
  customer: Customer;
  items: (OrderItem & { product: Product })[];
};

export type EnrichedPackRecord = PackRecord & {
  order: EnrichedOrder;
  items: (PackItem & { product: Product })[];
};

export type EnrichedBOL = BillOfLading & {
  packRecord: EnrichedPackRecord;
  shipment: Shipment & { carrier: Carrier };
};

export type InventoryAvailability = {
  product: Product;
  freshTrays: number;
  coolerTrays: number;
  totalAvailable: number;
  totalCommitted: number;
  gap: number; // negative = short
};
