import { NextResponse } from "next/server";
import { getEnrichedOrder } from "@/lib/mock-data";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const order = getEnrichedOrder(Number(params.id));
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(order);
}
