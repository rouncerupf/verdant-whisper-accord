export type ThemeMode = "light" | "dark";
export type DensityMode = "comfortable" | "compact";

const seed = "03d1a83ae2d345feb10d725b22b9bc72b40617bff889f8291863040009e5abcf";

const basePalette = {
  mist: {
    100: "#E3F2EB",
    200: "#C6E5D8",
    300: "#A4D5C2",
    400: "#80C3AA",
    500: "#4EA987",
    600: "#3C8D6F",
    700: "#2D7058",
    800: "#205544",
  },
  charcoal: {
    100: "#F2F4F3",
    200: "#E4E7E5",
    300: "#C6CAC7",
    400: "#9CA39F",
    500: "#6E7A74",
    600: "#4A564F",
    700: "#2E3A34",
    800: "#1A241F",
  },
  accent: {
    100: "#E8EEF8",
    200: "#C6D6EA",
    300: "#9CB7D6",
    400: "#6C92BF",
    500: "#426BA1",
    600: "#315180",
    700: "#223A60",
    800: "#152541",
  },
};

const colors = {
  light: {
    background: basePalette.charcoal[100],
    surface: "#FFFFFF",
    surfaceMuted: "#F0F4F1",
    outline: "rgba(46, 58, 52, 0.12)",
    overlay: "rgba(26, 36, 31, 0.08)",
    textPrimary: basePalette.charcoal[700],
    textSecondary: basePalette.charcoal[500],
    textOnAccent: "#FFFFFF",
    primary: basePalette.mist[600],
    primaryStrong: basePalette.mist[700],
    primaryWeak: basePalette.mist[200],
    accent: basePalette.accent[500],
    danger: "#C05B4D",
    success: "#2E7D5D",
    warning: "#B88A2E",
  },
  dark: {
    background: "#0D1714",
    surface: "#15241F",
    surfaceMuted: "#1E2F29",
    outline: "rgba(227, 242, 235, 0.14)",
    overlay: "rgba(0, 0, 0, 0.32)",
    textPrimary: "#E4F2EC",
    textSecondary: "#B7C7C0",
    textOnAccent: "#0D1714",
    primary: basePalette.mist[400],
    primaryStrong: basePalette.mist[200],
    primaryWeak: basePalette.mist[700],
    accent: basePalette.accent[300],
    danger: "#F08F7A",
    success: "#7ED4AC",
    warning: "#F7C768",
  },
};

const typography = {
  fontFamily: "'Manrope', 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  headingsFamily: "'Outfit', 'Manrope', 'Inter', sans-serif",
  sizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.5rem",
    "2xl": "1.875rem",
  },
  lineHeights: {
    tight: 1.1,
    snug: 1.3,
    relaxed: 1.5,
  },
  letterSpacing: {
    normal: "0",
    wide: "0.02em",
  },
};

const spacing = {
  none: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
};

const radii = {
  sm: "0.4rem",
  md: "0.8rem",
  lg: "1.2rem",
  pill: "999px",
};

const density = {
  comfortable: {
    controlHeight: "3.25rem",
    controlGap: spacing[3],
    tableRow: "3.75rem",
    cardPadding: spacing[4],
  },
  compact: {
    controlHeight: "2.6rem",
    controlGap: spacing[2],
    tableRow: "3rem",
    cardPadding: spacing[3],
  },
};

const motion = {
  duration: {
    quick: "120ms",
    medium: "220ms",
    slow: "360ms",
  },
  easing: {
    standard: "cubic-bezier(0.25, 0.1, 0.25, 1)",
    emphasized: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

const breakpoints = {
  sm: "480px",
  md: "768px",
  lg: "1280px",
};

export const designTokens = {
  seed,
  colors,
  typography,
  spacing,
  radii,
  density,
  motion,
  breakpoints,
} as const;

type CssVariableMap = Record<string, string>;

export const buildCssVariables = (mode: ThemeMode, densityMode: DensityMode): CssVariableMap => {
  const palette = designTokens.colors[mode];
  const densityValues = designTokens.density[densityMode];

  return {
    "--color-background": palette.background,
    "--color-surface": palette.surface,
    "--color-surface-muted": palette.surfaceMuted,
    "--color-outline": palette.outline,
    "--color-overlay": palette.overlay,
    "--color-text-primary": palette.textPrimary,
    "--color-text-secondary": palette.textSecondary,
    "--color-text-on-accent": palette.textOnAccent,
    "--color-primary": palette.primary,
    "--color-primary-strong": palette.primaryStrong,
    "--color-primary-weak": palette.primaryWeak,
    "--color-accent": palette.accent,
    "--color-danger": palette.danger,
    "--color-success": palette.success,
    "--color-warning": palette.warning,
    "--font-family-base": designTokens.typography.fontFamily,
    "--font-family-headings": designTokens.typography.headingsFamily,
    "--font-size-xs": designTokens.typography.sizes.xs,
    "--font-size-sm": designTokens.typography.sizes.sm,
    "--font-size-md": designTokens.typography.sizes.md,
    "--font-size-lg": designTokens.typography.sizes.lg,
    "--font-size-xl": designTokens.typography.sizes.xl,
    "--font-size-2xl": designTokens.typography.sizes["2xl"],
    "--line-height-tight": designTokens.typography.lineHeights.tight.toString(),
    "--line-height-snug": designTokens.typography.lineHeights.snug.toString(),
    "--line-height-relaxed": designTokens.typography.lineHeights.relaxed.toString(),
    "--letter-spacing-normal": designTokens.typography.letterSpacing.normal,
    "--letter-spacing-wide": designTokens.typography.letterSpacing.wide,
    "--spacing-0": spacing.none,
    "--spacing-1": spacing[1],
    "--spacing-2": spacing[2],
    "--spacing-3": spacing[3],
    "--spacing-4": spacing[4],
    "--spacing-6": spacing[6],
    "--spacing-8": spacing[8],
    "--spacing-10": spacing[10],
    "--spacing-12": spacing[12],
    "--radius-sm": radii.sm,
    "--radius-md": radii.md,
    "--radius-lg": radii.lg,
    "--radius-pill": radii.pill,
    "--density-control-height": densityValues.controlHeight,
    "--density-control-gap": densityValues.controlGap,
    "--density-table-row": densityValues.tableRow,
    "--density-card-padding": densityValues.cardPadding,
    "--motion-duration-quick": motion.duration.quick,
    "--motion-duration-medium": motion.duration.medium,
    "--motion-duration-slow": motion.duration.slow,
    "--motion-easing-standard": motion.easing.standard,
    "--motion-easing-emphasized": motion.easing.emphasized,
    "--breakpoint-sm": breakpoints.sm,
    "--breakpoint-md": breakpoints.md,
    "--breakpoint-lg": breakpoints.lg,
  };
};

export const applyDesignTokens = (mode: ThemeMode, densityMode: DensityMode) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const variables = buildCssVariables(mode, densityMode);
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  root.dataset.theme = mode;
  root.dataset.density = densityMode;
};


