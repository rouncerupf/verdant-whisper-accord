"use client";

import { DecryptionConsole } from "../../components/DecryptionConsole";
import { InitiativePipeline } from "../../components/InitiativePipeline";

export default function DecryptPage() {
  return (
    <div className="stack">
      <DecryptionConsole />
      <InitiativePipeline />
    </div>
  );
}


