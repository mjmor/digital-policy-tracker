"use client";

import { useState, useEffect, useCallback } from "react";
import FilterPanel from "@/components/FilterPanel";
import ReviewQueue from "@/components/ReviewQueue";
import PlanDrawer from "@/components/PlanDrawer";
import {
  listSearchPlans,
  createSearchPlan,
  deleteSearchPlan,
} from "@/app/actions/events";
import type { SearchPlan, CreateSearchPlanInput } from "@/lib/event-types";
import type { DpaApiRequest } from "@/lib/dpa-types";

interface DashboardClientProps {
  user?: { email?: string } | null;
}

export default function DashboardClient({ user: _user }: DashboardClientProps) {
  const [plans, setPlans] = useState<SearchPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createUrl, setCreateUrl] = useState("");
  const [createFilters, setCreateFilters] = useState<DpaApiRequest>({});
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const loadPlans = useCallback(async () => {
    const { plans: fetched } = await listSearchPlans();
    setPlans(fetched);
    // Auto-select first plan if nothing is selected
    setSelectedPlanId((prev) => {
      if (prev && fetched.some((p) => p.id === prev)) return prev;
      return fetched[0]?.id ?? null;
    });
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__new__") {
      setShowCreateForm(true);
    } else {
      setSelectedPlanId(val);
      setShowCreateForm(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      setCreateError("Title is required.");
      return;
    }
    setIsCreating(true);
    setCreateError(null);
    const input: CreateSearchPlanInput = {
      title: createTitle.trim(),
      description: createDescription.trim() || undefined,
      url: createUrl.trim() || undefined,
      dpa_filters: createFilters,
    };
    const { plan, error } = await createSearchPlan(input);
    setIsCreating(false);
    if (error || !plan) {
      setCreateError(error ?? "Failed to create plan.");
      return;
    }
    setPlans((prev) => [plan, ...prev]);
    setSelectedPlanId(plan.id);
    setShowCreateForm(false);
    setCreateTitle("");
    setCreateDescription("");
    setCreateUrl("");
    setCreateFilters({});
  };

  const handleDelete = async (planId: string) => {
    if (!window.confirm("Delete this search plan and all its events?")) return;
    const { success, error } = await deleteSearchPlan(planId);
    if (!success) {
      alert(error ?? "Failed to delete plan.");
      return;
    }
    setPlans((prev) => {
      const next = prev.filter((p) => p.id !== planId);
      if (selectedPlanId === planId) {
        setSelectedPlanId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;

  return (
    <main style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Plan selector bar */}
      <div style={styles.planBar}>
        <div style={styles.planSelectorRow}>
          <label style={styles.planLabel} htmlFor="plan-select">
            Search Plan
          </label>
          <select
            id="plan-select"
            value={showCreateForm ? "__new__" : (selectedPlanId ?? "")}
            onChange={handleSelectChange}
            style={styles.planSelect}
          >
            {plans.length === 0 && !showCreateForm && (
              <option value="" disabled>
                No plans yet
              </option>
            )}
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.title}
              </option>
            ))}
            <option value="__new__" style={{ fontWeight: 700, color: "#2563eb" }}>
              + New search plan
            </option>
          </select>
          {selectedPlan && !showCreateForm && (
            <button
              onClick={() => handleDelete(selectedPlan.id)}
              style={styles.deletePlanBtn}
              title="Delete this plan"
            >
              Delete plan
            </button>
          )}
        </div>
      </div>

      {/* Create plan form */}
      {showCreateForm && (
        <div style={styles.createForm}>
          <h2 style={styles.createTitle}>New Search Plan</h2>
          <form onSubmit={handleCreateSubmit}>
            <div style={styles.formField}>
              <label style={styles.fieldLabel}>
                Title <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                maxLength={200}
                style={styles.textInput}
                placeholder="e.g. AI regulation — EU"
              />
            </div>
            <div style={styles.formField}>
              <label style={styles.fieldLabel}>Description</label>
              <textarea
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                style={styles.textarea}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div style={styles.formField}>
              <label style={styles.fieldLabel}>External tracker URL</label>
              <input
                type="url"
                value={createUrl}
                onChange={(e) => setCreateUrl(e.target.value)}
                style={styles.textInput}
                placeholder="https://..."
              />
            </div>
            <div style={styles.formField}>
              <label style={styles.fieldLabel}>DPA Filters</label>
              <FilterPanel
                onChange={setCreateFilters}
                hideSubmit={true}
              />
            </div>
            {createError && <p style={styles.createError}>{createError}</p>}
            <div style={styles.formActions}>
              <button type="submit" disabled={isCreating} style={styles.createBtn}>
                {isCreating ? "Creating…" : "Create Plan"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateError(null);
                }}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main content */}
      {!showCreateForm && (
        <>
          {selectedPlanId ? (
            <div style={styles.contentRow}>
              <div style={styles.queueArea}>
                <ReviewQueue searchPlanId={selectedPlanId} />
              </div>
              {selectedPlan && (
                <PlanDrawer
                  plan={selectedPlan}
                  isOpen={drawerOpen}
                  onToggle={() => setDrawerOpen((prev) => !prev)}
                />
              )}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <p style={styles.emptyMsg}>No search plans yet.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                style={styles.createFirstBtn}
              >
                + Create your first search plan
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  planBar: {
    marginBottom: "1.5rem",
    padding: "1rem 1.25rem",
    background: "#f5f5f5",
    borderRadius: "8px",
  },
  planSelectorRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  planLabel: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#444",
    whiteSpace: "nowrap",
  },
  planSelect: {
    padding: "0.375rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.875rem",
    background: "white",
    minWidth: "220px",
    cursor: "pointer",
  },
  deletePlanBtn: {
    padding: "0.375rem 0.75rem",
    background: "transparent",
    color: "#dc2626",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  createForm: {
    padding: "1.5rem",
    border: "1px solid #e5e5e5",
    borderRadius: "8px",
    background: "white",
    marginBottom: "1.5rem",
  },
  createTitle: {
    fontSize: "1.125rem",
    fontWeight: 600,
    margin: "0 0 1.25rem 0",
  },
  formField: {
    marginBottom: "1rem",
  },
  fieldLabel: {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 500,
    marginBottom: "0.375rem",
    color: "#374151",
  },
  textInput: {
    width: "100%",
    padding: "0.5rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.875rem",
    boxSizing: "border-box" as const,
  },
  textarea: {
    width: "100%",
    padding: "0.5rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.875rem",
    boxSizing: "border-box" as const,
    resize: "vertical" as const,
  },
  createError: {
    color: "#dc2626",
    fontSize: "0.875rem",
    margin: "0.5rem 0",
  },
  formActions: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "1rem",
  },
  createBtn: {
    padding: "0.5rem 1.25rem",
    background: "#171717",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "0.5rem 1rem",
    background: "transparent",
    color: "#666",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  contentRow: {
    display: "flex",
    gap: "1rem",
    alignItems: "flex-start",
  },
  queueArea: {
    flex: 1,
    minWidth: 0,
  },
  emptyState: {
    padding: "4rem 2rem",
    textAlign: "center",
    background: "#f9f9f9",
    borderRadius: "8px",
  },
  emptyMsg: {
    fontSize: "1rem",
    color: "#666",
    marginBottom: "1rem",
  },
  createFirstBtn: {
    padding: "0.625rem 1.5rem",
    background: "#171717",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
};
