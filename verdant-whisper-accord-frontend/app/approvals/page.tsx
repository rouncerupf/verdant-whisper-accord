"use client";

import { ApprovalWorkbench } from "../../components/ApprovalWorkbench";
import { BudgetSimulator } from "../../components/BudgetSimulator";
import { InitiativePipeline } from "../../components/InitiativePipeline";

export default function ApprovalsPage() {
  return (
    <div className="stack">
      <ApprovalWorkbench />
      <BudgetSimulator />
      <InitiativePipeline />
    </div>
  );
}


