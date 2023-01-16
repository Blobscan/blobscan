import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

import { mode } from "@chakra-ui/theme-tools";

import colors from "./ColorPalete";
import Text from "./ui-components/TextStyle";
import Heading from "./ui-components/HeadingStyles";
import Button from "./ui-components/ButtonStyles";
import textStyles from "./TextStyles";
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
      },
    }),
  },
  colors,
  config,
  textStyles,
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
});

export default theme;
