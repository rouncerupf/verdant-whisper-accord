"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Eip1193Provider } from "ethers";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/bundle";
import { createRelayerInstance } from "./relayer/create-instance";
import { useWallet } from "./wallet-provider";

type RelayerStatus = "idle" | "loading" | "ready" | "error";

type DecryptionSignaturePayload = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number;
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
};

type DecryptHandle = {
  handle: string;
  contractAddress: `0x${string}`;
};

type RelayerContextValue = {
  instance?: FhevmInstance;
  status: RelayerStatus;
  error?: string;
  ensureSignature: (contractAddresses: `0x${string}`[]) => Promise<DecryptionSignaturePayload | null>;
  userDecrypt: (handles: DecryptHandle[]) => Promise<Record<string, string | bigint | boolean>>;
  refreshInstance: () => Promise<void>;
};

const RelayerContext = createContext<RelayerContextValue | undefined>(undefined);

const SIGNATURE_KEY_PREFIX = "fhevm.decryptionSignature.";

const secondsInDay = 24 * 60 * 60;

const normalizeAddresses = (addresses: `0x${string}`[]): `0x${string}`[] => {
  const set = new Set<string>();
  addresses.forEach((addr) => {
    set.add(addr.toLowerCase());
  });
  return Array.from(set) as `0x${string}`[];
};

const compareAddressSets = (a: `0x${string}`[], b: `0x${string}`[]) => {
  if (a.length !== b.length) return false;
  const setA = new Set(a.map((addr) => addr.toLowerCase()));
  return b.every((addr) => setA.has(addr.toLowerCase()));
};

const readStoredSignature = (account: string): DecryptionSignaturePayload | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`${SIGNATURE_KEY_PREFIX}${account.toLowerCase()}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DecryptionSignaturePayload;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn("Failed to parse stored FHEVM signature", error);
    return null;
  }
};

const storeSignature = (payload: DecryptionSignaturePayload) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${SIGNATURE_KEY_PREFIX}${payload.userAddress.toLowerCase()}`,
    JSON.stringify(payload),
  );
};

export const RelayerProvider = ({ children }: { children: ReactNode }) => {
  const { browserProvider, provider, signer, chainId, relayerMode, connected } = useWallet();
  const [instance, setInstance] = useState<FhevmInstance | undefined>(undefined);
  const [status, setStatus] = useState<RelayerStatus>("idle");
  const [error, setError] = useState<string | undefined>(undefined);

  const resolveProvider = useCallback((): Eip1193Provider | undefined => {
    if (browserProvider) {
      return browserProvider.provider as unknown as Eip1193Provider;
    }
    if (provider) {
      return provider;
    }
    return undefined;
  }, [browserProvider, provider]);

  const initInstance = useCallback(async () => {
    const resolvedProvider = resolveProvider();
    if (!resolvedProvider || !chainId) {
      setInstance(undefined);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    setError(undefined);

    try {
      const created = await createRelayerInstance(relayerMode, resolvedProvider, chainId);
      setInstance(created);
      setStatus("ready");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to initialise FHEVM relayer instance.";
      console.error(message, err);
      setError(message);
      setInstance(undefined);
      setStatus("error");
    }
  }, [chainId, relayerMode, resolveProvider]);

  useEffect(() => {
    void initInstance();
  }, [initInstance]);

  const ensureSignature = useCallback<
    RelayerContextValue["ensureSignature"]
  >(async (contractAddresses) => {
    if (!instance || !signer) {
      return null;
    }

    const account = ((await signer.getAddress()) ?? "").toLowerCase();
    if (!account) {
      return null;
    }
    const normalized = normalizeAddresses(contractAddresses);
    
    // Ensure contractAddresses is not empty
    if (normalized.length === 0) {
      throw new Error("At least one contract address is required for decryption signature.");
    }
    
    // Always generate a new signature (no caching)
    const { publicKey, privateKey } = instance.generateKeypair();
    const now = Math.floor(Date.now() / 1000);
    const startTimestamp = now;
    const durationDays = 365;
    
    // Ensure publicKey is a valid string
    if (!publicKey || typeof publicKey !== "string") {
      throw new Error("Failed to generate valid keypair for FHEVM decryption.");
    }
    
    // Convert normalized addresses to string[] (FHEVM expects string[], not 0x${string}[])
    const contractAddressesAsStrings = normalized.map((addr) => addr as string);
    
    const eip712 = instance.createEIP712(publicKey, contractAddressesAsStrings, startTimestamp, durationDays);

    const signature = await signer.signTypedData(
      eip712.domain,
      { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
      eip712.message,
    );

    const payload: DecryptionSignaturePayload = {
      publicKey,
      privateKey,
      signature,
      startTimestamp,
      durationDays,
      contractAddresses: normalized,
      userAddress: account as `0x${string}`,
    };

    // Don't store signature - always generate new one on each decryption
    return payload;
  }, [instance, signer]);

  const userDecrypt = useCallback<RelayerContextValue["userDecrypt"]>(
    async (handles) => {
      if (!instance || !signer) {
        throw new Error("FHEVM instance or signer unavailable.");
      }
      if (handles.length === 0) {
        return {};
      }
      const account = ((await signer.getAddress()) ?? "").toLowerCase();
      const normalizedContracts = normalizeAddresses(
        handles.map((item) => item.contractAddress),
      );
      const signature = await ensureSignature(normalizedContracts);
      if (!signature) {
        throw new Error("Unable to prepare FHEVM decryption signature.");
      }

      const userAddress = account as `0x${string}`;
      const result = await instance.userDecrypt(
        handles,
        signature.privateKey,
        signature.publicKey,
        signature.signature,
        signature.contractAddresses,
        userAddress,
        signature.startTimestamp,
        signature.durationDays,
      );
      return result;
    },
    [ensureSignature, instance, signer],
  );

  const value = useMemo<RelayerContextValue>(
    () => ({
      instance,
      status: connected ? status : "idle",
      error: connected ? error : undefined,
      ensureSignature,
      userDecrypt,
      refreshInstance: initInstance,
    }),
    [instance, status, error, ensureSignature, userDecrypt, initInstance, connected],
  );

  return <RelayerContext.Provider value={value}>{children}</RelayerContext.Provider>;
};

export const useRelayer = () => {
  const context = useContext(RelayerContext);
  if (!context) {
    throw new Error("useRelayer must be used within RelayerProvider");
  }
  return context;
};

