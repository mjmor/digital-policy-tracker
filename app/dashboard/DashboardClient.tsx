"use client";

import ReviewQueue from "@/components/ReviewQueue";
import type { User } from "@clerk/nextjs/server";

interface DashboardClientProps {
  user: User | null;
}

export default function DashboardClient({ user: _user }: DashboardClientProps) {
  return (
    <main style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <ReviewQueue />
    </main>
  );
}
