"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Eip1193Provider } from "ethers";
import { BrowserProvider, JsonRpcSigner } from "ethers";

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";
export type RelayerMode = "mock" | "production";

export type Eip6963Connector = {
  id: string;
  name: string;
  icon: string;
  rdns?: string;
  provider: Eip1193Provider;
};

type WalletContextValue = {
  accounts: string[];
  activeAccount?: string;
  chainId: number | null;
  connected: boolean;
  status: ConnectionStatus;
  error?: string;
  provider?: Eip1193Provider;
  browserProvider?: BrowserProvider;
  signer?: JsonRpcSigner;
  connectors: Eip6963Connector[];
  lastConnectorId?: string | null;
  connect: (connectorId?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  ensureChain: (targetChainId: number) => Promise<void>;
  refreshAccounts: () => Promise<void>;
  relayerMode: RelayerMode;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

type AnnounceEvent = CustomEvent<{
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
    description?: string;
  };
  provider: Eip1193Provider;
}>;

const STORAGE_KEYS = {
  connected: "wallet.connected",
  lastAccounts: "wallet.lastAccounts",
  lastChainId: "wallet.lastChainId",
  lastConnectorId: "wallet.lastConnectorId",
} as const;

const RELAYER_MODE: RelayerMode =
  process.env.NEXT_PUBLIC_RELAYER_MODE === "mock" ? "mock" : "production";

const parseHexChainId = (value: unknown): number => {
  if (typeof value === "string") {
    return Number.parseInt(value, 16);
  }
  if (typeof value === "number") return value;
  return NaN;
};

const normalizeAccounts = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((acc): acc is string => typeof acc === "string");
};

const persist = {
  setConnected(connected: boolean) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEYS.connected,
      JSON.stringify(connected),
    );
  },
  setAccounts(accounts: string[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEYS.lastAccounts,
      JSON.stringify(accounts),
    );
  },
  setChainId(chainId: number | null) {
    if (typeof window === "undefined") return;
    if (chainId === null) {
      window.localStorage.removeItem(STORAGE_KEYS.lastChainId);
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEYS.lastChainId,
      JSON.stringify(chainId),
    );
  },
  setConnectorId(connectorId: string | null) {
    if (typeof window === "undefined") return;
    if (!connectorId) {
      window.localStorage.removeItem(STORAGE_KEYS.lastConnectorId);
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.lastConnectorId, connectorId);
  },
};

const readInitialState = () => {
  if (typeof window === "undefined") {
    return {
      connected: false,
      accounts: [] as string[],
      chainId: null as number | null,
      connectorId: null as string | null,
    };
  }
  const connected = JSON.parse(
    window.localStorage.getItem(STORAGE_KEYS.connected) ?? "false",
  ) as boolean;
  const accounts = normalizeAccounts(
    JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.lastAccounts) ?? "[]",
    ) as unknown[],
  );
  const chainIdRaw = window.localStorage.getItem(STORAGE_KEYS.lastChainId);
  const chainId = chainIdRaw ? Number.parseInt(chainIdRaw, 10) : null;
  const connectorId = window.localStorage.getItem(STORAGE_KEYS.lastConnectorId);
  return { connected, accounts, chainId, connectorId };
};

const attachProviderListeners = (
  provider: Eip1193Provider,
  {
    onAccountsChanged,
    onChainChanged,
    onConnect,
    onDisconnect,
  }: {
    onAccountsChanged: (accounts: string[]) => void;
    onChainChanged: (chainId: number) => void;
    onConnect: (chainId: number) => void;
    onDisconnect: () => void;
  },
) => {
  const maybeOn = (event: string, handler: (...args: unknown[]) => void) => {
    if (typeof (provider as unknown as { on?: unknown }).on === "function") {
      (provider as unknown as { on: (event: string, handler: (...args: unknown[]) => void) => void }).on(
        event,
        handler,
      );
    }
  };
  maybeOn("accountsChanged", (accounts: unknown) =>
    onAccountsChanged(normalizeAccounts(accounts)),
  );
  maybeOn("chainChanged", (chainId: unknown) =>
    onChainChanged(parseHexChainId(chainId)),
  );
  maybeOn("connect", (payload: unknown) => {
    if (
      payload &&
      typeof payload === "object" &&
      "chainId" in payload &&
      typeof (payload as { chainId: unknown }).chainId !== "undefined"
    ) {
      onConnect(parseHexChainId((payload as { chainId: unknown }).chainId));
    }
  });
  maybeOn("disconnect", () => onDisconnect());
};

const detachProviderListeners = (provider: Eip1193Provider) => {
  if (typeof (provider as unknown as { removeAllListeners?: unknown })
    .removeAllListeners === "function") {
    (provider as unknown as { removeAllListeners: () => void }).removeAllListeners();
    return;
  }
  (["accountsChanged", "chainChanged", "connect", "disconnect"] as const).forEach(
    (event) => {
      if (typeof (provider as unknown as { removeListener?: unknown })
        .removeListener === "function") {
        (provider as unknown as { removeListener: (event: string, handler: (...args: unknown[]) => void) => void }).removeListener(
          event,
          () => undefined,
        );
      }
    },
  );
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [error, setError] = useState<string | undefined>(undefined);
  const [browserProvider, setBrowserProvider] = useState<BrowserProvider>();
  const [signer, setSigner] = useState<JsonRpcSigner>();
  const [provider, setProvider] = useState<Eip1193Provider | undefined>(
    undefined,
  );
  const [connectors, setConnectors] = useState<Eip6963Connector[]>([]);
  const [lastConnectorId, setLastConnectorId] = useState<string | null>(null);

  const connectorsMapRef = useRef<Map<string, Eip1193Provider>>(new Map());
  const pendingConnectionRef = useRef<Promise<void> | null>(null);

  const resetState = useCallback(() => {
    setAccounts([]);
    setChainId(null);
    setConnected(false);
    setBrowserProvider(undefined);
    setSigner(undefined);
    setProvider(undefined);
    setStatus("idle");
    setError(undefined);
  }, []);

  const updateFromProvider = useCallback(
    async (
      selectedProvider: Eip1193Provider,
      connectorId: string,
      opts: { silent?: boolean } = {},
    ) => {
      setStatus(opts.silent ? "idle" : "connecting");
      setError(undefined);

      const requestMethod = opts.silent ? "eth_accounts" : "eth_requestAccounts";

      const requestedAccounts = normalizeAccounts(
        (await selectedProvider.request({
          method: requestMethod,
        })) as unknown[],
      );

      if (requestedAccounts.length === 0) {
        if (!opts.silent) {
          setStatus("idle");
        }
        return;
      }

      const chainIdHex = await selectedProvider.request({
        method: "eth_chainId",
      });
      const resolvedChainId = parseHexChainId(chainIdHex);

      const browser = new BrowserProvider(selectedProvider);
      const nextSigner = await browser.getSigner();

      const accountLower = requestedAccounts.map((acc) => acc.toLowerCase());

      setAccounts(accountLower);
      setChainId(resolvedChainId);
      setConnected(true);
      setStatus("connected");
      setBrowserProvider(browser);
      setSigner(nextSigner);
      setProvider(selectedProvider);
      setLastConnectorId(connectorId);

      persist.setConnected(true);
      persist.setAccounts(accountLower);
      persist.setChainId(resolvedChainId);
      persist.setConnectorId(connectorId);

      attachProviderListeners(selectedProvider, {
        onAccountsChanged: (nextAccounts) => {
          if (nextAccounts.length === 0) {
            void disconnect();
            return;
          }
          const normalized = nextAccounts.map((acc) => acc.toLowerCase());
          setAccounts(normalized);
          persist.setAccounts(normalized);
        },
        onChainChanged: (nextChainId) => {
          setChainId(nextChainId);
          persist.setChainId(nextChainId);
        },
        onConnect: (id) => {
          setChainId(id);
          persist.setChainId(id);
        },
        onDisconnect: () => {
          void disconnect();
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const connect = useCallback(
    async (connectorId?: string) => {
      if (pendingConnectionRef.current) {
        await pendingConnectionRef.current;
        return;
      }

      const targetId =
        connectorId ??
        lastConnectorId ??
        connectors[0]?.id ??
        (connectorsMapRef.current.has("injected:window.ethereum")
          ? "injected:window.ethereum"
          : undefined);

      if (!targetId) {
        setError("No wallet connector detected.");
        setStatus("error");
        return;
      }

      const selectedProvider = connectorsMapRef.current.get(targetId);
      if (!selectedProvider) {
        setError("Selected wallet connector is unavailable.");
        setStatus("error");
        return;
      }

      const promise = updateFromProvider(selectedProvider, targetId, {
        silent: false,
      }).catch((err) => {
        console.error("Wallet connect error", err);
        setError(
          err?.message ?? "Unable to connect wallet. Check provider status.",
        );
        setStatus("error");
      });

      pendingConnectionRef.current = promise.then(() => {
        pendingConnectionRef.current = null;
      });
      await promise;
    },
    [connectors, lastConnectorId, updateFromProvider],
  );

  const disconnect = useCallback(async () => {
    if (provider) {
      detachProviderListeners(provider);
    }
    persist.setConnected(false);
    persist.setAccounts([]);
    persist.setChainId(null);
    // keep last connector id to speed up reconnection
    setLastConnectorId((current) => current);
    resetState();
  }, [provider, resetState]);

  const ensureChain = useCallback(
    async (targetChainId: number) => {
      if (!provider) return;
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        });
      } catch (err) {
        console.warn("wallet_switchEthereumChain rejected", err);
        throw err;
      }
    },
    [provider],
  );

  const refreshAccounts = useCallback(async () => {
    if (!provider || !lastConnectorId) return;
    await updateFromProvider(provider, lastConnectorId, { silent: true });
  }, [provider, lastConnectorId, updateFromProvider]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const initial = readInitialState();
    setAccounts(initial.accounts);
    setChainId(initial.chainId);
    setConnected(initial.connected);
    setLastConnectorId(initial.connectorId ?? null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const map = connectorsMapRef.current;

    const upsertConnector = (entry: Eip6963Connector) => {
      map.set(entry.id, entry.provider);
      setConnectors((prev) => {
        const has = prev.some((item) => item.id === entry.id);
        if (has) return prev;
        return [...prev, entry];
      });
    };

    const handler = (event: Event) => {
      const detail = (event as AnnounceEvent).detail;
      if (!detail || !detail.info || !detail.provider) {
        return;
      }
      const connector: Eip6963Connector = {
        id: detail.info.rdns ?? detail.info.uuid ?? crypto.randomUUID(),
        name: detail.info.name,
        icon: detail.info.icon,
        rdns: detail.info.rdns,
        provider: detail.provider,
      };
      upsertConnector(connector);
    };

    window.addEventListener(
      "eip6963:announceProvider",
      handler as EventListener,
    );
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    const ethereum = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
    if (ethereum) {
      upsertConnector({
        id: "injected:window.ethereum",
        name: "Browser Wallet",
        icon: "",
        provider: ethereum,
      });
    }

    return () => {
      window.removeEventListener(
        "eip6963:announceProvider",
        handler as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (!connected) {
      void (async () => {
        if (!lastConnectorId) {
          return;
        }
        const providerCandidate = connectorsMapRef.current.get(lastConnectorId);
        if (providerCandidate) {
          await updateFromProvider(providerCandidate, lastConnectorId, {
            silent: true,
          });
        }
      })();
    }
  }, [connected, lastConnectorId, connectors, updateFromProvider]);

  const value = useMemo<WalletContextValue>(
    () => ({
      accounts,
      activeAccount: accounts[0],
      chainId,
      connected,
      status,
      error,
      provider,
      browserProvider,
      signer,
      connectors,
      lastConnectorId,
      connect,
      disconnect,
      ensureChain,
      refreshAccounts,
      relayerMode: RELAYER_MODE,
    }),
    [
      accounts,
      chainId,
      connected,
      status,
      error,
      provider,
      browserProvider,
      signer,
      connectors,
      lastConnectorId,
      connect,
      disconnect,
      ensureChain,
      refreshAccounts,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};

