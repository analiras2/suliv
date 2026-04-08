export const tokens = {
  colors: {
    primary: "#80BC60",
    background: "#F2F2F2",
    textPrimary: "#393F42",
    error: "#D94F4F",
    surface: "#FFFFFF",
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    "2xl": 32,
    "3xl": 48,
  },

  typography: {
    fontSizes: {
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
    },
    fontWeights: {
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 20,
  },
} as const;

export type Tokens = typeof tokens;
