import React, { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata = {
  title: "Role Portals & Workspace Preview — ArousH Academy",
  description: "Interactive preview of role-tailored dashboards for Academy Admin, Teachers, Students, and Parents with subject-wise fee tracking.",
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "var(--space-12)", textAlign: "center", color: "var(--color-neutral-dark)" }}>
          Loading role workspace...
        </div>
      }
    >
      <DashboardShell />
    </Suspense>
  );
}
