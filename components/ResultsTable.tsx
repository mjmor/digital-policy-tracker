"use client";

import type { DpaIntervention } from "@/lib/dpa-types";

interface ResultsTableProps {
  data: DpaIntervention[];
  isLoading: boolean;
  error?: string;
}

export default function ResultsTable({ data, isLoading, error }: ResultsTableProps) {
  if (isLoading) {
    return <div style={styles.state}>Loading...</div>;
  }

  if (error) {
    return <div style={{ ...styles.state, color: "#dc2626" }}>Error: {error}</div>;
  }

  if (!data || data.length === 0) {
    return <div style={styles.state}>No results found. Try adjusting your filters.</div>;
  }

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Title</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Evaluation</th>
            <th style={styles.th}>Implemented</th>
            <th style={styles.th}>In Force</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.intervention_id} style={styles.row}>
              <td style={styles.td}>
                <a
                  href={item.intervention_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  {item.intervention_id}
                </a>
              </td>
              <td style={styles.td}>
                <div style={styles.titleCell}>
                  <span style={styles.title}>{item.state_act_title}</span>
                  <span style={styles.jurisdictions}>
                    {item.implementing_jurisdictions.map((j) => j.name).join(", ")}
                  </span>
                </div>
              </td>
              <td style={styles.td}>{item.intervention_type}</td>
              <td style={styles.td}>
                <span
                  style={{
                    ...styles.badge,
                    background:
                      item.gta_evaluation === "Red"
                        ? "#fee2e2"
                        : item.gta_evaluation === "Amber"
                        ? "#fef3c7"
                        : "#dcfce7",
                    color:
                      item.gta_evaluation === "Red"
                        ? "#991b1b"
                        : item.gta_evaluation === "Amber"
                        ? "#92400e"
                        : "#166534",
                  }}
                >
                  {item.gta_evaluation}
                </span>
              </td>
              <td style={styles.td}>{item.date_implemented || "—"}</td>
              <td style={styles.td}>{item.is_in_force ? "✓" : "✗"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    overflowX: "auto",
    border: "1px solid #e5e5e5",
    borderRadius: "8px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.875rem",
  },
  th: {
    textAlign: "left",
    padding: "0.75rem 1rem",
    background: "#f5f5f5",
    fontWeight: 600,
    borderBottom: "1px solid #e5e5e5",
  },
  td: {
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #e5e5e5",
    verticalAlign: "top",
  },
  row: {
    transition: "background 0.15s",
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
  },
  titleCell: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  title: {
    fontWeight: 500,
  },
  jurisdictions: {
    fontSize: "0.75rem",
    color: "#666",
  },
  badge: {
    display: "inline-block",
    padding: "0.25rem 0.5rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: 500,
  },
  state: {
    padding: "3rem",
    textAlign: "center",
    color: "#666",
    background: "#f9f9f9",
    borderRadius: "8px",
  },
};
