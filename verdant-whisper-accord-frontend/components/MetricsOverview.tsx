"use client";

import { useState } from "react";
import { useAccordData } from "../hooks/useAccordData";
import { formatNumber } from "../lib/utils/format";

export const MetricsOverview = () => {
  const { totals, decryptGlobalTotals, loading } = useAccordData();
  const [decryptedTotals, setDecryptedTotals] = useState<{
    requested: bigint;
    allocated: bigint;
    priority: bigint;
  }>();
  const [busy, setBusy] = useState(false);

  const handleDecrypt = async () => {
    setBusy(true);
    try {
      const result = await decryptGlobalTotals();
      if (result) {
        setDecryptedTotals(result);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="surface-card">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-family-headings)", fontSize: "1.4rem" }}>
            Encrypted Initiative Totals
          </h2>
          <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
            Aggregated metrics stay encrypted until authorised. Use the decrypt control once committee quorum is reached.
          </p>
        </div>
        <button className="ghost-button" onClick={handleDecrypt} disabled={busy || !totals}>
          {busy ? "Decrypting…" : "Decrypt totals"}
        </button>
      </header>
      <div className="metrics-grid" style={{ marginTop: "1.5rem" }}>
        <MetricCard
          label="Encrypted Requested Budget"
          encrypted={totals?.requested}
          decrypted={decryptedTotals?.requested}
        />
        <MetricCard
          label="Encrypted Allocated Budget"
          encrypted={totals?.allocated}
          decrypted={decryptedTotals?.allocated}
        />
        <MetricCard
          label="Encrypted Priority Weight"
          encrypted={totals?.priority}
          decrypted={decryptedTotals?.priority}
        />
      </div>
      {loading && (
        <p style={{ color: "var(--color-text-secondary)", marginTop: "1rem" }}>Refreshing metrics…</p>
      )}
    </section>
  );
};

const MetricCard = ({
  label,
  encrypted,
  decrypted,
}: {
  label: string;
  encrypted?: string;
  decrypted?: bigint;
}) => {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value">
        {decrypted !== undefined ? (
          formatNumber(decrypted)
        ) : encrypted ? (
          <span style={{ color: "var(--color-text-secondary)", fontStyle: "italic" }}>
            🔒 Encrypted
          </span>
        ) : (
          "—"
        )}
      </span>
      <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
        {decrypted !== undefined ? "Decrypted" : encrypted ? "Encrypted (click to decrypt)" : "No data"}
      </span>
    </div>
  );
};


