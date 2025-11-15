"use client";

import { useUiPreferences } from "../lib/ui-preferences";

export const ThemeDensityToggle = () => {
  const { themeMode, toggleThemeMode, densityMode, toggleDensityMode } = useUiPreferences();

  return (
    <div className="surface-muted" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <button className="ghost-button" onClick={toggleThemeMode} style={{ minWidth: "120px" }}>
        Theme: {themeMode === "light" ? "Light" : "Dark"}
      </button>
      <button className="ghost-button" onClick={toggleDensityMode} style={{ minWidth: "140px" }}>
        Density: {densityMode === "comfortable" ? "Comfortable" : "Compact"}
      </button>
    </div>
  );
};


