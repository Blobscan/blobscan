export const baseColors = {
  blues: {
    100: "#C9E5FF",
    200: "#5D88F4",
  },
  shades: {
    "00": "#000000",
    50: "#1A1B29",
    100: "#FFFFFF",
  },
  neutral: {
    100: "#FAFAFA",
    200: "#F5F5F5",
    300: "#E5E5E5",
    400: "#D4D4D4",
    500: "#A3A3A3",
    600: "#737373",
    700: "#404040",
    750: "#ADAFD0",
    800: "#36385B",
    850: "#24243B",
    900: "#1F1F32",
    950: "#171717",
    1000: "#0D0D0D",
  },
  primary: {
    100: "#F7F5FD",
    200: "#EADFFD",
    300: "#D9C6F9",
    400: "#AE8CF5",
    500: "#896EE1",
    600: "#5D25D4",
    700: "#47348A",
    800: "#3A3369",
    900: "#2E2854",
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

const primary = baseColors.primary;
const neutral = baseColors.neutral;
const shades = baseColors.shades;

export const semanticColors = {
  accent: {
    light: primary[600],
    dark: primary[500],
  },
  accentContent: {
    light: neutral[100],
    dark: shades[100],
  },
  accentHighlight: {
    light: primary[500],
    dark: primary[400],
  },
  accentDisabled: {
    light: neutral[500],
    dark: neutral[800],
  },
  background: {
    light: neutral[100],
    dark: shades[50],
  },
  border: {
    light: neutral[300],
    dark: neutral[850],
  },
  content: {
    light: neutral[700],
    dark: shades[100],
  },
  contentSecondary: {
    light: neutral[500],
    dark: neutral[750],
  },
  contentDisabled: {
    light: neutral[400],
    dark: neutral[800],
  },
  control: {
    light: shades["00"],
    dark: shades["00"],
  },
  controlActive: {
    light: primary[300],
    dark: primary[500],
  },
  controlBorderActive: {
    light: primary[200],
    dark: primary[300],
  },
  controlBorderHighlight: {
    light: neutral[300],
    dark: neutral[800],
  },
  hint: {
    light: neutral[300],
    dark: neutral[800],
  },
  icon: {
    light: primary[300],
    dark: primary[300],
  },
  iconHighlight: {
    light: primary[300],
    dark: primary[500],
  },
  link: {
    light: primary[400],
    dark: primary[400],
  },
  surface: {
    light: shades["00"],
    dark: neutral[900],
  },
  surfaceContent: {
    light: neutral[950],
    dark: shades[100],
  },
  surfaceContentSecondary: {
    light: neutral[700],
    dark: neutral[1000],
  },
  surfaceHeader: {
    light: primary[100],
    dark: primary[900],
  },
};
