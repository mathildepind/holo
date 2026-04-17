import { NextResponse } from "next/server";
import { getInventoryAvailability } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(getInventoryAvailability());
}
