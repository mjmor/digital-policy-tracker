"use client";

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { useState } from "react";
import FilterPanel from "@/components/FilterPanel";
import ResultsTable from "@/components/ResultsTable";
import ReviewQueue from "@/components/ReviewQueue";
import type { DpaApiRequest, DpaApiResponse } from "@/lib/dpa-types";
import { queryDpaApi } from "@/lib/dpa-client";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [results, setResults] = useState<DpaApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (!isLoaded) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  }

  if (!user) {
    redirect("/sign-in");
  }

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
            {user.emailAddresses[0]?.emailAddress}
          </span>
          <a href="/" style={{ color: "inherit", textDecoration: "none" }}>
            Home
          </a>
        </div>
      </header>

      <ReviewQueue />
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
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginTop: "2rem",
  },
  results: {
    marginTop: "1.5rem",
  },
  resultsTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "1rem",
  },
};
