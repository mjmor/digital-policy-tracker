"use client";

import type { DpaEvent } from "@/lib/dpa-types";

interface ResultsTableProps {
  data: DpaEvent[];
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
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Event Type</th>
            <th style={styles.th}>Policy Area</th>
            <th style={styles.th}>Implementers</th>
          </tr>
        </thead>
        <tbody>
          {data.map((event) => (
            <tr key={event.id} style={styles.row}>
              <td style={styles.td}>
                <a href={event.url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                  {event.id}
                </a>
              </td>
              <td style={styles.td}>
                <div style={styles.titleCell}>
                  <span style={styles.title}>{event.title}</span>
                  <span style={styles.instrument}>{event.policy_instrument}</span>
                </div>
              </td>
              <td style={styles.td}>{event.date}</td>
              <td style={styles.td}>
                <span style={{ ...styles.statusBadge, background: event.status === "adopted" ? "#dcfce7" : "#fef3c7", color: event.status === "adopted" ? "#166534" : "#92400e" }}>{event.status}</span>
              </td>
              <td style={styles.td}>{event.event_type}</td>
              <td style={styles.td}>{event.policy_area}</td>
              <td style={styles.td}>
                {event.implementers.map((impl) => impl.name).join(", ")}
              </td>
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
    maxWidth: "300px",
  },
  title: {
    fontWeight: 500,
  },
  instrument: {
    fontSize: "0.75rem",
    color: "#666",
  },
  statusBadge: {
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
