import { NextRequest, NextResponse } from "next/server";
import { getSearchPlan, deleteSearchPlan } from "@/app/actions/events";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getSearchPlan(id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ plan: result.plan });
  } catch (err) {
    console.error("[api/search-plans/[id] GET]", err);
    return NextResponse.json({ error: "Failed to get search plan" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteSearchPlan(id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Search plan not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/search-plans/[id] DELETE]", err);
    return NextResponse.json({ error: "Failed to delete search plan" }, { status: 500 });
  }
}
