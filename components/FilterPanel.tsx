"use client";

import { useState } from "react";
import type { DpaApiRequest } from "@/lib/dpa-types";
import { JURISDICTIONS, ECONOMIC_ACTIVITY, EVENT_TYPE, POLICY_AREA, IMPLEMENTATION_LEVEL } from "@/lib/dpa-types";

interface FilterPanelProps {
  onSearch: (params: DpaApiRequest) => void;
  isLoading: boolean;
}

export default function FilterPanel({ onSearch, isLoading }: FilterPanelProps) {
  const [limit, setLimit] = useState(100);
  const [sorting, setSorting] = useState("-date");
  const [implementers, setImplementers] = useState<number[]>([]);
  const [economicActivity, setEconomicActivity] = useState<number[]>([]);
  const [eventType, setEventType] = useState<number[]>([]);
  const [policyArea, setPolicyArea] = useState<number[]>([]);
  const [eventPeriodFrom, setEventPeriodFrom] = useState("");
  const [eventPeriodTo, setEventPeriodTo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const requestData: DpaApiRequest["request_data"] = {};

    if (implementers.length > 0) {
      requestData.implementing_jurisdiction = implementers;
    }
    if (economicActivity.length > 0) {
      requestData.economic_activity = economicActivity;
    }
    if (eventType.length > 0) {
      requestData.event_type = eventType;
    }
    if (policyArea.length > 0) {
      requestData.policy_area = policyArea;
    }
    if (eventPeriodFrom || eventPeriodTo) {
      requestData.event_period = [eventPeriodFrom, eventPeriodTo || null];
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
            <option value="-date">Date (newest first)</option>
            <option value="date">Date (oldest first)</option>
            <option value="-status">Status (newest first)</option>
            <option value="status">Status (oldest first)</option>
          </select>
        </label>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Implementing Jurisdictions</h3>
        <div style={styles.chipGroup}>
          {Object.entries(JURISDICTIONS).map(([id, name]) => (
            <label key={id} style={styles.chip}>
              <input
                type="checkbox"
                checked={implementers.includes(parseInt(id))}
                onChange={() => toggleArrayValue(implementers, setImplementers, parseInt(id))}
              />
              {name}
            </label>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Economic Activity</h3>
        <div style={styles.chipGroup}>
          {Object.entries(ECONOMIC_ACTIVITY).map(([id, label]) => (
            <label key={id} style={styles.chip}>
              <input
                type="checkbox"
                checked={economicActivity.includes(parseInt(id))}
                onChange={() => toggleArrayValue(economicActivity, setEconomicActivity, parseInt(id))}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Event Type</h3>
        <div style={styles.chipGroup}>
          {Object.entries(EVENT_TYPE).map(([id, label]) => (
            <label key={id} style={styles.chip}>
              <input
                type="checkbox"
                checked={eventType.includes(parseInt(id))}
                onChange={() => toggleArrayValue(eventType, setEventType, parseInt(id))}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Policy Area</h3>
        <div style={styles.chipGroup}>
          {Object.entries(POLICY_AREA).map(([id, label]) => (
            <label key={id} style={styles.chip}>
              <input
                type="checkbox"
                checked={policyArea.includes(parseInt(id))}
                onChange={() => toggleArrayValue(policyArea, setPolicyArea, parseInt(id))}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Event Period</h3>
        <div style={styles.row}>
          <label style={styles.label}>
            From:
            <input
              type="date"
              value={eventPeriodFrom}
              onChange={(e) => setEventPeriodFrom(e.target.value)}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            To:
            <input
              type="date"
              value={eventPeriodTo}
              onChange={(e) => setEventPeriodTo(e.target.value)}
              style={styles.input}
            />
          </label>
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
