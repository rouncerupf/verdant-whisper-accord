"use client";

import { useCallback, useMemo } from "react";
import { ethers } from "ethers";
import { useWallet } from "../lib/wallet-provider";
import { useRelayer } from "../lib/relayer-provider";
import {
  createAccordContract,
  resolveAccordAddress,
} from "../lib/contracts/verdantWhisperAccord";

type SubmissionPayload = {
  title: string;
  summary: string;
  resources: string[];
  requestedBudget: number;
  basePriority: number;
  timeline: string;
};

type SimulationResult = {
  requested: bigint;
  allocated: bigint;
  remaining: bigint;
};

const toBigInt = (value: string | bigint | boolean | undefined) => {
  if (typeof value === "bigint") return value;
  if (typeof value === "string" && value !== "") return BigInt(value);
  if (typeof value === "boolean") return value ? 1n : 0n;
  return 0n;
};

export const useAccordActions = () => {
  const { signer, chainId, ensureChain } = useWallet();
  const { instance, userDecrypt } = useRelayer();

  const contractAddress = useMemo(() => resolveAccordAddress(chainId ?? undefined), [chainId]);

  const contract = useMemo(() => {
    if (!signer) return undefined;
    return createAccordContract(signer, chainId ?? undefined);
  }, [signer, chainId]);

  const ensureActiveChain = useCallback(async () => {
    if (chainId) {
      await ensureChain(chainId);
    }
  }, [ensureChain, chainId]);

  const assertReady = useCallback(() => {
    if (!signer) {
      throw new Error("Connect a wallet to interact with Verdant Whisper Accord.");
    }
    if (!instance) {
      throw new Error("Relayer is not initialised yet. Please wait for SDK to be ready.");
    }
    if (!contract || !contractAddress) {
      throw new Error("Verdant Whisper Accord is not deployed for the selected network.");
    }
    // Verify instance has required methods
    if (typeof instance.createEncryptedInput !== "function") {
      throw new Error("FHEVM instance is not properly initialized. Missing createEncryptedInput method.");
    }
  }, [signer, instance, contract, contractAddress]);

  const submitInitiative = useCallback(
    async (payload: SubmissionPayload) => {
      assertReady();
      if (!contract || !instance || !signer || !contractAddress) return;

      await ensureActiveChain();

      const proposer = await signer.getAddress();
      const summaryBytes = new TextEncoder().encode(payload.summary);
      const resourcesBytes = new TextEncoder().encode(payload.resources.join(","));
      const detailSeed = `${payload.title}:${payload.timeline}:${payload.resources.join("|")}`;
      const detailHash = ethers.keccak256(ethers.toUtf8Bytes(detailSeed));
      const detailScalar = Number(BigInt.asUintN(32, BigInt(detailHash)));

      // Ensure contractAddress is a string (not undefined)
      if (!contractAddress) {
        throw new Error("Contract address is not available.");
      }

      // Convert addresses to strings (FHEVM expects string type, not 0x${string})
      // Use addresses as-is (matching reference code - no getAddress conversion)
      const contractAddressStr = contractAddress as string;
      const proposerStr = proposer as string;

      // Validate addresses
      if (!ethers.isAddress(contractAddressStr)) {
        throw new Error(`Invalid contract address: ${contractAddressStr}`);
      }
      if (!ethers.isAddress(proposerStr)) {
        throw new Error(`Invalid proposer address: ${proposerStr}`);
      }
      
      console.log("[submitInitiative] Address format check:", {
        contractAddress: contractAddressStr,
        proposer: proposerStr,
        contractIsChecksum: contractAddressStr === ethers.getAddress(contractAddressStr),
        proposerIsChecksum: proposerStr === ethers.getAddress(proposerStr),
      });

      // Verify instance has createEncryptedInput method before proceeding
      if (typeof instance.createEncryptedInput !== "function") {
        throw new Error("FHEVM instance does not have createEncryptedInput method. Instance may not be properly initialized.");
      }

      // Add a longer delay to let WASM modules fully load and instance to fully initialize
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Try to verify instance is ready by checking if we can access internal properties
      console.log("[submitInitiative] Instance ready check:", {
        instanceType: instance?.constructor?.name,
        hasCreateEncryptedInput: typeof instance?.createEncryptedInput === "function",
        instanceKeys: instance ? Object.keys(instance as Record<string, unknown>).slice(0, 10) : [],
      });

      let budgetInput, priorityInput, detailInput;
      try {
        console.log("[submitInitiative] Creating encrypted inputs:", {
          contractAddress: contractAddressStr,
          proposer: proposerStr,
          budget: payload.requestedBudget,
          priority: payload.basePriority,
          detailScalar,
          instanceType: instance?.constructor?.name,
        });

        // Create encrypted inputs one at a time to avoid overwhelming the browser
        // Match reference code pattern: createEncryptedInput(address, address)
        console.log("[submitInitiative] Calling createEncryptedInput for budget...");
        
        // Try to access instance internals to verify it's ready
        // This might help identify if there's an initialization issue
        const instanceAny = instance as unknown as Record<string, unknown>;
        console.log("[submitInitiative] Instance internals check:", {
          hasPublicKey: typeof instanceAny.publicKey !== "undefined",
          hasPrivateKey: typeof instanceAny.privateKey !== "undefined",
          hasRpc: typeof instanceAny.rpc !== "undefined",
          hasProvider: typeof instanceAny.provider !== "undefined",
          instanceProtoKeys: instanceAny ? Object.getOwnPropertyNames(Object.getPrototypeOf(instanceAny)).slice(0, 10) : [],
        });
        
        const budgetBuilder = instance.createEncryptedInput(contractAddressStr, proposerStr);
        budgetBuilder.add64(BigInt(Math.max(payload.requestedBudget, 0)));
        budgetInput = await budgetBuilder.encrypt();
        console.log("[submitInitiative] Budget input encrypted successfully");

        const priorityBuilder = instance.createEncryptedInput(contractAddressStr, proposerStr);
        priorityBuilder.add32(Math.max(payload.basePriority, 0));
        priorityInput = await priorityBuilder.encrypt();
        console.log("[submitInitiative] Priority input encrypted successfully");

        const detailBuilder = instance.createEncryptedInput(contractAddressStr, proposerStr);
        detailBuilder.add32(detailScalar);
        detailInput = await detailBuilder.encrypt();
        console.log("[submitInitiative] Detail input encrypted successfully");
      } catch (error) {
        // Capture full error information - handle different error types
        let errorMessage = "Unknown error";
        let errorName = "UnknownError";
        let errorStack = "No stack trace";
        
        if (error instanceof Error) {
          errorMessage = error.message;
          errorName = error.name;
          errorStack = error.stack || "No stack trace";
        } else if (typeof error === "string") {
          errorMessage = error;
        } else if (error && typeof error === "object") {
          errorMessage = (error as { message?: string }).message || String(error);
          errorName = (error as { name?: string }).name || "Error";
        } else {
          errorMessage = String(error);
        }
        
        // Log full error details - try to extract all possible error information
        const errorDetails: Record<string, unknown> = {
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          name: errorName,
          message: errorMessage,
          stack: errorStack,
          contractAddress: contractAddressStr,
          proposer: proposerStr,
          instanceType: instance?.constructor?.name,
          hasCreateEncryptedInput: typeof instance?.createEncryptedInput === "function",
        };
        
        // Try to extract additional error properties
        if (error && typeof error === "object") {
          const errorObj = error as Record<string, unknown>;
          Object.keys(errorObj).forEach(key => {
            if (!errorDetails[key]) {
              errorDetails[key] = errorObj[key];
            }
          });
        }
        
        // Also log the raw error object
        console.error("[submitInitiative] Encryption error (raw):", error);
        console.error("[submitInitiative] Encryption error (details):", errorDetails);
        
        // Re-throw with more context
        throw new Error(`Encryption failed: ${errorMessage} (${errorName}). Please ensure FHEVM instance is properly initialized and WASM modules are loaded.`);
      }

      const tx = await contract.submitInitiative({
        summaryCiphertext: summaryBytes,
        resourcesCiphertext: resourcesBytes,
        requestedBudgetCipher: budgetInput.handles[0],
        requestedBudgetProof: budgetInput.inputProof,
        basePriorityCipher: priorityInput.handles[0],
        basePriorityProof: priorityInput.inputProof,
        detailHandleCipher: detailInput.handles[0],
        detailHandleProof: detailInput.inputProof,
      });

      await tx.wait();
    },
    [assertReady, contract, instance, signer, contractAddress, ensureActiveChain],
  );

  const simulateAllocation = useCallback(
    async (initiativeIds: number[], poolBudget: number): Promise<SimulationResult | undefined> => {
      assertReady();
      if (!contract || !instance || !signer || !contractAddress) return undefined;
      await ensureActiveChain();

      const caller = await signer.getAddress();
      const poolInput = await instance
        .createEncryptedInput(contractAddress, caller)
        .add64(BigInt(Math.max(poolBudget, 0)))
        .encrypt();

      const tx = await contract.simulateAllocation(
        initiativeIds,
        poolInput.handles[0],
        poolInput.inputProof,
      );
      await tx.wait();

      const snapshot = await contract.getAllocationSnapshot(caller);
      const decrypted = await userDecrypt([
        { handle: snapshot.totalRequested, contractAddress },
        { handle: snapshot.totalAllocated, contractAddress },
        { handle: snapshot.remaining, contractAddress },
      ]);

      return {
        requested: toBigInt(decrypted[snapshot.totalRequested]),
        allocated: toBigInt(decrypted[snapshot.totalAllocated]),
        remaining: toBigInt(decrypted[snapshot.remaining]),
      };
    },
    [assertReady, contract, instance, signer, contractAddress, ensureActiveChain, userDecrypt],
  );

  const castVote = useCallback(
    async (initiativeId: number, weight: number) => {
      assertReady();
      if (!contract || !instance || !signer || !contractAddress) return;
      await ensureActiveChain();

      const voter = await signer.getAddress();
      const weightInput = await instance
        .createEncryptedInput(contractAddress, voter)
        .add32(Math.max(weight, 0))
        .encrypt();

      const tx = await contract.castVote(
        initiativeId,
        weightInput.handles[0],
        weightInput.inputProof,
      );
      await tx.wait();
    },
    [assertReady, contract, instance, signer, contractAddress, ensureActiveChain],
  );

  const simulateApproval = useCallback(
    async (initiativeIds: number[]) => {
      assertReady();
      if (!contract || !signer) return;
      await ensureActiveChain();
      const tx = await contract.simulateApproval(initiativeIds);
      await tx.wait();
    },
    [assertReady, contract, signer, ensureActiveChain],
  );

  const approveInitiative = useCallback(
    async (initiativeId: number, allocationAmount: number) => {
      assertReady();
      if (!contract || !instance || !signer || !contractAddress) return;
      await ensureActiveChain();

      const committee = await signer.getAddress();
      const allocationInput = await instance
        .createEncryptedInput(contractAddress, committee)
        .add64(BigInt(Math.max(allocationAmount, 0)))
        .encrypt();

      const tx = await contract.approveInitiative(
        initiativeId,
        allocationInput.handles[0],
        allocationInput.inputProof,
      );
      await tx.wait();
    },
    [assertReady, contract, instance, signer, contractAddress, ensureActiveChain],
  );

  const authorizeDetailHandle = useCallback(
    async (initiativeId: number, account: `0x${string}`) => {
      assertReady();
      if (!contract || !signer) return;
      await ensureActiveChain();
      const tx = await contract.authorizeDetailHandle(initiativeId, account);
      await tx.wait();
    },
    [assertReady, contract, signer, ensureActiveChain],
  );

  const requestDecryption = useCallback(
    async (initiativeId: number) => {
      assertReady();
      if (!contract || !signer) return;
      await ensureActiveChain();
      const tx = await contract.requestDecryption(initiativeId);
      await tx.wait();
    },
    [assertReady, contract, signer, ensureActiveChain],
  );

  return {
    submitInitiative,
    simulateAllocation,
    simulateApproval,
    castVote,
    approveInitiative,
    authorizeDetailHandle,
    requestDecryption,
    contractAddress,
  };
};

