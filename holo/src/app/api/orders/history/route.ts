import { NextResponse } from "next/server";
import { getAllEnrichedOrders } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(getAllEnrichedOrders());
}
