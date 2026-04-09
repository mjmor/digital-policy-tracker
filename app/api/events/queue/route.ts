import { NextRequest, NextResponse } from "next/server";
import { getReviewQueue } from "@/app/actions/events";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get("days") ?? "30", 10);
    const { events } = await getReviewQueue(days);
    return NextResponse.json({ events });
  } catch (err) {
    console.error("[api/events/queue]", err);
    return NextResponse.json({ error: "Failed to load queue" }, { status: 500 });
  }
}
