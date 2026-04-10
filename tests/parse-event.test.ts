import { describe, it, expect } from "vitest";
import type { StoredEvent } from "../lib/event-types";
import { parseStoredEvent } from "../lib/parse-event";

describe("parseStoredEvent", () => {
  it("parses implementers and economic_activities from JSON strings", () => {
    const raw: StoredEvent = {
      id: "abc-123",
      dpa_id: 20442,
      title: "Singapore AI Governance Framework",
      url: "https://example.com",
      description: "A test event",
      date: "2024-01-21",
      status: "adopted",
      event_type: "outline",
      action_type: "adoption",
      implementers: '[{"name":"Singapore","id":702}]',
      policy_area: "Design and testing standards",
      policy_instrument: "AI governance",
      economic_activities: '[{"name":"ML and AI development","id":9}]',
      implementation_level: "national",
      synced_at: "2024-01-01T00:00:00.000Z",
      review_status: "pending",
      reviewed_at: null,
      archived_at: null,
    };

    const result = parseStoredEvent(raw);

    expect(result.implementers).toEqual([{ name: "Singapore", id: 702 }]);
    expect(result.economic_activities).toEqual([
      { name: "ML and AI development", id: 9 },
    ]);
    expect(result.title).toBe("Singapore AI Governance Framework");
    expect(result.review_status).toBe("pending");
  });

  it("handles empty JSON arrays", () => {
    const raw: StoredEvent = {
      id: "abc-123",
      dpa_id: 1,
      title: "Empty Event",
      url: "https://example.com",
      description: "",
      date: "2024-01-01",
      status: "proposed",
      event_type: "order",
      action_type: "order",
      implementers: "[]",
      policy_area: "",
      policy_instrument: "",
      economic_activities: "[]",
      implementation_level: "national",
      synced_at: "2024-01-01T00:00:00.000Z",
      review_status: "pending",
      reviewed_at: null,
      archived_at: null,
    };

    const result = parseStoredEvent(raw);

    expect(result.implementers).toEqual([]);
    expect(result.economic_activities).toEqual([]);
  });

  it("returns all other fields unchanged", () => {
    const raw: StoredEvent = {
      id: "xyz-789",
      dpa_id: 99999,
      title: "EU AI Act",
      url: "https://example.com/eu",
      description: "Full text description",
      date: "2024-08-01",
      status: "adopted",
      event_type: "law",
      action_type: "adoption",
      implementers: '[{"name":"European Union","id":100}]',
      policy_area: "Data governance",
      policy_instrument: "Regulation",
      economic_activities: '[{"name":"cross-cutting","id":1}]',
      implementation_level: "supranational",
      synced_at: "2024-08-01T12:00:00.000Z",
      review_status: "reviewed",
      reviewed_at: "2024-08-02T09:00:00.000Z",
      archived_at: null,
    };

    const result = parseStoredEvent(raw);

    expect(result.id).toBe("xyz-789");
    expect(result.dpa_id).toBe(99999);
    expect(result.status).toBe("adopted");
    expect(result.review_status).toBe("reviewed");
    expect(result.reviewed_at).toBe("2024-08-02T09:00:00.000Z");
  });
});
