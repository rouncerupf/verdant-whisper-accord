"use client";

import { useEffect, useRef, useState } from "react";
import { ThemeDensityToggle } from "./ThemeDensityToggle";

export const PreferencesMenu = () => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        className="ghost-button"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        title="Appearance preferences"
      >
        Appearance
      </button>
      {open ? (
        <div
          className="surface-card"
          style={{
            position: "absolute",
            right: 0,
            marginTop: "0.5rem",
            width: "220px",
            zIndex: 40,
          }}
        >
          <ThemeDensityToggle />
        </div>
      ) : null}
    </div>
  );
};


