"use client";

import { useState } from "react";
import { useAccordData } from "../hooks/useAccordData";
import { formatAddress, formatNumber } from "../lib/utils/format";

export const InitiativePipeline = () => {
  const { initiatives, decryptInitiative, loading } = useAccordData();
  const [busyId, setBusyId] = useState<number | null>(null);

  const handleDecrypt = async (id: number) => {
    setBusyId(id);
    try {
      const record = initiatives.find((item) => item.id === id);
      if (record) {
        await decryptInitiative(record);
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="surface-card">
      <header style={{ marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, fontFamily: "var(--font-family-headings)", fontSize: "1.4rem" }}>
          Initiative Pipeline
        </h2>
        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          Committee members may decrypt individual budgets and priority weights after authorisation.
        </p>
      </header>
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Proposer</th>
              <th>Status</th>
              <th>Budget</th>
              <th>Priority</th>
              <th>Handles</th>
              <th>Decrypt</th>
            </tr>
          </thead>
          <tbody>
            {initiatives.map((initiative) => (
              <tr key={initiative.id} className="table-row">
                <td>{initiative.id}</td>
                <td>{formatAddress(initiative.proposer)}</td>
                <td>
                  <span className="status-badge" data-variant={initiative.status.toLowerCase()}>
                    {initiative.status}
                  </span>
                </td>
                <td>
                  {initiative.decrypted?.requestedBudget !== undefined ? (
                    <>
                      <strong>{formatNumber(initiative.decrypted.requestedBudget)}</strong>
                      <div style={{ color: "var(--color-text-secondary)", fontSize: "0.75rem" }}>
                        Allocated: {formatNumber(initiative.decrypted.allocatedBudget ?? 0n)}
                      </div>
                    </>
                  ) : (
                    <span style={{ color: "var(--color-text-secondary)", fontSize: "0.75rem" }}>
                      {initiative.handles.requestedBudget.slice(0, 10)}…
                    </span>
                  )}
                </td>
                <td>
                  {initiative.decrypted?.basePriority !== undefined ? (
                    <>
                      <strong>{formatNumber(initiative.decrypted.basePriority)}</strong>
                      <div style={{ color: "var(--color-text-secondary)", fontSize: "0.75rem" }}>
                        Votes: {formatNumber(initiative.decrypted.voteTally ?? 0n)}
                      </div>
                    </>
                  ) : (
                    <span style={{ color: "var(--color-text-secondary)", fontSize: "0.75rem" }}>
                      {initiative.handles.basePriority.slice(0, 10)}…
                    </span>
                  )}
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                      Budget: {initiative.handles.requestedBudget.slice(0, 10)}…
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                      Detail: {initiative.handles.detailHandle.slice(0, 10)}…
                    </span>
                  </div>
                </td>
                <td>
                  <button
                    className="ghost-button"
                    onClick={() => handleDecrypt(initiative.id)}
                    disabled={busyId === initiative.id}
                  >
                    {busyId === initiative.id ? "Decrypting…" : "Decrypt"}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && initiatives.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "1.5rem" }}>
                  No initiatives submitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

