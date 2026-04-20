import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getOpenOrders } from "@/db/queries";

export async function GET() {
  return NextResponse.json(getOpenOrders(getDb()));
}
