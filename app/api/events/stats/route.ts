import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/app/actions/events";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchPlanId = url.searchParams.get("searchPlanId");
    if (!searchPlanId) {
      return NextResponse.json({ error: "searchPlanId query parameter is required" }, { status: 400 });
    }
    const stats = await getStats(searchPlanId);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[api/events/stats]", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
