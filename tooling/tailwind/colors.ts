export const baseColors = {
  blues: {
    100: "#C9E5FF",
    200: "#5D88F4",
  },
  coolGray: {
    50: "#1F1F32",
    100: "#24243B",
    200: "#36385B",
    300: "#434672",
    400: "#7D80AB",
    500: "#ADAFD0",
    600: "#C5C9D3",
    700: "#BFC1DE",
  },

  warmGray: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#E5E5E5",
    300: "#D4D4D4",
    400: "#A3A3A3",
    500: "#737373",
    600: "#404040",
    700: "#171717",
  },

  primary: {
    50: "#F7F1FF",
    100: "#F7F5FD",
    200: "#EADEFD",
    300: "#E2CFFF",
    400: "#AE8CF5",
    500: "#9A71F2",
    600: "#896EE1",
    700: "#5D25D4",
    800: "#3A3369",
    900: "#2E2854",
    1000: "#372779",
  },

  shades: {
    "00": "#FFFFFF",
    50: "#1A1B29",
    100: "#000000",
  },

  success: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBF7D0",
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E",
    600: "#16A34A",
    700: "#15803D",
    800: "#166534",
    900: "#14532D",
  },

  warning: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },

  error: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#F43737",
    600: "#DC2626",
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D",
  },
};

const { coolGray, primary, shades, success, error, warmGray } = baseColors;

export const semanticColors = {
  accent: {
    light: primary[700],
    dark: primary[500],
  },
  accentContent: {
    light: shades["00"],
    dark: warmGray[50],
  },
  accentHighlight: {
    light: primary[600],
    dark: primary[400],
  },
  accentDisabled: {
    light: warmGray[500],
    dark: coolGray[300],
  },
  background: {
    light: warmGray[100],
    dark: shades[50],
  },
  border: {
    light: warmGray[200],
    dark: coolGray[300],
  },
  content: {
    light: warmGray[700],
    dark: warmGray[50],
  },
  contentSecondary: {
    light: warmGray[600],
    dark: coolGray[700],
  },
  contentTertiary: {
    light: warmGray[400],
    dark: coolGray[400],
  },
  contentDisabled: {
    light: warmGray[400],
    dark: coolGray[400],
  },
  control: {
    light: shades["00"],
    dark: shades["00"],
  },
  controlBackground: {
    light: shades["00"],
    dark: coolGray[200],
  },
  controlActive: {
    light: primary[100],
    dark: primary[500],
  },
  controlBorder: {
    light: warmGray[200],
    dark: primary[300],
  },
  controlBorderActive: {
    light: primary[700],
    dark: primary[400],
  },
  controlBorderHighlight: {
    light: primary[400],
    dark: primary[400],
  },
  hint: {
    light: warmGray[400],
    dark: coolGray[400],
  },
  icon: {
    light: warmGray[700],
    dark: coolGray[400],
  },
  iconHighlight: {
    light: primary[700],
    dark: primary[400],
  },
  link: {
    light: primary[700],
    dark: primary[400],
  },
  negative: {
    light: error[500],
    dark: error[400],
  },
  positive: {
    light: success[500],
    dark: success[400],
  },
  surface: {
    light: shades["00"],
    dark: coolGray[50],
  },
  surfaceBorder: {
    light: warmGray[200],
    dark: coolGray[300],
  },
  surfaceContent: {
    light: warmGray[700],
    dark: warmGray[200],
  },
  surfaceContentSecondary: {
    light: warmGray[600],
    dark: coolGray[700],
  },
  surfaceHeader: {
    light: primary[100],
    dark: coolGray[200],
  },
  skeleton: {
    light: "#e2e8f0",
    dark: "#334454",
  },
};
