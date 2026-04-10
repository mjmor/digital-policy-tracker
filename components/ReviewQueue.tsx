"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { parseStoredEvent } from "@/lib/parse-event";
import type { StoredEvent, ParsedStoredEvent } from "@/lib/event-types";
import {
  syncEvents,
  getReviewQueue,
  getStats,
  reviewEvent,
  archiveEvent,
  restoreEvent,
  deleteEvent,
} from "@/app/actions/events";
import type { DpaApiRequest } from "@/lib/dpa-types";

export default function ReviewQueue() {
  const [events, setEvents] = useState<ParsedStoredEvent[]>([]);
  const [counts, setCounts] = useState({
    pending: 0,
    reviewed: 0,
    archived: 0,
    lastSynced: null as string | null,
  });
  const [filter, setFilter] = useState<"pending" | "reviewed" | "archived">("pending");
  const [isPending, setIsPending] = useTransition();
  const [actionTarget, setActionTarget] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Load initial data on mount
  useEffect(() => {
    getReviewQueue(365)
      .then(({ events }) => setEvents(events.map(parseStoredEvent)))
      .catch(() => {});
    getStats()
      .then(setCounts)
      .catch(() => {});
  }, []);

  const loadQueue = useCallback(() => {
    getReviewQueue(365)
      .then(({ events }) => setEvents(events.map(parseStoredEvent)))
      .catch(() => {});
    getStats()
      .then(setCounts)
      .catch(() => {});
  }, []);

  const handleSync = useCallback(() => {
    setSyncResult(null);
    setActionError(null);
    const params: DpaApiRequest = {
      limit: 10,
      sorting: "-date",
      request_data: {
        event_period: [
          new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          new Date().toISOString().slice(0, 10),
        ],
      },
    };
    setIsPending(true);
    syncEvents(params).then((result) => {
      if (result.error) {
        setActionError(result.error);
      } else {
        setSyncResult(`Sync complete: ${result.added} new, ${result.duplicates} duplicates.`);
      }
      loadQueue().finally(() => setIsPending(false));
    });
  }, [loadQueue]);

  const handleReview = useCallback((id: string) => {
    setActionTarget(id);
    setActionError(null);
    setIsPending(true);
    reviewEvent(id).then((result) => {
      if (result.success) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setCounts((prev) => ({
          ...prev,
          pending: prev.pending - 1,
          reviewed: prev.reviewed + 1,
        }));
      } else {
        setActionError("Failed to mark as reviewed.");
      }
      setActionTarget(null);
      setIsPending(false);
    });
  }, []);

  const handleArchive = useCallback((id: string) => {
    setActionTarget(id);
    setActionError(null);
    setIsPending(true);
    archiveEvent(id).then((result) => {
      if (result.success) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setCounts((prev) => ({
          ...prev,
          pending: prev.pending - 1,
          archived: prev.archived + 1,
        }));
      } else {
        setActionError("Failed to archive.");
      }
      setActionTarget(null);
      setIsPending(false);
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    if (!confirm("Delete this event permanently?")) return;
    setActionTarget(id);
    setActionError(null);
    setIsPending(true);
    deleteEvent(id).then((result) => {
      if (result.success) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      } else {
        setActionError("Failed to delete.");
      }
      setActionTarget(null);
      setIsPending(false);
    });
  }, []);

  const handleRestore = useCallback((id: string) => {
    setActionTarget(id);
    setActionError(null);
    setIsPending(true);
    restoreEvent(id).then((result) => {
      if (result.success) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setCounts((prev) => ({
          ...prev,
          archived: prev.archived - 1,
          pending: prev.pending + 1,
        }));
      } else {
        setActionError("Failed to restore.");
      }
      setActionTarget(null);
      setIsPending(false);
    });
  }, []);

  // Filtered events based on current tab
  const filteredEvents = events.filter((e) => e.review_status === filter);

  const filterTabs = [
    { key: "pending" as const, label: `Pending (${counts.pending})` },
    { key: "reviewed" as const, label: `Reviewed (${counts.reviewed})` },
    { key: "archived" as const, label: `Archived (${counts.archived})` },
  ];

  return (
    <div style={styles.container}>
      {/* Stats + Sync Bar */}
      <div style={styles.syncBar}>
        <div style={styles.stats}>
          <span style={styles.stat}>
            <strong>{counts.pending}</strong> pending
          </span>
          <span style={styles.stat}>
            <strong>{counts.reviewed}</strong> reviewed
          </span>
          <span style={styles.stat}>
            <strong>{counts.archived}</strong> archived
          </span>
          {counts.lastSynced && (
            <span style={styles.lastSynced}>
              Last synced: {new Date(counts.lastSynced).toLocaleString()}
            </span>
          )}
        </div>
        <div style={styles.syncActions}>
          {syncResult && <span style={styles.syncResult}>{syncResult}</span>}
          {actionError && <span style={styles.actionError}>{actionError}</span>}
          <button
            onClick={handleSync}
            disabled={isPending}
            style={styles.syncButton}
          >
            {isPending ? "Syncing…" : "Sync from DPA"}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={styles.tabs}>
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              ...styles.tab,
              ...(filter === tab.key ? styles.tabActive : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events list */}
      {filteredEvents.length === 0 ? (
        <div style={styles.empty}>
          {filter === "pending"
            ? "No pending events. Run a sync to pull new DPA events."
            : filter === "reviewed"
            ? "No reviewed events yet."
            : "No archived events."}
        </div>
      ) : (
        <div style={styles.list}>
          {filteredEvents.map((event) => (
            <div key={event.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardMeta}>
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.cardId}
                  >
                    #{event.dpa_id}
                  </a>
                  <span style={styles.cardDate}>{event.date}</span>
                  <span
                    style={{
                      ...styles.badge,
                      background: event.status === "adopted" ? "#dcfce7" : "#fef3c7",
                      color: event.status === "adopted" ? "#166534" : "#92400e",
                    }}
                  >
                    {event.status}
                  </span>
                </div>
                <div style={styles.cardActions}>
                  {filter === "pending" && (
                    <>
                      <button
                        onClick={() => handleReview(event.id)}
                        disabled={actionTarget !== null}
                        style={styles.btnReview}
                      >
                        {actionTarget === event.id ? "…" : "✓ Review"}
                      </button>
                      <button
                        onClick={() => handleArchive(event.id)}
                        disabled={actionTarget !== null}
                        style={styles.btnArchive}
                      >
                        {actionTarget === event.id ? "…" : "Archive"}
                      </button>
                    </>
                  )}
                  {filter === "archived" && (
                    <button
                      onClick={() => handleRestore(event.id)}
                      disabled={actionTarget !== null}
                      style={styles.btnRestore}
                    >
                      {actionTarget === event.id ? "…" : "Restore"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(event.id)}
                    disabled={actionTarget !== null}
                    style={styles.btnDelete}
                  >
                    {actionTarget === event.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>
              <h3 style={styles.cardTitle}>{event.title}</h3>
              <p style={styles.cardDesc}>
                {event.description.slice(0, 200)}
                {event.description.length > 200 ? "…" : ""}
              </p>
              <div style={styles.cardTags}>
                {event.implementers.length > 0 && (
                  <span style={styles.tag}>
                    {event.implementers.map((i) => i.name).join(", ")}
                  </span>
                )}
                {event.policy_area && (
                  <span style={styles.tag}>{event.policy_area}</span>
                )}
                {event.policy_instrument && (
                  <span style={styles.tag}>{event.policy_instrument}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  syncBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
    padding: "1rem 1.25rem",
    background: "#f5f5f5",
    borderRadius: "8px",
  },
  stats: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  stat: {
    fontSize: "0.875rem",
    color: "#666",
  },
  lastSynced: {
    fontSize: "0.8rem",
    color: "#999",
  },
  syncActions: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
  },
  syncResult: {
    fontSize: "0.8rem",
    color: "#166534",
    background: "#dcfce7",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
  },
  actionError: {
    fontSize: "0.8rem",
    color: "#dc2626",
    background: "#fee2e2",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
  },
  syncButton: {
    padding: "0.5rem 1rem",
    background: "#171717",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  tabs: {
    display: "flex",
    gap: "0.25rem",
    borderBottom: "1px solid #e5e5e5",
    paddingBottom: "0",
  },
  tab: {
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    fontSize: "0.875rem",
    cursor: "pointer",
    color: "#666",
    marginBottom: "-1px",
  },
  tabActive: {
    color: "#171717",
    fontWeight: 600,
    borderBottomColor: "#171717",
  },
  empty: {
    padding: "3rem",
    textAlign: "center",
    color: "#666",
    background: "#f9f9f9",
    borderRadius: "8px",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  card: {
    padding: "1rem 1.25rem",
    background: "white",
    border: "1px solid #e5e5e5",
    borderRadius: "8px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    marginBottom: "0.5rem",
    flexWrap: "wrap",
  },
  cardMeta: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  cardId: {
    color: "#2563eb",
    textDecoration: "none",
    fontSize: "0.8rem",
    fontFamily: "monospace",
  },
  cardDate: {
    fontSize: "0.8rem",
    color: "#666",
  },
  badge: {
    display: "inline-block",
    padding: "0.125rem 0.5rem",
    borderRadius: "9999px",
    fontSize: "0.7rem",
    fontWeight: 500,
  },
  cardActions: {
    display: "flex",
    gap: "0.5rem",
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: "0.95rem",
    fontWeight: 600,
    margin: "0 0 0.375rem 0",
  },
  cardDesc: {
    fontSize: "0.8rem",
    color: "#555",
    margin: "0 0 0.5rem 0",
    lineHeight: 1.5,
  },
  cardTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.375rem",
  },
  tag: {
    display: "inline-block",
    padding: "0.125rem 0.5rem",
    background: "#f0f0f0",
    borderRadius: "4px",
    fontSize: "0.7rem",
    color: "#555",
  },
  btnReview: {
    padding: "0.25rem 0.625rem",
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  btnArchive: {
    padding: "0.25rem 0.625rem",
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  btnRestore: {
    padding: "0.25rem 0.625rem",
    background: "#dbeafe",
    color: "#1e40af",
    border: "1px solid #bfdbfe",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  btnDelete: {
    padding: "0.25rem 0.625rem",
    background: "transparent",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: 500,
    cursor: "pointer",
  },
};
