import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

import Heading from "./ui-components/HeadingStyles";
import Text from "./ui-components/Textstyle";
import Input
import colors from "./ColorPalete";
import textStyles from "./TextStyles";

const config: ThemeConfig = {
  initialColorMode: "dark",
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
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
});

export default theme;
