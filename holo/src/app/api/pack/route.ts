import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { createPackAndBOL, getEnrichedOrder } from "@/db/queries";

type DraftItem = {
  productId: number;
  quantityPacked: number;
  discrepancyNote: string | null;
};

function isDraftItem(v: unknown): v is DraftItem {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.productId === "number" &&
    typeof o.quantityPacked === "number" &&
    (o.discrepancyNote === null || typeof o.discrepancyNote === "string")
  );
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = body as Record<string, unknown>;
  if (
    typeof parsed?.orderId !== "number" ||
    !Array.isArray(parsed?.draftItems) ||
    !parsed.draftItems.every(isDraftItem) ||
    typeof parsed?.packNotes !== "string"
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getDb();
  if (!getEnrichedOrder(db, parsed.orderId)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const result = createPackAndBOL(db, {
    orderId: parsed.orderId,
    draftItems: parsed.draftItems as DraftItem[],
    packNotes: parsed.packNotes,
  });
  return NextResponse.json(result);
}
