import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

import colors from "./ColorPalete";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

//Extend the theme to include custom colors, fonts, etc..
const theme = extendTheme({
  colors,
  config,
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
  components: {},
  textStyles: {
    h1: {
      fontSize: ["36px", "40px"], //mobile, desktop and up
      fontWeight: "medium",
      lineHeight: ["44px", "48px"], //mobile, desktop and up
    },
    h2: {
      fontSize: ["32px", "36px"],
      fontWeight: "medium",
      lineHeight: ["40px", "44px"],
    },
    h3: {
      fontSize: ["28px", "32px"],
      fontWeight: "medium",
      lineHeight: ["36px", "40px"],
    },
    paragraph: {
      lg: {
        fontSize: "18px",
        lineHeight: "28px",
        color: "neutral.900",
      },
      md: {
        fontSize: "16px",
        lineHeight: "24px",
        color: "neutral.900",
      },
      sm: {
        fontSize: "14px",
        lineHeight: "20px",
        color: "neutral.900",
      },
    },
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
});

export default theme;
