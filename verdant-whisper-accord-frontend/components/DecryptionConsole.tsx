"use client";

import { FormEvent, useState } from "react";
import { useAccordActions } from "../hooks/useAccordActions";
import { useAccordData } from "../hooks/useAccordData";
import { formatAddress } from "../lib/utils/format";

export const DecryptionConsole = () => {
  const { initiatives } = useAccordData();
  const { requestDecryption, authorizeDetailHandle } = useAccordActions();

  const [requestId, setRequestId] = useState<number | null>(null);
  const [authorizeId, setAuthorizeId] = useState<number | null>(null);
  const [targetAccount, setTargetAccount] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const onRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (requestId === null) {
      setErrorMessage("Choose an initiative to request decryption.");
      return;
    }
    setBusyAction("request");
    setErrorMessage(null);
    try {
      await requestDecryption(requestId);
      setStatusMessage(`Decryption request emitted for initiative #${requestId}.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const onAuthorize = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (authorizeId === null || targetAccount === "") {
      setErrorMessage("Provide initiative id and target account.");
      return;
    }
    setBusyAction("authorize");
    setErrorMessage(null);
    try {
      await authorizeDetailHandle(authorizeId, targetAccount as `0x${string}`);
      setStatusMessage(`Authorization granted to ${formatAddress(targetAccount)}.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Authorization failed.");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <section className="surface-card">
      <h2 style={{ marginTop: 0, fontFamily: "var(--font-family-headings)" }}>Decryption Console</h2>
      <p style={{ color: "var(--color-text-secondary)" }}>
        Proposers request access to their approved dossiers while committee members authorise final handles for decrypted delivery.
      </p>
      <div className="grid-two">
        <form className="form-grid" onSubmit={onRequest}>
          <div className="form-row">
            <label className="form-label">Initiative ID</label>
            <select value={requestId ?? ""} onChange={(event) => setRequestId(Number(event.target.value))}>
              <option value="" disabled>
                Choose initiative
              </option>
              {initiatives
                .filter((item) => item.status === "Approved")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    #{item.id} · {item.status}
                  </option>
                ))}
            </select>
          </div>
          <button className="cta-button" type="submit" disabled={busyAction === "request"}>
            {busyAction === "request" ? "Requesting…" : "Request decryption handle"}
          </button>
        </form>
        <form className="form-grid" onSubmit={onAuthorize}>
          <div className="form-row">
            <label className="form-label">Initiative ID</label>
            <select value={authorizeId ?? ""} onChange={(event) => setAuthorizeId(Number(event.target.value))}>
              <option value="" disabled>
                Choose initiative
              </option>
              {initiatives
                .filter((item) => item.status === "Approved")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    #{item.id} · {item.status}
                  </option>
                ))}
            </select>
          </div>
          <div className="form-row">
            <label className="form-label">Authorize account</label>
            <input
              type="text"
              value={targetAccount}
              onChange={(event) => setTargetAccount(event.target.value)}
              placeholder="0x..."
            />
          </div>
          <button className="ghost-button" type="submit" disabled={busyAction === "authorize"}>
            {busyAction === "authorize" ? "Authorizing…" : "Authorize detail handle"}
          </button>
        </form>
      </div>
      {statusMessage && (
        <p style={{ color: "var(--color-success)", marginTop: "1rem" }}>{statusMessage}</p>
      )}
      {errorMessage && (
        <p style={{ color: "var(--color-danger)", marginTop: "0.75rem" }}>{errorMessage}</p>
      )}
    </section>
  );
};


