import { NextResponse } from "next/server";
import { getEnrichedBOLs } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json(getEnrichedBOLs());
}
