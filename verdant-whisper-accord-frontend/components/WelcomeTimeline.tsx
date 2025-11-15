"use client";

const STEPS = [
  {
    title: "Encrypted Initiative Intake",
    description:
      "Members encrypt their advocacy summary, resource mix, and requested budget with the FHE public key before submission.",
  },
  {
    title: "Homomorphic Budget Modelling",
    description:
      "Budget officers combine and stress test encrypted requests to validate feasibility without revealing underlying numbers.",
  },
  {
    title: "Committee Prioritisation",
    description:
      "Votes are aggregated as encrypted weights, producing ranked recommendations through fully homomorphic operations.",
  },
  {
    title: "Authorised Decryption",
    description:
      "Only approved dossiers receive ACL grants; proposers recover final allocations through the relayer with their signature.",
  },
];

export const WelcomeTimeline = () => {
  return (
    <div className="surface-card">
      <h2 style={{ marginTop: 0, fontFamily: "var(--font-family-headings)" }}>Encrypted lifecycle</h2>
      <div className="stack">
        {STEPS.map((step, index) => (
          <div key={step.title} className="timeline-step">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
              <div className="timeline-dot" />
              {index < STEPS.length - 1 && <div className="timeline-line" />}
            </div>
            <div className="timeline-content">
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{step.title}</h3>
              <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


