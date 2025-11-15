"use client";

import { useState } from "react";
import { useWallet } from "../lib/wallet-provider";
import { formatAddress } from "../lib/utils/format";

export const WalletConnectButton = () => {
  const { connected, accounts, status, connect, disconnect, connectors, chainId, error } = useWallet();
  const [showList, setShowList] = useState(false);

  const primaryAccount = accounts[0];

  if (connected) {
    return (
      <div className="surface-muted" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{formatAddress(primaryAccount)}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
            Chain ID: {chainId ?? "N/A"}
          </div>
        </div>
        <button className="ghost-button" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button className="cta-button" onClick={() => setShowList((prev) => !prev)}>
        {status === "connecting" ? "Connecting..." : "Connect Wallet"}
      </button>
      {showList && (
        <div
          className="surface-card"
          style={{
            position: "absolute",
            right: 0,
            marginTop: "0.75rem",
            minWidth: "220px",
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {connectors.length === 0 && (
            <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
              No EIP-6963 providers detected. Please install a compatible wallet.
            </div>
          )}
          {connectors.map((connector) => (
            <button
              key={connector.id}
              className="ghost-button"
              style={{ justifyContent: "flex-start" }}
              onClick={async () => {
                await connect(connector.id);
                setShowList(false);
              }}
            >
              {connector.name}
            </button>
          ))}
          {error && (
            <div style={{ fontSize: "0.75rem", color: "var(--color-danger)" }}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


