import { switchAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(switchAnatomy.keys);

const baseStyle = definePartsStyle({
  container: {
    position: "relative",
  },
  thumb: {
    position: "absolute",
    top: "-1",
    left: "-1",
    color: "success.500",
    bgColor: "shades.0o0",
    border: "1px solid",
    borderColor: "primary.200",
    _checked: {
      bgColor: "primary.200",
    },
  },
  track: {
    border: "none",
    bgColor: "neutral.300",
    w: "30px",
    h: "10px",
    _checked: {
      bgColor: "primary.100",
    },
  },
});

export const switchTheme = defineMultiStyleConfig({
  baseStyle,
  defaultProps: {
    size: "lg",
  },
});
