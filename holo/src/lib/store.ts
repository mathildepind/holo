import type {
  EnrichedOrder, EnrichedBOL, EnrichedPackRecord,
  PackRecord, PackItem, BillOfLading, Shipment, Product,
} from "./types";

const STORAGE_KEY = "holo-bols";

type DraftItem = {
  productId: number;
  product: Product;
  quantityOrdered: number;
  quantityPacked: number | "";
  discrepancyNote: string;
};

export function getStoredBOLs(): EnrichedBOL[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredBOLs(bols: EnrichedBOL[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bols));
}

export function createPackAndBOL(
  order: EnrichedOrder,
  draftItems: DraftItem[],
  packNotes: string,
): EnrichedBOL {
  const now = new Date().toISOString();
  const ts = Date.now();

  // Generate IDs from timestamp to avoid collisions with mock data
  const packRecordId = ts;
  const shipmentId = ts;
  const bolId = ts;

  // Build pack record
  const packRecord: PackRecord = {
    id: packRecordId,
    orderId: order.id,
    status: "locked",
    packedBy: "L. Greens",
    notes: packNotes,
    verifiedAt: now,
  };

  // Build pack items
  const packItemsList: (PackItem & { product: Product })[] = draftItems.map((d, i) => ({
    id: ts + i + 1,
    packRecordId,
    productId: d.productId,
    quantityPacked: typeof d.quantityPacked === "number" ? d.quantityPacked : 0,
    discrepancyNote: d.discrepancyNote.trim() || null,
    product: d.product,
  }));

  // Build enriched pack record
  const enrichedPackRecord: EnrichedPackRecord = {
    ...packRecord,
    order,
    items: packItemsList,
  };

  // Build shipment (scheduled, using Hippo Truck)
  const shipment: Shipment & { carrier: { id: number; name: string; type: "internal" | "external" } } = {
    id: shipmentId,
    carrierId: 1,
    shipDate: order.plannedShip,
    status: "scheduled",
    departedAt: null,
    deliveredAt: null,
    carrier: { id: 1, name: "Hippo Truck", type: "internal" },
  };

  // Generate BOL number
  const seq = 42 + getStoredBOLs().length + 1;
  const bolNumber = `BOL-2025-${String(seq).padStart(4, "0")}`;

  // Build bill of lading
  const totalWeight = packItemsList.reduce((s, i) => s + i.quantityPacked * i.product.caseWeightLb, 0);
  const palletCount = Math.max(1, Math.ceil(totalWeight / 400));

  const bol: BillOfLading = {
    id: bolId,
    bolNumber,
    packRecordId,
    shipmentId,
    palletCount,
    totalWeight: Math.round(totalWeight),
    tempRequirements: "34-38\u00B0F",
    generatedBy: "L. Greens",
    generatedAt: now,
  };

  // Combine into EnrichedBOL
  const enrichedBOL: EnrichedBOL = {
    ...bol,
    packRecord: enrichedPackRecord,
    shipment,
  };

  // Save to localStorage
  const existing = getStoredBOLs();
  saveStoredBOLs([enrichedBOL, ...existing]);

  return enrichedBOL;
}
