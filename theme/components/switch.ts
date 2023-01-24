import { switchAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

import { mode } from "@chakra-ui/theme-tools";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(switchAnatomy.keys);

const baseStyle = () =>
  definePartsStyle({
    container: {
      position: "relative",
    },
    thumb: {
      position: "absolute",
      top: "-0.5",
      left: "-0.5",
      w: "18px",
      h: "18px",
      bgColor: "shades.white",
      border: "1px solid",
      borderColor: "primary.200",
      _checked: {
        left: "1.5",
      },
      _dark: {
        bgColor: "primary.dark.100",
        borderColor: "white",
      },
    },
    track: {
      border: "none",
      bgColor: mode("neutral.500", ""),
      w: "30px",
      h: "10px",
      _checked: {
        bgColor: mode("", "primary.100"),
      },
      _dark: {
        bgColor: "primary.dark.200",
      },
    },
  });

export const Switch = defineMultiStyleConfig({
  baseStyle,
  defaultProps: {
    size: "lg",
  },
});
