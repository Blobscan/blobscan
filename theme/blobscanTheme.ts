import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

import colors from "./ColorPalete";
import textStyles from "./TextStyles";
import Heading from "./ui-components/HeadingStyles";
import Text from "./ui-components/Textstyle";
import { inputTheme } from "./ui-components/InputSyle";

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
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
});

export default theme;
