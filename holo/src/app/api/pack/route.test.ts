import { describe, it, expect } from "vitest";
import { POST } from "./route";

function postReq(body: unknown) {
  return new Request("http://test/api/pack", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/pack", () => {
  it("locks a pack record, creates a BOL, and returns the BOL number", async () => {
    const res = await POST(
      postReq({
        orderId: 1004,
        draftItems: [
          { productId: 1, quantityPacked: 4, discrepancyNote: null },
          { productId: 3, quantityPacked: 3, discrepancyNote: null },
          { productId: 7, quantityPacked: 2, discrepancyNote: null },
        ],
        packNotes: "Clean pack.",
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bolNumber).toMatch(/^BOL-\d{4}-\d{4}$/);
    expect(body.bolId).toEqual(expect.any(Number));
  });

  it("returns 404 when the order does not exist", async () => {
    const res = await POST(
      postReq({
        orderId: 9999,
        draftItems: [{ productId: 1, quantityPacked: 1, discrepancyNote: null }],
        packNotes: "",
      })
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when the body is missing required fields", async () => {
    const res = await POST(postReq({ orderId: 1004 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when the body is not valid JSON", async () => {
    const res = await POST(
      new Request("http://test/api/pack", {
        method: "POST",
        body: "not-json",
      })
    );
    expect(res.status).toBe(400);
  });
});
