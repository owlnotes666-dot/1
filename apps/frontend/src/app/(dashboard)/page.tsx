import type { Metadata } from "next";

import { DashboardClient } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Overview",
  description: "Overview",
};

export default function Dashboard() {
  return <DashboardClient />;
}
