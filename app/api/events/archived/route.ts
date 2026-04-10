import { NextRequest, NextResponse } from "next/server";
import { getArchived } from "@/app/actions/events";

export async function GET() {
  try {
    const { events } = await getArchived();
    return NextResponse.json({ events });
  } catch (err) {
    console.error("[api/events/archived]", err);
    return NextResponse.json({ error: "Failed to load archived" }, { status: 500 });
  }
}
