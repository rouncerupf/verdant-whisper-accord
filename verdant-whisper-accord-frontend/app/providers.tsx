"use client";

import { ReactNode } from "react";
import { UiPreferencesProvider } from "../lib/ui-preferences";
import { WalletProvider } from "../lib/wallet-provider";
import { RelayerProvider } from "../lib/relayer-provider";

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <UiPreferencesProvider>
      <WalletProvider>
        <RelayerProvider>{children}</RelayerProvider>
      </WalletProvider>
    </UiPreferencesProvider>
  );
};


