"use client";

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default function Dashboard() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
  }

  if (!user) {
    redirect("/sign-in");
  }

  return <DashboardClient />;
}
