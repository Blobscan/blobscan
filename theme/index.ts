import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

import { mode } from "@chakra-ui/theme-tools";

import { colors } from "./color-palette";
import { Text } from "./components/text";
import { Heading } from "./components/heading";
import { Button } from "./components/button";
import { Input } from "./components/input";
import { Switch } from "./components/switch";
import { Container } from "./components/container";
import { Card } from "./components/card";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

export const theme = extendTheme({
  styles: {
    global: (props: any) => ({
      body: {
        bg: mode("neutral.50", "shades.200")(props),
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
    Input,
    Switch,
    Container,
    Card,
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
      fontSize: "18px",
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
