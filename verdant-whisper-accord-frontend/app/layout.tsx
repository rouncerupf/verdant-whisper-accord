"use client";

import "./globals.css";
import { ReactNode } from "react";
import { AppProviders } from "./providers";
import { NavigationBar } from "../components/NavigationBar";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <NavigationBar />
          <main className="page-shell">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}


