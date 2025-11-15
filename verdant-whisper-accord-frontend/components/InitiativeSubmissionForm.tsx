"use client";

import { FormEvent, useState } from "react";
import { useAccordActions } from "../hooks/useAccordActions";
import { useWallet } from "../lib/wallet-provider";

const RESOURCE_OPTIONS = ["Equipment", "Field Operations", "Research", "Outreach"];
const PRIORITY_HINTS = [
  { weight: 20, label: "Restoration focus" },
  { weight: 35, label: "Community engagement" },
  { weight: 50, label: "Mission critical" },
];

export const InitiativeSubmissionForm = () => {
  const { submitInitiative } = useAccordActions();
  const { connected, signer } = useWallet();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [resources, setResources] = useState<string[]>([]);
  const [requestedBudget, setRequestedBudget] = useState(120);
  const [basePriority, setBasePriority] = useState(PRIORITY_HINTS[0].weight);
  const [timeline, setTimeline] = useState("Q1 2026");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReady = connected && signer !== undefined;

  const toggleResource = (value: string) => {
    setResources((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setIsSubmitting(true);
    try {
      await submitInitiative({
        title,
        summary,
        resources,
        requestedBudget,
        basePriority,
        timeline,
      });
      setStatus("Initiative submitted with encrypted payloads.");
      setTitle("");
      setSummary("");
      setResources([]);
      setRequestedBudget(120);
      setBasePriority(PRIORITY_HINTS[0].weight);
      setTimeline("Q1 2026");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="surface-card">
      <h2 style={{ marginTop: 0, fontFamily: "var(--font-family-headings)" }}>Submit Encrypted Initiative</h2>
      <p style={{ color: "var(--color-text-secondary)" }}>
        Proposal metadata is encrypted locally before transmission. Numeric inputs use FHE handles while summaries store encrypted ciphertext blobs.
      </p>
      <form className="form-grid" onSubmit={onSubmit}>
        <div className="form-row">
          <label className="form-label">Initiative Title</label>
          <input value={title} onChange={(event) => setTitle(event.target.value)} required />
        </div>
        <div className="form-row">
          <label className="form-label">Encrypted Summary</label>
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Provide an encrypted summary payload (client-side encoded)."
            required
          />
        </div>
        <div className="form-row">
          <label className="form-label">Resource Requirements</label>
          <div className="surface-muted" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {RESOURCE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className="ghost-button"
                onClick={() => toggleResource(option)}
                data-active={resources.includes(option)}
                style={{
                  border: resources.includes(option) ? "1px solid var(--color-primary)" : "1px solid transparent",
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <label className="form-label">Requested Budget (FHE encrypted)</label>
          <input
            type="number"
            min={0}
            step={10}
            value={requestedBudget}
            onChange={(event) => setRequestedBudget(Number(event.target.value))}
            required
          />
        </div>
        <div className="form-row">
          <label className="form-label">Baseline Priority Weight</label>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {PRIORITY_HINTS.map((hint) => (
              <button
                key={hint.weight}
                type="button"
                className="ghost-button"
                onClick={() => setBasePriority(hint.weight)}
                data-active={basePriority === hint.weight}
                style={{
                  border: basePriority === hint.weight ? "1px solid var(--color-primary)" : "1px solid transparent",
                }}
              >
                {hint.label} · {hint.weight}
              </button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <label className="form-label">Timeline</label>
          <input value={timeline} onChange={(event) => setTimeline(event.target.value)} required />
        </div>
        <button className="cta-button" type="submit" disabled={isSubmitting || !isReady}>
          {isSubmitting ? "Encrypting..." : "Submit encrypted initiative"}
        </button>
      </form>
      {!isReady && (
        <p style={{ color: "var(--color-warning)", marginTop: "1rem" }}>
          Connect a wallet to interact with Verdant Whisper Accord.
        </p>
      )}
      {status && (
        <p style={{ color: "var(--color-success)", marginTop: "1rem" }}>{status}</p>
      )}
      {error && (
        <p style={{ color: "var(--color-danger)", marginTop: "0.75rem" }}>{error}</p>
      )}
    </section>
  );
};


