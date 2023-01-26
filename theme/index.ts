import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

import { colors } from "./colors";
import { Text } from "./components/text";
import { Heading } from "./components/heading";
import { Button } from "./components/button";
import { Input } from "./components/input";
import { Switch } from "./components/switch";
import { Container } from "./components/container";
import { Card } from "./components/card";
import { Link } from "./components/link";

function token(
  light: string,
  dark?: string
): { default: string; _dark: string } {
  const lightValue = `light.${light}`;
  const darkValue = `dark.${dark}`;

  return {
    default: lightValue,
    _dark: darkValue ?? lightValue,
  };
}

export const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        background: "background",
        lineHeight: "14px",
      },
    },
  },
  semanticTokens: {
    colors: {
      accent: token("primary.300", "primary.200"),
      accentContent: token("neutral.50", "shades.100"),
      accentHighlight: token("primary.200", "primary.300"),
      accentDisabled: token("neutral.500", "neutral.300"),
      background: token("neutral.50", "shades.50"),
      border: token("neutral.200", "neutral.100"),
      content: token("neutral.900", "shades.100"),
      contentSecondary: token("neutral.500", "neutral.500"),
      contentDisabled: token("neutral.400"),
      control: token("shades.00"),
      controlActive: token("primary.500"),
      controlBorderActive: token("primary.200", "primary.300"),
      controlBorderHighlight: token("neutral.300", "neutral.200"),
      hint: token("neutral.300", "neutral.300"),
      icon: token("primary.300", "primary.300"),
      iconHighlight: token("primary.300", "primary.700"),
      link: token("primary.300", "primary.300"),
      surface: token("shades.00", "neutral.50"),
      surfaceContent: token("neutral.900", "shades.100"),
      surfaceContentSecondary: token("neutral.700", "neutral.700"),
      surfaceHeader: token("primary.50", "primary.50"),
    },
  },
  colors,
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
    Link,
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
