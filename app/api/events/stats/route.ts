import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/app/actions/events";

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[api/events/stats]", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
