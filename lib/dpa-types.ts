// Types for the DPA Events API

export interface DpaApiRequest {
  limit?: number;
  offset?: number;
  sorting?: string;
  request_data?: {
    implementing_jurisdiction?: number[];
    economic_activity?: number[];
    government_branch?: number[];
    event_type?: number[];
    policy_area?: number[];
    implementation_level?: number[];
    event_period?: [string, string | null];
  };
}

export interface DpaEvent {
  id: number;
  title: string;
  url: string;
  description: string;
  date: string;
  status: string;
  event_type: string;
  action_type: string;
  implementers: { name: string; id: number }[];
  implementer_groups: { name: string }[];
  policy_area: string;
  policy_instrument: string;
  economic_activities: { name: string; id: number }[];
  implementation_level: string;
}

export interface DpaApiResponse extends Array<DpaEvent> {}

// Value mappings for DPA filters
export const ECONOMIC_ACTIVITY: Record<number, string> = {
  1: "cross-cutting",
  2: "infrastructure provider: internet and telecom services",
  4: "online advertising provider",
  5: "digital payment provider",
  6: "platform intermediary: user-generated content",
  7: "streaming service provider",
  8: "platform intermediary: e-commerce",
  9: "ML and AI development",
  10: "other service provider",
  11: "unspecified",
  12: "technological consumer goods",
  13: "semiconductors",
  14: "software provider: app stores",
  15: "DLT development",
  16: "search service provider",
  17: "software provider: other software",
  18: "messaging service provider",
  19: "platform intermediary: other",
  20: "infrastructure provider: cloud computing",
  21: "infrastructure provider: network hardware",
  22: "infrastructure provider: other",
};

export const GOVERNMENT_BRANCH: Record<number, string> = {
  1: "legislature",
  2: "executive",
  3: "judiciary",
};

export const EVENT_TYPE: Record<number, string> = {
  1: "order",
  2: "outline",
  3: "inquiry",
  4: "decision",
  5: "law",
  6: "treaty",
  8: "public lawsuit",
  9: "investigation",
  10: "declaration",
  11: "civil lawsuit",
};

export const POLICY_AREA: Record<number, string> = {
  1: "International trade",
  2: "Competition",
  3: "Content moderation",
  4: "Data governance",
  5: "Subsidies and industrial policy",
  6: "Instrument unspecified",
  8: "Other operating conditions",
  9: "Public procurement",
  10: "Authorisation, registration and licensing",
  11: "Taxation",
  12: "Foreign direct investment",
  13: "Labour law",
  14: "Intellectual property",
  15: "Consumer protection",
  16: "Design and testing standards",
  17: "Regulatory Compliance and Transparency",
};

export const IMPLEMENTATION_LEVEL: Record<number, string> = {
  1: "national",
  2: "supranational",
  3: "subnational",
  4: "bi- or plurilateral agreement",
  5: "multilateral agreement",
  6: "other",
};

// Key jurisdictions (subset for common filters)
export const JURISDICTIONS: Record<number, string> = {
  840: "United States",
  156: "China",
  276: "Germany",
  251: "France",
  826: "United Kingdom",
  381: "Italy",
  724: "Spain",
  392: "Japan",
  410: "South Korea",
  356: "India",
  864: "Brazil",
  124: "Canada",
  36: "Australia",
  752: "Sweden",
  578: "Norway",
  246: "Finland",
  208: "Denmark",
  528: "Netherlands",
  756: "Switzerland",
  682: "Saudi Arabia",
  634: "Qatar",
  784: "United Arab Emirates",
  414: "Kuwait",
  516: "Namibia",
  710: "South Africa",
};
