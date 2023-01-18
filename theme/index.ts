import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

import { mode } from "@chakra-ui/theme-tools";

import colors from "./ColorPalete";
import Text from "./ui-components/TextStyle";
import Heading from "./ui-components/HeadingStyles";
import Button from "./ui-components/ButtonStyles";
import { inputTheme } from "./ui-components/InputStyles";
import { switchTheme } from "./ui-components/SwitcherStyles";
import { containerTheme } from "./ui-components/ContainerStyles";
import { cardTheme } from "./ui-components/CardStyles";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};
const theme = extendTheme({
  styles: {
    global: (props) => ({
      body: {
        bg: mode("shades.white", "shades.200")(props),
        lineHeight: "14px",
      },
    }),
  },
  colors,
  config,
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
    sans: "Public Sans",
  },
  components: {
    Heading,
    Text,
    Button,
    Input: inputTheme,
    Switch: switchTheme,
    Container: containerTheme,
    Card: cardTheme,
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
  textStyles: {
    xl: {
      fontSize: "20px",
      fontWeight: "medium",
    },
    lg: {
      fontSize: "16px",
      fontWeight: "medium",
    },
    md: {
      fontSize: "14px",
      fontWeight: "medium",
    },
    sm: {
      fontSize: "12px",
      fontWeight: "medium",
    },
  },
});

export default theme;
