import { NextRequest, NextResponse } from "next/server";
import { reviewEvent, archiveEvent, restoreEvent, deleteEvent } from "@/app/actions/events";

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").at(-2)!; // .../[id]/review → index -2
    const action = url.pathname.endsWith("/review")
      ? "review"
      : url.pathname.endsWith("/archive")
      ? "archive"
      : "restore";

    let result: { success: boolean };

    switch (action) {
      case "review":
        result = await reviewEvent(id);
        break;
      case "archive":
        result = await archiveEvent(id);
        break;
      case "restore":
        result = await restoreEvent(id);
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[api/events/[id] POST]`, err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split("/").at(-2)!;
    const result = await deleteEvent(id);

    if (!result.success) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[api/events/[id] DELETE]`, err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
