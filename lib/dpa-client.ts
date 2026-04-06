import type { DpaApiRequest, DpaApiResponse } from "./dpa-types";

export async function queryDpaApi(
  params: DpaApiRequest
): Promise<{ data?: DpaApiResponse; error?: string }> {
  try {
    const response = await fetch("/api/dpa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { error: string };
      return { error: errorData.error || "API request failed" };
    }

    const data = (await response.json()) as DpaApiResponse;
    return { data };
  } catch (error) {
    return { error: "Network error" };
  }
}
