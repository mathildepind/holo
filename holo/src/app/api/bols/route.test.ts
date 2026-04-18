import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("GET /api/bols", () => {
  it("returns enriched BOLs with pack record, shipment and carrier joined", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    for (const bol of body) {
      expect(bol.bolNumber).toMatch(/^BOL-/);
      expect(bol.packRecord).toBeTruthy();
      expect(bol.packRecord.order.customer.name).toEqual(expect.any(String));
      expect(bol.shipment).toBeTruthy();
      expect(bol.shipment.carrier.name).toEqual(expect.any(String));
    }
  });
});
