import { NextRequest, NextResponse } from "next/server";
import { listSearchPlans, createSearchPlan } from "@/app/actions/events";

export async function GET() {
  try {
    const { plans } = await listSearchPlans();
    return NextResponse.json({ plans });
  } catch (err) {
    console.error("[api/search-plans GET]", err);
    return NextResponse.json({ error: "Failed to list search plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createSearchPlan(body);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ plan: result.plan }, { status: 201 });
  } catch (err) {
    console.error("[api/search-plans POST]", err);
    return NextResponse.json({ error: "Failed to create search plan" }, { status: 500 });
  }
}
