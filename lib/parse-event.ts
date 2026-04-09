import type { StoredEvent, ParsedStoredEvent } from "@/lib/event-types";

export function parseStoredEvent(raw: StoredEvent): ParsedStoredEvent {
  return {
    ...raw,
    implementers: JSON.parse(raw.implementers),
    economic_activities: JSON.parse(raw.economic_activities),
  };
}
