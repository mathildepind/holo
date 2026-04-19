import { describe, it, expect } from "vitest";
import { GET } from "./route";

const req = new Request("http://localhost/api/orders/1001");

describe("GET /api/orders/[id]", () => {
  it("returns the enriched order for a known id", async () => {
    const res = await GET(req, { params: { id: "1001" } });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.id).toBe(1001);
    expect(body.customer).toBeTruthy();
    expect(Array.isArray(body.items)).toBe(true);
  });

  it("returns 404 for an unknown id", async () => {
    const res = await GET(req, { params: { id: "99999" } });
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe("Order not found");
  });
});
