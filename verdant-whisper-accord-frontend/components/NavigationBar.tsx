"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { WalletConnectButton } from "./WalletConnectButton";
import { RelayerStatusIndicator } from "./RelayerStatusIndicator";
import { useAccordData } from "../hooks/useAccordData";
import { PreferencesMenu } from "./PreferencesMenu";

type NavLink = { href: Route; label: string };

const LINKS: NavLink[] = [
  { href: "/dashboard" as Route, label: "Dashboard" },
  { href: "/submit" as Route, label: "Submit" },
  { href: "/approvals" as Route, label: "Approvals" },
  { href: "/decrypt" as Route, label: "Decrypt" },
];

export const NavigationBar = () => {
  const pathname = usePathname();
  const { formattedContractAddress, contractAddress } = useAccordData();

  return (
    <header className="nav-shell">
      <div className="nav-inner">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-family-headings)",
              fontSize: "1.35rem",
              fontWeight: 600,
              letterSpacing: "0.01em",
            }}
            title={contractAddress ? `Contract ${formattedContractAddress}` : "Contract not deployed"}
          >
            Verdant Whisper Accord
          </Link>
        </div>
        <nav className="nav-links">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "var(--radius-pill)",
                background:
                  pathname === link.href
                    ? "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-strong) 100%)"
                    : "transparent",
                color:
                  pathname === link.href ? "var(--color-text-on-accent)" : "var(--color-text-secondary)",
                fontWeight: 600,
                transition: "background var(--motion-duration-quick) var(--motion-easing-standard)",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <RelayerStatusIndicator />
          <PreferencesMenu />
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
};

