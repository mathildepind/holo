import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getStoredBOLs, createPackAndBOL } from "./store";
import type { EnrichedOrder, Product } from "./types";

function makeStorageShim() {
  let data: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    removeItem: (k: string) => {
      delete data[k];
    },
    clear: () => {
      data = {};
    },
  };
}

const product: Product = {
  id: 1,
  sku: "SM-645",
  name: "Spring Mix",
  packSize: "6 × 4.5 oz",
  unitPrice: 18.5,
  caseWeightLb: 2.5,
  scanPrefix: "og-9024",
};

const order: EnrichedOrder = {
  id: 101,
  customerId: 1,
  poNumber: "BL-20250415",
  requestedDelivery: "2025-04-16",
  plannedShip: "2025-04-15",
  status: "entered",
  enteredAt: "2025-04-14T17:30:00Z",
  customer: {
    id: 1,
    name: "Bay Leaf Markets",
    location: "Bay Leaf - Palo Alto",
    address: "340 University Ave, Palo Alto, CA 94301",
  },
  items: [
    { id: 1001, orderId: 101, productId: 1, quantityOrdered: 48, unitPrice: 18.5, discount: 0, product },
  ],
};

describe("getStoredBOLs — SSR", () => {
  it("returns [] when window is undefined", () => {
    expect(typeof (globalThis as unknown as { window?: unknown }).window).toBe("undefined");
    expect(getStoredBOLs()).toEqual([]);
  });
});

describe("store.ts — browser environment", () => {
  beforeEach(() => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("localStorage", makeStorageShim());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getStoredBOLs", () => {
    it("returns [] when nothing is stored", () => {
      expect(getStoredBOLs()).toEqual([]);
    });

    it("returns [] when the stored value is invalid JSON", () => {
      localStorage.setItem("holo-bols", "{not-json");
      expect(getStoredBOLs()).toEqual([]);
    });

    it("returns the parsed array for valid JSON", () => {
      localStorage.setItem("holo-bols", JSON.stringify([{ bolNumber: "BOL-TEST" }]));
      const stored = getStoredBOLs() as { bolNumber: string }[];
      expect(stored).toHaveLength(1);
      expect(stored[0].bolNumber).toBe("BOL-TEST");
    });
  });

  describe("createPackAndBOL", () => {
    it("builds an EnrichedBOL with the expected shape and persists it", () => {
      const bol = createPackAndBOL(
        order,
        [{ productId: 1, product, quantityOrdered: 48, quantityPacked: 48, discrepancyNote: "" }],
        "clean pack",
      );

      expect(bol.bolNumber).toMatch(/^BOL-2025-\d{4}$/);
      expect(bol.packRecord.status).toBe("locked");
      expect(bol.packRecord.order.id).toBe(order.id);
      expect(bol.shipment.carrier).toEqual({ id: 1, name: "Hippo Truck", type: "internal" });
      expect(bol.shipment.shipDate).toBe(order.plannedShip);
      expect(bol.tempRequirements).toBe("34-38\u00B0F");

      // Persisted (most-recent-first)
      const stored = getStoredBOLs();
      expect(stored).toHaveLength(1);
      expect(stored[0].bolNumber).toBe(bol.bolNumber);
    });

    it("computes totalWeight from product caseWeightLb and palletCount at ceil(weight/400), min 1", () => {
      // 48 * 2.5 = 120 lb → 1 pallet (min)
      const small = createPackAndBOL(
        order,
        [{ productId: 1, product, quantityOrdered: 48, quantityPacked: 48, discrepancyNote: "" }],
        "",
      );
      expect(small.totalWeight).toBe(120);
      expect(small.palletCount).toBe(1);

      // 500 * 2.5 = 1250 lb → ceil(1250/400) = 4 pallets
      const big = createPackAndBOL(
        order,
        [{ productId: 1, product, quantityOrdered: 500, quantityPacked: 500, discrepancyNote: "" }],
        "",
      );
      expect(big.totalWeight).toBe(1250);
      expect(big.palletCount).toBe(4);
    });

    it("trims discrepancy notes and converts empty strings to null", () => {
      const bol = createPackAndBOL(
        order,
        [
          { productId: 1, product, quantityOrdered: 48, quantityPacked: 48, discrepancyNote: "   " },
          { productId: 1, product, quantityOrdered: 24, quantityPacked: 22, discrepancyNote: "  short 2  " },
        ],
        "",
      );
      expect(bol.packRecord.items[0].discrepancyNote).toBeNull();
      expect(bol.packRecord.items[1].discrepancyNote).toBe("short 2");
    });

    it("coerces empty-string packed quantities to 0", () => {
      const bol = createPackAndBOL(
        order,
        [{ productId: 1, product, quantityOrdered: 48, quantityPacked: "", discrepancyNote: "" }],
        "",
      );
      expect(bol.packRecord.items[0].quantityPacked).toBe(0);
      expect(bol.totalWeight).toBe(0);
      expect(bol.palletCount).toBe(1); // min floor
    });

    it("increments the BOL number sequence starting at 0043", () => {
      const first = createPackAndBOL(
        order,
        [{ productId: 1, product, quantityOrdered: 1, quantityPacked: 1, discrepancyNote: "" }],
        "",
      );
      const second = createPackAndBOL(
        order,
        [{ productId: 1, product, quantityOrdered: 1, quantityPacked: 1, discrepancyNote: "" }],
        "",
      );
      expect(first.bolNumber).toBe("BOL-2025-0043");
      expect(second.bolNumber).toBe("BOL-2025-0044");
    });
  });
});
