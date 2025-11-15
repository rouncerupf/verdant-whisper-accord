"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAccordData } from "../hooks/useAccordData";
import { useAccordActions } from "../hooks/useAccordActions";
import { formatNumber } from "../lib/utils/format";

export const BudgetSimulator = () => {
  const { initiatives } = useAccordData();
  const { simulateAllocation } = useAccordActions();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [poolBudget, setPoolBudget] = useState(250);
  const [result, setResult] = useState<{ requested: bigint; allocated: bigint; remaining: bigint }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const selectable = useMemo(() => initiatives.filter((item) => item.status !== "Rejected"), [initiatives]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const outcome = await simulateAllocation(selectedIds, poolBudget);
      if (outcome) {
        setResult(outcome);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <section className="surface-card">
      <h2 style={{ marginTop: 0, fontFamily: "var(--font-family-headings)" }}>Homomorphic Budget Simulator</h2>
      <p style={{ color: "var(--color-text-secondary)" }}>
        Select initiatives to test encrypted allocation scenarios. Totals remain encrypted until committee decrypts the snapshot.
      </p>
      <form className="form-grid" onSubmit={onSubmit}>
        <div className="form-row">
          <label className="form-label">Budget Pool (encrypted)</label>
          <input
            type="number"
            min={0}
            step={10}
            value={poolBudget}
            onChange={(event) => setPoolBudget(Number(event.target.value))}
          />
        </div>
        <div className="form-row">
          <label className="form-label">Select initiatives</label>
          <div className="surface-muted" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {selectable.map((initiative) => (
              <button
                type="button"
                key={initiative.id}
                className="ghost-button"
                data-active={selectedIds.includes(initiative.id)}
                onClick={() => toggleSelection(initiative.id)}
                style={{
                  border:
                    selectedIds.includes(initiative.id) ? "1px solid var(--color-primary)" : "1px solid transparent",
                }}
              >
                #{initiative.id} · {initiative.status}
              </button>
            ))}
            {selectable.length === 0 && (
              <span style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                No pending initiatives available.
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button className="cta-button" type="submit" disabled={busy || selectedIds.length === 0}>
            {busy ? "Simulating…" : "Simulate encrypted allocation"}
          </button>
          {error && <span style={{ color: "var(--color-danger)" }}>{error}</span>}
        </div>
      </form>
      {result && (
        <div className="metrics-grid" style={{ marginTop: "1.5rem" }}>
          <div className="metric-card">
            <span className="metric-label">Decrypted Requested</span>
            <span className="metric-value">{formatNumber(result.requested)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Decrypted Allocated</span>
            <span className="metric-value">{formatNumber(result.allocated)}</span>
          </div>
          <div className="metric-card">
            <span className="metric-label">Remaining Pool</span>
            <span className="metric-value">{formatNumber(result.remaining)}</span>
          </div>
        </div>
      )}
    </section>
  );
};


