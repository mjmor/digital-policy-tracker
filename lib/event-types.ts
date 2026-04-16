import type { DpaEvent, DpaApiRequest } from "./dpa-types";

export type ReviewStatus = "pending" | "reviewed" | "archived";

export interface StoredEvent {
  id: string;
  dpa_id: number;
  search_plan_id: string;
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

export interface SearchPlan {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  dpa_filters: string; // JSON string — deserialize with JSON.parse to get DpaApiRequest
  created_at: string;
}

export interface CreateSearchPlanInput {
  title: string;
  description?: string;
  url?: string;
  dpa_filters: DpaApiRequest;
}
