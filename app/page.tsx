import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "3rem",
        }}
      >
        <h1>Digital Policy Tracker</h1>
        <SignedIn>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <Link href="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>
              Dashboard
            </Link>
            <UserButton />
          </div>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button
              style={{
                padding: "0.5rem 1rem",
                background: "#171717",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
      </header>

      <section>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>About</h2>
        <p style={{ lineHeight: "1.6" }}>
          A dashboard and toolkit for tracking digital policy developments globally.
          Query the Digital Policy Alert API, visualize trade interventions, and explore
          policy trends.
        </p>
      </section>
    </main>
  );
}
