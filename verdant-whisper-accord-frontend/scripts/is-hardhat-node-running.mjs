"use strict";

const RPC_URL = process.env.NEXT_PUBLIC_LOCAL_RPC_URL ?? "http://127.0.0.1:8545";

async function jsonRpc(method, params = []) {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  if (!response.ok) {
    throw new Error(`RPC ${method} failed with status ${response.status}`);
  }
  const payload = await response.json();
  if (payload.error) {
    throw new Error(`RPC ${method} error: ${payload.error.message}`);
  }
  return payload.result;
}

async function main() {
  try {
    const version = await jsonRpc("web3_clientVersion");
    if (typeof version !== "string" || !version.toLowerCase().includes("hardhat")) {
      console.warn(`[is-hardhat-node-running] RPC responding but not a Hardhat node: ${version}`);
      process.exit(0);
    }
    // Attempt to fetch FHE metadata to ensure FHEVM Hardhat node config
    const metadata = await jsonRpc("fhevm_relayer_metadata");
    if (!metadata || typeof metadata !== "object") {
      console.warn("[is-hardhat-node-running] Hardhat node detected but missing FHEVM metadata.");
    } else {
      console.log("[is-hardhat-node-running] FHEVM Hardhat node detected.");
    }
  } catch (error) {
    console.error(
      `[is-hardhat-node-running] Unable to reach Hardhat node at ${RPC_URL}:`,
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

await main();


