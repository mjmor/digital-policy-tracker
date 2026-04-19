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
    <div style={styles.filterGrid}>
      {sections.map((section) => (
        <div key={section.label} style={styles.filterSection}>
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
    <div style={styles.accordion}>
      <button
        onClick={onToggle}
        style={styles.header}
        aria-expanded={isOpen}
      >
        <span style={styles.headerTitle}>Plan details</span>
        <span style={styles.chevron}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div style={styles.body}>
          <div style={styles.meta}>
            <span style={styles.metaItem}>Created {createdDate}</span>
            {plan.url && (
              <a
                href={plan.url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                External URL ↗
              </a>
            )}
          </div>

          {plan.description && (
            <p style={styles.description}>{plan.description}</p>
          )}

          <div style={styles.filterBlock}>
            <div style={styles.sectionLabel}>Filter configuration</div>
            <FilterSummary filters={filters} />
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  accordion: {
    border: "1px solid #e5e5e5",
    borderRadius: "8px",
    overflow: "hidden",
    marginBottom: "1.5rem",
  },
  header: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1.25rem",
    background: "#f5f5f5",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
  },
  headerTitle: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#444",
  },
  chevron: {
    fontSize: "0.65rem",
    color: "#888",
  },
  body: {
    padding: "1rem 1.25rem",
    background: "white",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  meta: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  metaItem: {
    fontSize: "0.8rem",
    color: "#666",
  },
  link: {
    fontSize: "0.8rem",
    color: "#2563eb",
    textDecoration: "none",
  },
  description: {
    fontSize: "0.8rem",
    color: "#555",
    margin: 0,
    lineHeight: 1.5,
  },
  filterBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  sectionLabel: {
    fontSize: "0.7rem",
    fontWeight: 600,
    textTransform: "uppercase",
    color: "#888",
    letterSpacing: "0.05em",
  },
  filterGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
  },
  filterSection: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    minWidth: "120px",
  },
  filterLabel: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#444",
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
  noFilters: {
    fontSize: "0.8rem",
    color: "#999",
    margin: 0,
  },
};
