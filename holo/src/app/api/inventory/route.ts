import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getInventoryAvailability } from "@/db/queries";

export async function GET() {
  return NextResponse.json(getInventoryAvailability(getDb()));
}
