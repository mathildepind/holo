import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { getEnrichedBOLs } from "@/db/queries";

export async function GET() {
  return NextResponse.json(getEnrichedBOLs(getDb()));
}
