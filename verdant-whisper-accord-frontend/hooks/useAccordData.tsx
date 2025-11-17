"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Contract, ethers } from "ethers";
import { useWallet } from "../lib/wallet-provider";
import { useRelayer } from "../lib/relayer-provider";
import {
  createAccordContract,
  resolveAccordAddress,
  toInitiativeStatus,
  InitiativeStatus,
} from "../lib/contracts/verdantWhisperAccord";
import { formatAddress } from "../lib/utils/format";

type EncryptedHandles = {
  requestedBudget: string;
  allocatedBudget: string;
  basePriority: string;
  voteTally: string;
  detailHandle: string;
};

export type InitiativeRecord = {
  id: number;
  proposer: string;
  status: InitiativeStatus;
  summaryCiphertext: string;
  resourcesCiphertext: string;
  handles: EncryptedHandles;
  decrypted?: {
    requestedBudget?: bigint;
    allocatedBudget?: bigint;
    basePriority?: bigint;
    voteTally?: bigint;
    detailHandle?: bigint;
  };
};

export type GlobalEncryptedTotals = {
  requested: string;
  allocated: string;
  priority: string;
};

type AccordState = {
  initiatives: InitiativeRecord[];
  totals?: GlobalEncryptedTotals;
  loading: boolean;
  error?: string;
  contractAddress?: `0x${string}`;
};

const serializeToBigInt = (value: string | bigint | boolean | undefined) => {
  if (typeof value === "bigint") return value;
  if (typeof value === "string" && value !== "") return BigInt(value);
  if (typeof value === "boolean") return value ? 1n : 0n;
  return 0n;
};

export const useAccordData = () => {
  const { browserProvider, signer, chainId, connected } = useWallet();
  const { userDecrypt } = useRelayer();

  const [state, setState] = useState<AccordState>({
    initiatives: [],
    loading: false,
  });

  const readRunner = useMemo(() => {
    if (browserProvider) return browserProvider;
    if (signer) return signer;
    return undefined;
  }, [browserProvider, signer]);

  const contractAddress = useMemo(() => resolveAccordAddress(chainId ?? undefined), [chainId]);

  const contract = useMemo(() => {
    if (!readRunner) return undefined;
    return createAccordContract(readRunner, chainId ?? undefined);
  }, [readRunner, chainId]);

  const refresh = useCallback(async () => {
    if (!contract || !contractAddress) {
      setState((prev) => ({
        ...prev,
        loading: false,
        contractAddress,
        error: contractAddress ? undefined : "Contract not deployed on this network.",
        initiatives: [],
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: undefined, contractAddress }));

    try {
      const countRaw = await contract.initiativeCount();
      const total = Number(countRaw);

      const initiatives: InitiativeRecord[] = [];

      for (let index = 0; index < total; index++) {
        const [proposer, rawStatus, summary, resources] = await contract.getInitiative(index);
        const [requestedBudget, allocatedBudget] = await contract.getInitiativeBudgets(index);
        const [basePriority, voteTally] = await contract.getInitiativePriority(index);
        const detailHandle = await contract.getDetailHandle(index);

        const summaryHex = typeof summary === "string" ? summary : ethers.hexlify(summary);
        const resourcesHex = typeof resources === "string" ? resources : ethers.hexlify(resources);

        initiatives.push({
          id: index,
          proposer,
          status: toInitiativeStatus(Number(rawStatus)),
          summaryCiphertext: summaryHex,
          resourcesCiphertext: resourcesHex,
          handles: {
            requestedBudget,
            allocatedBudget,
            basePriority,
            voteTally,
            detailHandle,
          },
        });
      }

      const [totalRequested, totalAllocated, totalPriority] = await contract.getGlobalTotals();

      setState({
        initiatives,
        totals: {
          requested: totalRequested,
          allocated: totalAllocated,
          priority: totalPriority,
        },
        loading: false,
        contractAddress,
      });
    } catch (error) {
      console.error("Failed to refresh Verdant Whisper Accord data", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to query Verdant Whisper Accord contract.",
      }));
    }
  }, [contract, contractAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh, connected]);

  const decryptGlobalTotals = useCallback(async () => {
    if (!state.totals || !contractAddress) return undefined;
    const handles = [
      { handle: state.totals.requested, contractAddress },
      { handle: state.totals.allocated, contractAddress },
      { handle: state.totals.priority, contractAddress },
    ];

    const decrypted = await userDecrypt(handles);
    return {
      requested: serializeToBigInt(decrypted[state.totals.requested]),
      allocated: serializeToBigInt(decrypted[state.totals.allocated]),
      priority: serializeToBigInt(decrypted[state.totals.priority]),
    };
  }, [state.totals, contractAddress, userDecrypt]);

  const decryptInitiative = useCallback(
    async (record: InitiativeRecord) => {
      if (!contractAddress) return undefined;
      const handles = [
        {
          handle: record.handles.requestedBudget,
          contractAddress,
        },
        {
          handle: record.handles.allocatedBudget,
          contractAddress,
        },
        {
          handle: record.handles.basePriority,
          contractAddress,
        },
        {
          handle: record.handles.voteTally,
          contractAddress,
        },
        {
          handle: record.handles.detailHandle,
          contractAddress,
        },
      ];
      const decrypted = await userDecrypt(handles);
      const next = {
        requestedBudget: serializeToBigInt(decrypted[record.handles.requestedBudget]),
        allocatedBudget: serializeToBigInt(decrypted[record.handles.allocatedBudget]),
        basePriority: serializeToBigInt(decrypted[record.handles.basePriority]),
        voteTally: serializeToBigInt(decrypted[record.handles.voteTally]),
        detailHandle: serializeToBigInt(decrypted[record.handles.detailHandle]),
      };
      setState((prev) => ({
        ...prev,
        initiatives: prev.initiatives.map((item) =>
          item.id === record.id ? { ...item, decrypted: next } : item,
        ),
      }));
      return next;
    },
    [contractAddress, userDecrypt],
  );

  return {
    ...state,
    refresh,
    decryptGlobalTotals,
    decryptInitiative,
    contractAddress,
    chainId,
    connected,
    formattedContractAddress: contractAddress ? formatAddress(contractAddress) : undefined,
  };
};

