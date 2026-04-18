import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("GET /api/orders", () => {
  it("returns only orders with status 'entered'", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    for (const order of body) {
      expect(order.status).toBe("entered");
    }
  });

  it("enriches each order with customer and items", async () => {
    const res = await GET();
    const body = await res.json();

    for (const order of body) {
      expect(order.customer).toBeTruthy();
      expect(order.customer.name).toEqual(expect.any(String));
      expect(Array.isArray(order.items)).toBe(true);
      for (const item of order.items) {
        expect(item.product).toBeTruthy();
        expect(item.product.sku).toEqual(expect.any(String));
      }
    }
  });
});
