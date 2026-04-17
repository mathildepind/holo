import { NextResponse } from "next/server";
import { getOpenOrders } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(getOpenOrders());
}
