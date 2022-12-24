import { switchAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

import { mode } from "@chakra-ui/theme-tools";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(switchAnatomy.keys);

const baseStyle = (props) =>
  definePartsStyle({
    container: {
      position: "relative",
    },
    thumb: {
      position: "absolute",
      top: "-1",
      left: "-1",
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
      w: "30px",
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
