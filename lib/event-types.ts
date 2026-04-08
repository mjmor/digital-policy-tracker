import type { DpaEvent } from "./dpa-types";

export type ReviewStatus = "pending" | "reviewed" | "archived";

export interface StoredEvent {
  id: string;
  dpa_id: number;
  title: string;
  url: string;
  description: string;
  date: string;
  status: string;
  event_type: string;
  action_type: string;
  implementers: string; // JSON
  policy_area: string;
  policy_instrument: string;
  economic_activities: string; // JSON
  implementation_level: string;
  synced_at: string;
  review_status: ReviewStatus;
  reviewed_at: string | null;
  archived_at: string | null;
}

export interface ParsedStoredEvent extends Omit<StoredEvent, "implementers" | "economic_activities"> {
  implementers: { name: string; id: number }[];
  economic_activities: { name: string; id: number }[];
}
