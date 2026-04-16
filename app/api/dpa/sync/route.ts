import { NextRequest, NextResponse } from "next/server";
import { syncEvents } from "@/app/actions/events";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { searchPlanId } = body as { searchPlanId?: string };

    if (!searchPlanId) {
      return NextResponse.json({ error: "searchPlanId is required" }, { status: 400 });
    }

    const result = await syncEvents(searchPlanId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/dpa/sync]", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
