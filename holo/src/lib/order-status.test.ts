import { describe, it, expect } from "vitest";
import { resolveStatus, bolsByOrderId } from "./order-status";
import type { EnrichedBOL, EnrichedOrder } from "./types";

function makeOrder(id: number, status: EnrichedOrder["status"]): EnrichedOrder {
  return {
    id,
    customerId: 1,
    poNumber: `PO-${id}`,
    requestedDelivery: "2025-04-16",
    plannedShip: "2025-04-15",
    status,
    enteredAt: "2025-04-14T17:30:00Z",
    customer: { id: 1, name: "Test Co", location: "Test", address: "1 Test St" },
    items: [],
  };
}

function makeBOL(id: number, orderId: number, bolNumber: string): EnrichedBOL {
  return {
    id,
    bolNumber,
    packRecordId: id,
    shipmentId: id,
    palletCount: 1,
    totalWeight: 100,
    tempRequirements: "34-38°F",
    generatedBy: "L. Greens",
    generatedAt: "2025-04-15T06:00:00Z",
    packRecord: {
      id,
      orderId,
      status: "locked",
      packedBy: "L. Greens",
      notes: "",
      verifiedAt: "2025-04-15T06:00:00Z",
      order: makeOrder(orderId, "entered"),
      items: [],
    },
    shipment: {
      id,
      carrierId: 1,
      shipDate: "2025-04-15",
      status: "scheduled",
      departedAt: null,
      deliveredAt: null,
      carrier: { id: 1, name: "Hippo Truck", type: "internal" },
    },
  };
}

describe("resolveStatus", () => {
  it("returns 'Shipped' when a BOL exists, regardless of the order's own status", () => {
    const order = makeOrder(101, "entered");
    const bol = makeBOL(1, 101, "BOL-2025-0001");
    expect(resolveStatus(order, bol)).toEqual({ label: "Shipped", color: "var(--green)" });
  });

  it("returns 'Open' for an 'entered' order with no BOL", () => {
    expect(resolveStatus(makeOrder(101, "entered"), undefined)).toEqual({
      label: "Open",
      color: "var(--amber)",
    });
  });

  it("falls back to the raw status for non-entered orders with no BOL", () => {
    expect(resolveStatus(makeOrder(102, "fulfilled"), undefined)).toEqual({
      label: "fulfilled",
      color: "var(--text-muted)",
    });
  });
});

describe("bolsByOrderId", () => {
  it("maps each BOL to its order id", () => {
    const bols = [makeBOL(1, 101, "BOL-A"), makeBOL(2, 102, "BOL-B")];
    const map = bolsByOrderId(bols);
    expect(map.size).toBe(2);
    expect(map.get(101)?.bolNumber).toBe("BOL-A");
    expect(map.get(102)?.bolNumber).toBe("BOL-B");
  });

  it("keeps the first BOL when two share the same order id (caller controls precedence via order)", () => {
    // Simulates a locally-stored BOL listed before the mock BOL for the same order.
    const stored = makeBOL(99, 101, "BOL-LOCAL");
    const mock = makeBOL(1, 101, "BOL-MOCK");
    const map = bolsByOrderId([stored, mock]);
    expect(map.get(101)?.bolNumber).toBe("BOL-LOCAL");
  });

  it("returns an empty map for no input", () => {
    expect(bolsByOrderId([]).size).toBe(0);
  });
});
