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
      borderColor: "neutral.200",
      bgColor: "shades.0",
      h: "40px",
      p: "10px",
      pl: "1rem",
      _placeholder: {
        fontWeight: "regular",
        color: "neutral.300",
        textStyle: "",
      },
      //to do : _dark mode
      _focus: {
        fontFamily: "sans-serif",
        color: "neutral.700",
        borderColor: "primary.200",
        bgColor: "primary.50",
        _placeholder: {
          color: "neutral.700",
        },
      },
      _hover: {
        bgColor: "primary.50",
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
      bgColor: "primary.300",
      color: "neutral.50",
    },
  });

export const inputTheme = defineMultiStyleConfig({
  variants: { filled },
  defaultProps: {
    variant: "filled",
  },
});
