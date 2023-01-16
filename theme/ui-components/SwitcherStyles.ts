import { switchAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

import { mode } from "@chakra-ui/theme-tools";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(switchAnatomy.keys);

const baseStyle = (props: unknown) =>
  definePartsStyle({
    container: {
      position: "relative",
      p: "0px",
    },
    thumb: {
      position: "absolute",
      top: "-0.5",
      left: "0.25",
      w: "18px",
      h: "18px",
      bgColor: "shades.0o0",
      border: "1px solid",
      borderColor: "primary.200",
      _checked: {
        bgColor: "primary.200",
      },
    },
    track: {
      border: "none",
      bgColor: mode("neutral.300", "")(props),
      w: "27px",
      h: "10px",
      _checked: {
        bgColor: mode("", "primary.100")(props),
      },
    },
  });

export const switchTheme = defineMultiStyleConfig({
  baseStyle,
  defaultProps: {
    size: "lg",
  },
});
