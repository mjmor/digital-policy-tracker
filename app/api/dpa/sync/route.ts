import { NextRequest, NextResponse } from "next/server";
import { syncEvents } from "@/app/actions/events";
import type { DpaApiRequest } from "@/lib/dpa-types";

export async function POST(request: NextRequest) {
  try {
    // Default sync params: last 60 days, newest first
    const params: DpaApiRequest = {
      limit: 500,
      sorting: "-date",
      request_data: {
        event_period: [
          new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          new Date().toISOString().slice(0, 10),
        ],
      },
    };

    const result = await syncEvents(params);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/dpa/sync]", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
