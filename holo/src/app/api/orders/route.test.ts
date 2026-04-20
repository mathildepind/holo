import { describe, it, expect } from "vitest";
import { GET } from "./route";
import { DEMO_TODAY } from "@/lib/demo-config";

function addDaysISO(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

describe("GET /api/orders", () => {
  it("returns orders delivering today or tomorrow that are not yet delivered", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    const tomorrow = addDaysISO(DEMO_TODAY, 1);
    for (const order of body) {
      expect([DEMO_TODAY, tomorrow]).toContain(order.requestedDelivery);
      expect(order.status).not.toBe("delivered");
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
