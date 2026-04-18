"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>Digital Policy Tracker</span>
      <div style={styles.links}>
        <Link
          href="/dashboard"
          style={{
            ...styles.link,
            ...(pathname === "/dashboard" ? styles.linkActive : {}),
          }}
        >
          Dashboard
        </Link>
        <Link
          href="/search"
          style={{
            ...styles.link,
            ...(pathname === "/search" ? styles.linkActive : {}),
          }}
        >
          Search
        </Link>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 2rem",
    borderBottom: "1px solid #e5e5e5",
    background: "#fff",
  },
  brand: {
    fontWeight: 600,
    fontSize: "1rem",
    color: "#171717",
  },
  links: {
    display: "flex",
    gap: "1.5rem",
  },
  link: {
    fontSize: "0.875rem",
    color: "#666",
    textDecoration: "none",
  },
  linkActive: {
    color: "#171717",
    fontWeight: 600,
  },
};
