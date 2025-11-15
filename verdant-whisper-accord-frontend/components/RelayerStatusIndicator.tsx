"use client";

import { useRelayer } from "../lib/relayer-provider";
import { useWallet } from "../lib/wallet-provider";

export const RelayerStatusIndicator = () => {
  const { status, error } = useRelayer();
  const { relayerMode } = useWallet();

  const badgeColor =
    status === "ready"
      ? "var(--color-success)"
      : status === "error"
      ? "var(--color-danger)"
      : "var(--color-warning)";

  const label =
    status === "ready"
      ? "Relayer ready"
      : status === "loading"
      ? "Relayer syncing"
      : status === "error"
      ? "Relayer error"
      : "Relayer idle";

  return (
    <div className="pill" style={{ background: "rgba(66, 107, 161, 0.12)", color: "var(--color-accent)" }}>
      <span
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "999px",
          background: badgeColor,
          display: "inline-flex",
        }}
      />
      <span>{label}</span>
      <span style={{ color: "var(--color-text-secondary)" }}>
        • {relayerMode === "mock" ? "Mock relayer" : "Production relayer"}
      </span>
      {status === "error" && error && (
        <span style={{ color: "var(--color-danger)", marginLeft: "0.5rem" }}>{error}</span>
      )}
    </div>
  );
};


