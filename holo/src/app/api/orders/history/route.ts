import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getAllEnrichedOrders } from "@/db/queries";

export async function GET() {
  return NextResponse.json(getAllEnrichedOrders(getDb()));
}
