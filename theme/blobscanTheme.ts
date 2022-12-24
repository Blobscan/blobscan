import { extendTheme, type ThemeConfig, Text } from "@chakra-ui/react";

import colors from "./ColorPalete";
import textStyles from "./TextStyles";
import Heading from "./ui-components/HeadingStyles";

import { inputTheme } from "./ui-components/InputStyles";
import { switchTheme } from "./ui-components/SwitchStyles";
import { containerTheme } from "./ui-components/ContainerStyles";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

//Extend the theme to include custom colors, fonts, etc..
const theme = extendTheme({
  colors,
  config,
  textStyles,
  fonts: {
    heading: "Inter, sans-serif",
    body: "Inter, sans-serif",
  },
  components: {
    Heading,
    Text,
    Input: inputTheme,
    Switch: switchTheme,
    Container: containerTheme,
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
});

export default theme;
