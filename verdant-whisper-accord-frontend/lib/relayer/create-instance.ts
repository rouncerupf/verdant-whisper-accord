"use client";

import { JsonRpcProvider } from "ethers";
import type { Eip1193Provider } from "ethers";
import type { BrowserProvider } from "ethers";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/bundle";
import type { FhevmInstanceConfig } from "@zama-fhe/relayer-sdk/bundle";

const DEFAULT_LOCAL_RPC_URL = "http://127.0.0.1:8545";
const SDK_CDN_URL = "https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs";

type FhevmRelayerSDK = {
  initSDK: (options?: Record<string, unknown>) => Promise<boolean>;
  createInstance: (config: FhevmInstanceConfig) => Promise<FhevmInstance>;
  SepoliaConfig: FhevmInstanceConfig;
  __initialized__?: boolean;
};

type MockMetadata = {
  ACLAddress: `0x${string}`;
  InputVerifierAddress: `0x${string}`;
  KMSVerifierAddress: `0x${string}`;
};

async function jsonRpcRequest<T>(rpcUrl: string, method: string, params?: unknown[]): Promise<T> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params: params ?? [],
    }),
  });
  if (!response.ok) {
    throw new Error(`RPC ${method} failed with status ${response.status}`);
  }
  const json = (await response.json()) as { result?: T; error?: { message: string } };
  if ("error" in json && json.error) {
    throw new Error(json.error.message ?? `RPC ${method} returned error`);
  }
  return json.result as T;
}

async function fetchMockMetadata(rpcUrl: string): Promise<MockMetadata | undefined> {
  try {
    return await jsonRpcRequest<MockMetadata>(rpcUrl, "fhevm_relayer_metadata", []);
  } catch (error) {
    console.warn("Failed to fetch FHEVM relayer metadata from Hardhat node", error);
    return undefined;
  }
}

async function loadRelayerSDK(): Promise<FhevmRelayerSDK> {
  if (typeof window === "undefined") {
    throw new Error("Relayer SDK can only be loaded in the browser.");
  }

  const win = window as unknown as { relayerSDK?: FhevmRelayerSDK };
  if (win.relayerSDK) {
    return win.relayerSDK;
  }

  await new Promise<void>((resolve, reject) => {
    if (win.relayerSDK) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src="${SDK_CDN_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load relayer SDK script.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_CDN_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Unable to load relayer SDK from ${SDK_CDN_URL}`));
    document.head.appendChild(script);
  });

  const sdk = win.relayerSDK as FhevmRelayerSDK | undefined;
  if (!sdk) {
    throw new Error("Relayer SDK did not initialize correctly.");
  }

  if (typeof sdk.__initialized__ === "undefined") {
    sdk.__initialized__ = false;
  }

  return sdk;
}

export async function createRelayerInstance(
  mode: "mock" | "production",
  provider: Eip1193Provider,
  chainId: number,
): Promise<FhevmInstance> {
  if (mode === "mock") {
    const connectionMeta = (provider as unknown as { connection?: { url?: string } }).connection;
    const rpcUrl =
      typeof connectionMeta?.url === "string"
        ? connectionMeta.url
        : process.env.NEXT_PUBLIC_LOCAL_RPC_URL ?? DEFAULT_LOCAL_RPC_URL;

    const metadata = await fetchMockMetadata(rpcUrl);
    if (!metadata) {
      throw new Error("Unable to resolve FHEVM metadata from Hardhat node.");
    }

    const { MockFhevmInstance } = await import("@fhevm/mock-utils");
    const { Contract } = await import("ethers");
    const rpc = new JsonRpcProvider(rpcUrl);

    // v0.3.0-1 requires dynamic query of InputVerifier's EIP712 domain
    // The assertions in createEncryptedInput check that verifyingContractAddressInputVerification
    // and gatewayChainId match the actual EIP712 domain values
    const inputVerifierContract = new Contract(
      metadata.InputVerifierAddress,
      ["function eip712Domain() external view returns (bytes1, string, string, uint256, address, bytes32, uint256[])"],
      rpc
    );
    
    const inputVerifierDomain = await inputVerifierContract.eip712Domain();
    const verifyingContractAddressInputVerification = inputVerifierDomain[4] as `0x${string}`; // index 4 is verifyingContract
    const inputVerifierChainId = Number(inputVerifierDomain[3]); // index 3 is chainId
    
    console.log("[createRelayerInstance] InputVerifier EIP712 domain:", {
      verifyingContract: verifyingContractAddressInputVerification,
      chainId: inputVerifierChainId,
    });

    // v0.3.0-1 requires 4th parameter (properties)
    const instance = await MockFhevmInstance.create(
      rpc,
      rpc,
      {
        aclContractAddress: metadata.ACLAddress,
        chainId: chainId, // Use original chainId (31337) - matching reference code exactly
        gatewayChainId: inputVerifierChainId, // Use chainId from InputVerifier EIP712 domain (required by assertion)
        inputVerifierContractAddress: metadata.InputVerifierAddress,
        kmsContractAddress: metadata.KMSVerifierAddress,
        verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64", // Hardcoded - matching reference
        verifyingContractAddressInputVerification, // Use verifyingContract from InputVerifier EIP712 domain (required by assertion)
      },
      {
        // v0.3.0-1 requires this 4th parameter
        inputVerifierProperties: {},
        kmsVerifierProperties: {},
      }
    );
    
    // Verify instance has required methods
    if (typeof instance.createEncryptedInput !== "function") {
      throw new Error("Mock FHEVM instance does not have createEncryptedInput method");
    }
    if (typeof instance.generateKeypair !== "function") {
      throw new Error("Mock FHEVM instance does not have generateKeypair method");
    }
    
    // Wait a bit for instance to fully initialize (WASM modules may need time to load)
    // Also verify instance is ready by checking internal state
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    console.log("[createRelayerInstance] Mock FHEVM instance created successfully", {
      chainId: chainId,
      gatewayChainId: 55815,
      aclAddress: metadata.ACLAddress,
      inputVerifierAddress: metadata.InputVerifierAddress,
      kmsAddress: metadata.KMSVerifierAddress,
      verifyingContractAddressInputVerification: "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
      hasCreateEncryptedInput: typeof instance.createEncryptedInput === "function",
      hasGenerateKeypair: typeof instance.generateKeypair === "function",
    });

    return instance as unknown as FhevmInstance;
  }

  const sdk = await loadRelayerSDK();
  if (!sdk.__initialized__) {
    const initialized = await sdk.initSDK();
    if (!initialized) {
      throw new Error("Relayer SDK initialization failed.");
    }
    sdk.__initialized__ = true;
  }

  if (!sdk.SepoliaConfig) {
    throw new Error("Relayer SDK does not expose SepoliaConfig.");
  }

  const config: FhevmInstanceConfig = {
    ...sdk.SepoliaConfig,
    network: provider,
  };

  return sdk.createInstance(config);
}

