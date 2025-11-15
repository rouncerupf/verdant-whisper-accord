"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAccordData } from "../hooks/useAccordData";
import { useAccordActions } from "../hooks/useAccordActions";
import { formatNumber } from "../lib/utils/format";

const WEIGHT_OPTIONS = [
  { label: "Light", value: 10 },
  { label: "Moderate", value: 25 },
  { label: "Strong", value: 50 },
];

export const ApprovalWorkbench = () => {
  const { initiatives, decryptInitiative } = useAccordData();
  const { castVote, simulateApproval, approveInitiative } = useAccordActions();

  const [selected, setSelected] = useState<number | null>(null);
  const [weight, setWeight] = useState(WEIGHT_OPTIONS[0].value);
  const [simulateResult, setSimulateResult] = useState<string | null>(null);
  const [allocation, setAllocation] = useState(100);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendingInitiatives = useMemo(
    () => initiatives.filter((item) => item.status !== "Rejected"),
    [initiatives],
  );

  const selectedInitiative = useMemo(
    () => initiatives.find((item) => item.id === selected),
    [initiatives, selected],
  );

  const onVote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selected === null) {
      setError("Select an initiative first.");
      return;
    }
    setError(null);
    setBusyAction("vote");
    try {
      await castVote(selected, weight);
      setSimulateResult("Vote encrypted and recorded.");
      const record = initiatives.find((item) => item.id === selected);
      if (record) {
        await decryptInitiative(record);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vote failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const onSimulate = async () => {
    if (pendingInitiatives.length === 0) return;
    setBusyAction("simulate");
    setError(null);
    try {
      await simulateApproval(pendingInitiatives.map((item) => item.id));
      setSimulateResult("Approval ordering simulation executed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const onApprove = async () => {
    if (selected === null) {
      setError("Select an initiative to approve.");
      return;
    }
    setBusyAction("approve");
    setError(null);
    try {
      await approveInitiative(selected, allocation);
      setSimulateResult("Allocation encrypted and approval recorded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <section className="surface-card">
      <h2 style={{ marginTop: 0, fontFamily: "var(--font-family-headings)" }}>Committee Workbench</h2>
      <p style={{ color: "var(--color-text-secondary)" }}>
        Cast encrypted votes, simulate approval orderings, and allocate budgets without revealing raw values.
      </p>
      <div className="grid-two">
        <form className="form-grid" onSubmit={onVote}>
          <div className="form-row">
            <label className="form-label">Select initiative</label>
            <select value={selected ?? ""} onChange={(event) => setSelected(Number(event.target.value))}>
              <option value="" disabled>
                Choose an initiative
              </option>
              {pendingInitiatives.map((item) => (
                <option key={item.id} value={item.id}>
                  #{item.id} · {item.status}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label className="form-label">Vote weighting</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {WEIGHT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className="ghost-button"
                  type="button"
                  data-active={weight === option.value}
                  onClick={() => setWeight(option.value)}
                  style={{
                    border: weight === option.value ? "1px solid var(--color-primary)" : "1px solid transparent",
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <button className="cta-button" type="submit" disabled={busyAction === "vote"}>
            {busyAction === "vote" ? "Submitting…" : "Submit encrypted vote"}
          </button>
        </form>
        <div className="surface-muted">
          <h3 style={{ marginTop: 0 }}>Initiative snapshot</h3>
          {selectedInitiative ? (
            <div className="stack">
              <div>
                <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Requested</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                  {selectedInitiative.decrypted?.requestedBudget !== undefined
                    ? formatNumber(selectedInitiative.decrypted.requestedBudget)
                    : `${selectedInitiative.handles.requestedBudget.slice(0, 12)}…`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Priority</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>
                  {selectedInitiative.decrypted?.basePriority !== undefined
                    ? formatNumber(selectedInitiative.decrypted.basePriority)
                    : `${selectedInitiative.handles.basePriority.slice(0, 12)}…`}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--color-text-secondary)" }}>Choose an initiative to inspect handles.</p>
          )}
        </div>
      </div>
      <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <button className="ghost-button" onClick={onSimulate} disabled={busyAction === "simulate"}>
          {busyAction === "simulate" ? "Simulating…" : "Simulate approval ordering"}
        </button>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="number"
            min={0}
            step={10}
            value={allocation}
            onChange={(event) => setAllocation(Number(event.target.value))}
            style={{ width: "140px" }}
          />
          <button className="ghost-button" onClick={onApprove} disabled={busyAction === "approve"}>
            {busyAction === "approve" ? "Allocating…" : "Approve encrypted allocation"}
          </button>
        </div>
      </div>
      {simulateResult && (
        <p style={{ color: "var(--color-success)", marginTop: "1rem" }}>{simulateResult}</p>
      )}
      {error && (
        <p style={{ color: "var(--color-danger)", marginTop: "0.75rem" }}>{error}</p>
      )}
    </section>
  );
};


