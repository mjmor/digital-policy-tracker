"use client";

import { useState } from "react";
import FilterPanel from "@/components/FilterPanel";
import ResultsTable from "@/components/ResultsTable";
import ReviewQueue from "@/components/ReviewQueue";
import type { DpaApiRequest, DpaApiResponse } from "@/lib/dpa-types";
import { queryDpaApi } from "@/lib/dpa-client";
import type { User } from "@clerk/nextjs/server";

type Tab = "search" | "review";

interface DashboardClientProps {
  user: User | null;
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("review");
  const [results, setResults] = useState<DpaApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSearch = async (params: DpaApiRequest) => {
    setIsLoading(true);
    setError(undefined);
    setResults(null);

    const { data, error: apiError } = await queryDpaApi(params);

    if (apiError) {
      setError(apiError);
    } else if (data) {
      setResults(data);
    }

    setIsLoading(false);
  };

  return (
    <main style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Digital Policy Tracker</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.875rem", color: "#666" }}>
            {user?.emailAddresses[0]?.emailAddress ?? ""}
          </span>
          <a href="/" style={{ color: "inherit", textDecoration: "none" }}>
            Home
          </a>
        </div>
      </header>

      {/* Tab navigation */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("review")}
          style={{ ...styles.tab, ...(activeTab === "review" ? styles.tabActive : {}) }}
        >
          Review Queue
        </button>
        <button
          onClick={() => setActiveTab("search")}
          style={{ ...styles.tab, ...(activeTab === "search" ? styles.tabActive : {}) }}
        >
          Search DPA
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "review" ? (
        <ReviewQueue />
      ) : (
        <section style={styles.section}>
          <FilterPanel onSearch={handleSearch} isLoading={isLoading} />
          {results && (
            <div style={styles.results}>
              <h2 style={styles.resultsTitle}>
                Results {results.length > 0 && `(${results.length})`}
              </h2>
              <ResultsTable data={results} isLoading={isLoading} error={error} />
            </div>
          )}
        </section>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tabs: {
    display: "flex",
    gap: "0.25rem",
    borderBottom: "1px solid #e5e5e5",
    marginBottom: "1.5rem",
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
  section: {
    marginTop: "0",
  },
  results: {
    marginTop: "2rem",
  },
  resultsTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "1rem",
  },
};
