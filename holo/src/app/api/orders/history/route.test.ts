import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("GET /api/orders/history", () => {
  it("returns every order enriched with customer + items, regardless of status", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);

    // Covers both "entered" and "delivered" orders from mock data
    const statuses = new Set(body.map((o: { status: string }) => o.status));
    expect(statuses.has("entered")).toBe(true);
    expect(statuses.has("delivered")).toBe(true);

    for (const order of body) {
      expect(order.customer.name).toEqual(expect.any(String));
      expect(Array.isArray(order.items)).toBe(true);
    }
  });
});
