"use client";

import { InitiativeSubmissionForm } from "../../components/InitiativeSubmissionForm";
import { MetricsOverview } from "../../components/MetricsOverview";

export default function SubmitPage() {
  return (
    <div className="stack">
      <InitiativeSubmissionForm />
      <MetricsOverview />
    </div>
  );
}


