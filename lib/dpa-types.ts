// Types for the DPA API

export interface DpaApiRequest {
  limit?: number;
  offset?: number;
  sorting?: string;
  request_data?: {
    gta_evaluation?: number[];
    affected_flow?: number[];
    affected?: number[];
    keep_affected?: boolean;
    implementer?: number[];
    keep_implementer?: boolean;
    intervention_types?: number[];
    keep_intervention_types?: boolean;
    mast_chapters?: number[];
    keep_mast_chapters?: boolean;
    implementation_level?: number[];
    keep_implementation_level?: boolean;
    eligible_firms?: number[];
    keep_eligible_firms?: boolean;
    announcement_period?: [string, string | null];
    implementation_period?: [string, string | null];
    keep_implementation_na?: boolean;
    revocation_period?: [string, string | null];
    keep_revocation_na?: boolean;
    submission_period?: [string, string | null];
    in_force_on_date?: string;
    keep_in_force_on_date?: boolean;
    affected_sectors?: number[];
    keep_affected_sectors?: boolean;
    affected_products?: number[];
    keep_affected_products?: boolean;
    intervention_id?: number[];
    keep_intervention_id?: boolean;
    lag_adjustment?: string;
  };
}

export interface Jurisdiction {
  id: number;
  name: string;
  iso: string;
}

export interface JurisdictionGroup {
  name: string;
}

export interface AffectedProduct {
  product_id: number;
  prior_level: string;
  new_level: string;
  unit: string | null;
}

export interface DpaIntervention {
  intervention_id: number;
  state_act_id: number;
  state_act_title: string;
  intervention_url: string;
  state_act_url: string;
  gta_evaluation: string;
  implementing_jurisdictions: Jurisdiction[];
  implementing_jurisdiction_groups: JurisdictionGroup[];
  affected_jurisdictions: Jurisdiction[];
  inferred_jurisdictions: string;
  implementation_level: string;
  eligible_firm: string;
  intervention_type: string;
  mast_chapter: string;
  mast_subchapter: string;
  affected_sectors: number[];
  affected_products: number[] | AffectedProduct[];
  date_announced: string | null;
  date_published: string | null;
  date_implemented: string | null;
  date_removed: string | null;
  is_in_force: number;
}

export interface DpaApiResponse extends Array<DpaIntervention> {}

export type { DpaIntervention as Intervention };
