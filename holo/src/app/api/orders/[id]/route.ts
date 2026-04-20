import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getEnrichedOrder } from "@/db/queries";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const order = getEnrichedOrder(getDb(), Number(params.id));
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(order);
}
