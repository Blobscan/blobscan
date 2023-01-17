import { inputAnatomy } from "@chakra-ui/anatomy";

import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

import { mode } from "@chakra-ui/theme-tools";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(inputAnatomy.keys);

const filled = (props: unknown) =>
  definePartsStyle({
    field: {
      fontSize: "0.875rem",
      color: "neutral.200",
      borderLeftRadius: "6px",
      borderRightRadius: "none",
      border: "1px solid",
      fontWeight: "regular",
      borderColor: mode("neutral.200", "neutral.dark.400")(props),
      bgColor: "shades.0",
      h: "40px",
      p: "10px",
      pl: "1rem",
      _placeholder: {
        color: mode("neutral.300", "neutral.dark.300")(props),
      },
      _focus: {
        fontFamily: "sans-serif",
        color: mode("neutral.900", "shades.100")(props),
        borderColor: "primary.200",
        bgColor: mode("primary.50", "neutral.dark.400")(props),
        _placeholder: {
          color: "neutral.700",
        },
      },
      _hover: {
        bgColor: mode("primary.50", "neutral.dark.400")(props),
      },
      _disabled: {
        color: "neutral.200",
        borderColor: "neutral.300",
        bgColor: "neutral.200",
        opacity: "0.9",
      },
    },

    addon: {
      w: "52px",
      h: "40px",
      borderLeftRadius: "none",
      borderRightRadius: "6px",
      cursor: "pointer",
      bgColor: mode("primary.300", "primary.dark.300")(props),
      color: "neutral.50",
      _hover: {
        bgColor: mode("primary.200", "primary.dark.200")(props),
      },
    },
  });

export const inputTheme = defineMultiStyleConfig({
  variants: { filled },
  defaultProps: {
    variant: "filled",
  },
});
