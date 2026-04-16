import { NextRequest, NextResponse } from "next/server";
import { getReviewQueue } from "@/app/actions/events";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchPlanId = url.searchParams.get("searchPlanId");
    if (!searchPlanId) {
      return NextResponse.json({ error: "searchPlanId query parameter is required" }, { status: 400 });
    }
    const days = parseInt(url.searchParams.get("days") ?? "365", 10);
    const { events } = await getReviewQueue(searchPlanId, days);
    return NextResponse.json({ events });
  } catch (err) {
    console.error("[api/events/queue]", err);
    return NextResponse.json({ error: "Failed to load queue" }, { status: 500 });
  }
}
