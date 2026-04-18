"use client";

import { useState } from "react";
import FilterPanel from "@/components/FilterPanel";
import ResultsTable from "@/components/ResultsTable";
import type { DpaApiRequest, DpaApiResponse } from "@/lib/dpa-types";
import { queryDpaApi } from "@/lib/dpa-client";

export default function SearchClient() {
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
      <h1 style={{ marginBottom: "1.5rem" }}>Search DPA</h1>
      <FilterPanel onSearch={handleSearch} isLoading={isLoading} />
      {results && (
        <div style={styles.results}>
          <h2 style={styles.resultsTitle}>
            Results {results.length > 0 && `(${results.length})`}
          </h2>
          <ResultsTable data={results} isLoading={isLoading} error={error} />
        </div>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  results: {
    marginTop: "2rem",
  },
  resultsTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "1rem",
  },
};
