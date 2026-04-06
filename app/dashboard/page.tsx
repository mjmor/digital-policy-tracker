"use client";

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default function Dashboard() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  }

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1>Dashboard</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span>{user.emailAddresses[0]?.emailAddress}</span>
          <a href="/" style={{ color: "inherit", textDecoration: "none" }}>
            Home
          </a>
        </div>
      </header>

      <section style={{ padding: "2rem", background: "#f5f5f5", borderRadius: "8px" }}>
        <p>Welcome to the Digital Policy Tracker. API interface coming soon.</p>
      </section>
    </main>
  );
}
