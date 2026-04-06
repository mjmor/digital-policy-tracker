import { NextRequest, NextResponse } from "next/server";
import type { DpaApiRequest, DpaApiResponse } from "@/lib/dpa-types";

const DPA_API_URL = "https://api.globaltradealert.org/api/v1/dpa/events/";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DpaApiRequest;
    const apiKey = process.env.DPA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "DPA_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Validate limit
    if (body.limit !== undefined && (body.limit < 0 || body.limit > 1000)) {
      return NextResponse.json(
        { error: "limit must be between 0 and 1000" },
        { status: 400 }
      );
    }

    const response = await fetch(DPA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `APIKey ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `DPA API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = (await response.json()) as DpaApiResponse;
    return NextResponse.json(data);
  } catch (error) {
    console.error("DPA API proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
