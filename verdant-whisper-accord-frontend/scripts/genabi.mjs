"use strict";

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const HARDHAT_ROOT = path.resolve(ROOT, "../fhevm-hardhat-template");

const ARTIFACT_PATH = path.join(
  HARDHAT_ROOT,
  "artifacts/contracts/VerdantWhisperAccord.sol/VerdantWhisperAccord.json",
);
const DEPLOYMENTS_PATH = path.join(HARDHAT_ROOT, "deployments");
const ABI_OUTPUT = path.join(ROOT, "abi/VerdantWhisperAccordABI.ts");
const ADDR_OUTPUT = path.join(ROOT, "abi/VerdantWhisperAccordAddresses.ts");
const isMockMode = process.env.NEXT_PUBLIC_RELAYER_MODE === "mock";

async function ensureLocalDeploymentIfNeeded() {
  if (!isMockMode) {
    return;
  }

  const deploymentFile = path.join(
    DEPLOYMENTS_PATH,
    "localhost",
    "VerdantWhisperAccord.json",
  );

  try {
    await fs.access(deploymentFile);
    return;
  } catch {
    // continue to deploy
  }

  console.log(
    "[genabi] VerdantWhisperAccord not found in localhost deployments. Running Hardhat deploy...",
  );

  try {
    execSync(
      "npx hardhat deploy --network localhost --tags VerdantWhisperAccord",
      {
        cwd: HARDHAT_ROOT,
        stdio: "inherit",
      },
    );
  } catch (error) {
    console.error(
      "[genabi] Failed to deploy VerdantWhisperAccord on localhost. Make sure Hardhat node is running.",
    );
    throw error;
  }
}

async function ensureDirectory(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readArtifact() {
  try {
    const raw = await fs.readFile(ARTIFACT_PATH, "utf-8");
    const json = JSON.parse(raw);
    if (!json.abi) {
      throw new Error("Artifact missing ABI.");
    }
    return json.abi;
  } catch (error) {
    // If artifact not found (e.g., in Vercel build), try to use existing ABI file
    const existingABI = path.join(ROOT, "abi/VerdantWhisperAccordABI.ts");
    try {
      const existing = await fs.readFile(existingABI, "utf-8");
      // Extract ABI from existing file (it's exported as const)
      const match = existing.match(/export const VerdantWhisperAccordABI = (\[[\s\S]*?\]) as const/);
      if (match) {
        return JSON.parse(match[1]);
      }
    } catch {
      // If existing ABI also not found, throw original error
      throw new Error(`Failed to read artifact: ${error instanceof Error ? error.message : String(error)}`);
    }
    throw new Error(`Failed to read artifact: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function collectAddresses() {
  const entries = {};
  let networkDirs = [];
  try {
    networkDirs = await fs.readdir(DEPLOYMENTS_PATH, { withFileTypes: true });
  } catch (error) {
    // If deployments directory not found (e.g., in Vercel build), try to use existing addresses file
    const existingAddresses = path.join(ROOT, "abi/VerdantWhisperAccordAddresses.ts");
    try {
      const existing = await fs.readFile(existingAddresses, "utf-8");
      // Extract addresses from existing file (it's exported as const)
      const match = existing.match(/export const VerdantWhisperAccordAddresses = ([\s\S]*?) as const/);
      if (match) {
        return JSON.parse(match[1]);
      }
    } catch {
      console.warn("[genabi] No deployments directory found and no existing addresses file. Skipping address map.");
      return entries;
    }
    console.warn("[genabi] No deployments directory found. Skipping address map.");
    return entries;
  }

  for (const entry of networkDirs) {
    if (!entry.isDirectory()) continue;
    const networkName = entry.name;
    const contractFile = path.join(DEPLOYMENTS_PATH, networkName, "VerdantWhisperAccord.json");
    try {
      await fs.access(contractFile);
    } catch {
      continue;
    }

    const json = JSON.parse(await fs.readFile(contractFile, "utf-8"));
    if (!json.address) continue;
    let chainId =
      json.chainId ??
      (typeof json.network === "object" && json.network !== null ? json.network.chainId : undefined);
    if (!chainId && networkName === "localhost") {
      chainId = 31337;
    }
    if (!chainId && networkName === "sepolia") {
      chainId = 11155111;
    }
    const info = {
      address: json.address,
      chainId: chainId ?? null,
      network: networkName,
      blockNumber: json.blockNumber ?? null,
    };
    entries[networkName] = info;
    if (chainId) {
      entries[String(chainId)] = info;
      if (Number(chainId) === 31337) {
        entries["1337"] = info;
      }
    }
  }
  return entries;
}

async function writeABI(abi) {
  await ensureDirectory(ABI_OUTPUT);
  const content = `export const VerdantWhisperAccordABI = ${JSON.stringify(abi, null, 2)} as const;
export type VerdantWhisperAccordABIType = typeof VerdantWhisperAccordABI;
`;
  await fs.writeFile(ABI_OUTPUT, content, "utf-8");
}

async function writeAddresses(addresses) {
  await ensureDirectory(ADDR_OUTPUT);
  const content = `export const VerdantWhisperAccordAddresses = ${JSON.stringify(addresses, null, 2)} as const;
`;
  await fs.writeFile(ADDR_OUTPUT, content, "utf-8");
}

async function main() {
  try {
    await ensureLocalDeploymentIfNeeded();
    const abi = await readArtifact();
    await writeABI(abi);
    const addresses = await collectAddresses();
    await writeAddresses(addresses);
    console.log("[genabi] ABI and address map generated.");
  } catch (error) {
    console.error("[genabi] Failed to generate ABI:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

await main();

