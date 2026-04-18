"use client";

import type { SearchPlan } from "@/lib/event-types";
import type { DpaApiRequest } from "@/lib/dpa-types";
import {
  JURISDICTIONS,
  ECONOMIC_ACTIVITY,
  GOVERNMENT_BRANCH,
  EVENT_TYPE,
  POLICY_AREA,
  IMPLEMENTATION_LEVEL,
} from "@/lib/dpa-types";

interface PlanDrawerProps {
  plan: SearchPlan;
  isOpen: boolean;
  onToggle: () => void;
}

function FilterSummary({ filters }: { filters: DpaApiRequest }) {
  const rd = filters.request_data;
  if (!rd) return <p style={styles.noFilters}>No filters set.</p>;

  const sections: { label: string; values: string[] }[] = [];

  if (rd.implementing_jurisdiction?.length) {
    sections.push({
      label: "Jurisdictions",
      values: rd.implementing_jurisdiction.map((id) => JURISDICTIONS[id] ?? String(id)),
    });
  }
  if (rd.economic_activity?.length) {
    sections.push({
      label: "Economic activities",
      values: rd.economic_activity.map((id) => ECONOMIC_ACTIVITY[id] ?? String(id)),
    });
  }
  if (rd.government_branch?.length) {
    sections.push({
      label: "Government branches",
      values: rd.government_branch.map((id) => GOVERNMENT_BRANCH[id] ?? String(id)),
    });
  }
  if (rd.event_type?.length) {
    sections.push({
      label: "Event types",
      values: rd.event_type.map((id) => EVENT_TYPE[id] ?? String(id)),
    });
  }
  if (rd.policy_area?.length) {
    sections.push({
      label: "Policy areas",
      values: rd.policy_area.map((id) => POLICY_AREA[id] ?? String(id)),
    });
  }
  if (rd.implementation_level?.length) {
    sections.push({
      label: "Implementation levels",
      values: rd.implementation_level.map((id) => IMPLEMENTATION_LEVEL[id] ?? String(id)),
    });
  }
  if (rd.event_period) {
    const [start, end] = rd.event_period;
    sections.push({
      label: "Event period",
      values: [end ? `${start} – ${end}` : `From ${start}`],
    });
  }

  if (sections.length === 0) return <p style={styles.noFilters}>No filters set.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {sections.map((section) => (
        <div key={section.label}>
          <div style={styles.filterLabel}>{section.label}</div>
          <div style={styles.filterTags}>
            {section.values.map((v) => (
              <span key={v} style={styles.filterTag}>{v}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PlanDrawer({ plan, isOpen, onToggle }: PlanDrawerProps) {
  let filters: DpaApiRequest = {};
  try {
    filters = JSON.parse(plan.dpa_filters);
  } catch {
    // leave filters empty
  }

  const createdDate = new Date(plan.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={styles.wrapper}>
      <button
        onClick={onToggle}
        style={styles.toggleBtn}
        title={isOpen ? "Hide plan details" : "Show plan details"}
        aria-label={isOpen ? "Hide plan details" : "Show plan details"}
      >
        {isOpen ? "›" : "‹"}
      </button>

      {isOpen && (
        <div style={styles.panel}>
          <h2 style={styles.planTitle}>{plan.title}</h2>
          <p style={styles.createdDate}>Created {createdDate}</p>

          {plan.url && (
            <div style={styles.section}>
              <div style={styles.sectionLabel}>External URL</div>
              <a
                href={plan.url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                {plan.url}
              </a>
            </div>
          )}

          {plan.description && (
            <div style={styles.section}>
              <div style={styles.sectionLabel}>Description</div>
              <p style={styles.description}>{plan.description}</p>
            </div>
          )}

          <div style={styles.section}>
            <div style={styles.sectionLabel}>Filter configuration</div>
            <FilterSummary filters={filters} />
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexShrink: 0,
    gap: "0.5rem",
    alignItems: "flex-start",
  },
  toggleBtn: {
    width: "24px",
    padding: "0.5rem 0.25rem",
    background: "#f0f0f0",
    border: "1px solid #e5e5e5",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
    color: "#555",
    flexShrink: 0,
  },
  panel: {
    width: "280px",
    flexShrink: 0,
    padding: "1.25rem",
    background: "#fafafa",
    border: "1px solid #e5e5e5",
    borderRadius: "8px",
    overflowY: "auto",
    maxHeight: "80vh",
  },
  planTitle: {
    fontSize: "1rem",
    fontWeight: 700,
    margin: "0 0 0.25rem 0",
    color: "#171717",
  },
  createdDate: {
    fontSize: "0.75rem",
    color: "#999",
    margin: "0 0 1rem 0",
  },
  section: {
    marginBottom: "1rem",
  },
  sectionLabel: {
    fontSize: "0.7rem",
    fontWeight: 600,
    textTransform: "uppercase",
    color: "#888",
    letterSpacing: "0.05em",
    marginBottom: "0.375rem",
  },
  link: {
    color: "#2563eb",
    fontSize: "0.8rem",
    wordBreak: "break-all",
    textDecoration: "none",
  },
  description: {
    fontSize: "0.8rem",
    color: "#555",
    margin: 0,
    lineHeight: 1.5,
  },
  noFilters: {
    fontSize: "0.8rem",
    color: "#999",
    margin: 0,
  },
  filterLabel: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#444",
    marginBottom: "0.25rem",
  },
  filterTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.25rem",
  },
  filterTag: {
    display: "inline-block",
    padding: "0.125rem 0.4rem",
    background: "#e8e8e8",
    borderRadius: "4px",
    fontSize: "0.7rem",
    color: "#444",
  },
};
