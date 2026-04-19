import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("GET /api/inventory", () => {
  it("returns availability for every product with gap = available - committed", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    for (const row of body) {
      expect(row.product.sku).toEqual(expect.any(String));
      expect(row.totalAvailable).toBe(row.freshCases + row.coolerCases);
      expect(row.gap).toBe(row.totalAvailable - row.totalCommitted);
    }
  });
});
