import { describe, it, expect } from "vitest";
import { createTestDb } from "./test-helpers";
import { customers, products } from "./schema";
import { getCustomerById, getProductById, getProductBySku } from "./queries";

describe("getCustomerById", () => {
  it("returns the customer row for a known id", () => {
    const db = createTestDb();
    db.insert(customers)
      .values({
        name: "Bay Leaf Markets",
        location: "Bay Leaf - Palo Alto",
        address: "2100 El Camino Real, Palo Alto, CA",
      })
      .run();

    const result = getCustomerById(db, 1);

    expect(result).toMatchObject({
      id: 1,
      name: "Bay Leaf Markets",
      location: "Bay Leaf - Palo Alto",
      address: "2100 El Camino Real, Palo Alto, CA",
    });
  });

  it("returns undefined for an unknown id", () => {
    const db = createTestDb();
    expect(getCustomerById(db, 999)).toBeUndefined();
  });
});

describe("getProductById / getProductBySku", () => {
  function seedSpringMix(db: ReturnType<typeof createTestDb>) {
    db.insert(products)
      .values({
        sku: "SKU-SPR-6X4",
        name: "Spring Mix",
        packSize: "6 x 4.5 oz",
        unitPrice: 18.5,
        scanPrefix: "og-9024",
      })
      .run();
  }

  it("returns the product row by id", () => {
    const db = createTestDb();
    seedSpringMix(db);

    expect(getProductById(db, 1)).toMatchObject({
      id: 1,
      sku: "SKU-SPR-6X4",
      name: "Spring Mix",
      packSize: "6 x 4.5 oz",
      unitPrice: 18.5,
      scanPrefix: "og-9024",
    });
  });

  it("returns the product row by sku", () => {
    const db = createTestDb();
    seedSpringMix(db);

    expect(getProductBySku(db, "SKU-SPR-6X4")?.name).toBe("Spring Mix");
  });

  it("rejects duplicate SKUs", () => {
    const db = createTestDb();
    seedSpringMix(db);

    expect(() => seedSpringMix(db)).toThrow();
  });

  it("returns undefined for unknown id or sku", () => {
    const db = createTestDb();
    expect(getProductById(db, 999)).toBeUndefined();
    expect(getProductBySku(db, "SKU-MISSING")).toBeUndefined();
  });
});
