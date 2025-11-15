"use client";

import { MetricsOverview } from "../../components/MetricsOverview";
import { InitiativePipeline } from "../../components/InitiativePipeline";
import { BudgetSimulator } from "../../components/BudgetSimulator";
import { ApprovalWorkbench } from "../../components/ApprovalWorkbench";

export default function DashboardPage() {
  return (
    <div className="stack">
      <MetricsOverview />
      <InitiativePipeline />
      <BudgetSimulator />
      <ApprovalWorkbench />
    </div>
  );
}


