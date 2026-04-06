"use client";

import { useState } from "react";
import type { DpaApiRequest } from "@/lib/dpa-types";
import { JURISDICTIONS, GTA_EVALUATION, IMPLEMENTATION_LEVEL } from "@/lib/dpa-mappings";

interface FilterPanelProps {
  onSearch: (params: DpaApiRequest) => void;
  isLoading: boolean;
}

export default function FilterPanel({ onSearch, isLoading }: FilterPanelProps) {
  const [limit, setLimit] = useState(100);
  const [sorting, setSorting] = useState("-date_announced");
  const [gtaEvaluation, setGtaEvaluation] = useState<number[]>([]);
  const [implementer, setImplementer] = useState<number[]>([]);
  const [affected, setAffected] = useState<number[]>([]);
  const [inForceToday, setInForceToday] = useState(true);
  const [announcementFrom, setAnnouncementFrom] = useState("2020-01-01");
  const [announcementTo, setAnnouncementTo] = useState<string | null>(null);
  const [implementationFrom, setImplementationFrom] = useState<string | null>(null);
  const [implementationTo, setImplementationTo] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const requestData: DpaApiRequest["request_data"] = {};

    if (gtaEvaluation.length > 0) {
      requestData.gta_evaluation = gtaEvaluation;
    }
    if (implementer.length > 0) {
      requestData.implementer = implementer;
      requestData.keep_implementer = true;
    }
    if (affected.length > 0) {
      requestData.affected = affected;
      requestData.keep_affected = true;
    }
    if (announcementFrom || announcementTo) {
      requestData.announcement_period = [announcementFrom || "2009-01-01", announcementTo];
    }
    if (implementationFrom || implementationTo) {
      requestData.implementation_period = [implementationFrom, implementationTo];
    }
    if (inForceToday) {
      requestData.in_force_today = true;
    }

    onSearch({
      limit,
      sorting,
      request_data: requestData,
    });
  };

  const toggleArrayValue = (
    arr: number[],
    setArr: React.Dispatch<React.SetStateAction<number[]>>,
    val: number
  ) => {
    if (arr.includes(val)) {
      setArr(arr.filter((v) => v !== val));
    } else {
      setArr([...arr, val]);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.row}>
        <label style={styles.label}>
          Results per page:
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Math.min(1000, Math.max(0, parseInt(e.target.value) || 0)))}
            min={0}
            max={1000}
            style={styles.input}
          />
        </label>

        <label style={styles.label}>
          Sort by:
          <select value={sorting} onChange={(e) => setSorting(e.target.value)} style={styles.select}>
            <option value="-date_announced">Date announced (newest)</option>
            <option value="date_announced">Date announced (oldest)</option>
            <option value="-date_published">Date published (newest)</option>
            <option value="date_published">Date published (oldest)</option>
            <option value="-date_implemented">Date implemented (newest)</option>
            <option value="date_implemented">Date implemented (oldest)</option>
          </select>
        </label>

        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={inForceToday}
            onChange={(e) => setInForceToday(e.target.checked)}
          />
          In force today only
        </label>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>GTA Evaluation</h3>
        <div style={styles.chipGroup}>
          {Object.entries(GTA_EVALUATION).map(([id, label]) => (
            <label key={id} style={styles.chip}>
              <input
                type="checkbox"
                checked={gtaEvaluation.includes(parseInt(id))}
                onChange={() => toggleArrayValue(gtaEvaluation, setGtaEvaluation, parseInt(id))}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Implementing Jurisdictions</h3>
        <div style={styles.chipGroup}>
          {Object.entries(JURISDICTIONS)
            .slice(0, 20)
            .map(([id, name]) => (
              <label key={id} style={styles.chip}>
                <input
                  type="checkbox"
                  checked={implementer.includes(parseInt(id))}
                  onChange={() => toggleArrayValue(implementer, setImplementer, parseInt(id))}
                />
                {name}
              </label>
            ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Announcement Period</h3>
        <div style={styles.row}>
          <label style={styles.label}>
            From:
            <input
              type="date"
              value={announcementFrom}
              onChange={(e) => setAnnouncementFrom(e.target.value)}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            To:
            <input
              type="date"
              value={announcementTo ?? ""}
              onChange={(e) => setAnnouncementTo(e.target.value || null)}
              style={styles.input}
            />
          </label>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Implementation Level</h3>
        <div style={styles.chipGroup}>
          {Object.entries(IMPLEMENTATION_LEVEL).map(([id, label]) => (
            <label key={id} style={styles.chip}>
              <input type="checkbox" checked={false} onChange={() => {}} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <button type="submit" disabled={isLoading} style={styles.button}>
        {isLoading ? "Searching..." : "Search"}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    padding: "1.5rem",
    background: "#f9f9f9",
    borderRadius: "8px",
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    alignItems: "center",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  sectionTitle: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    margin: 0,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    fontSize: "0.875rem",
  },
  input: {
    padding: "0.5rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "0.875rem",
  },
  select: {
    padding: "0.5rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "0.875rem",
    background: "white",
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  chipGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.375rem 0.75rem",
    background: "white",
    border: "1px solid #ddd",
    borderRadius: "9999px",
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  button: {
    padding: "0.75rem 1.5rem",
    background: "#171717",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  },
};
