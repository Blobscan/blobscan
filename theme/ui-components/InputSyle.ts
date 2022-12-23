import { inputAnatomy } from "@chakra-ui/anatomy";

import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(inputAnatomy.keys);

const stateFilled = definePartsStyle({
  field: {
    color: "neutral.200",
    borderRightRadius: "6px",
    borderColor: "neutral.200",
    bgColor: "shades.0o0",
    padding: "4px, 4px, 4px, 16px",
  },
  //provide dark mode
  //_dark
  _focus: {
    color: "primary.200",
    border: "1px solid",
    borderColor: "primary.200",
    bgColor: "primary.50",
  },
  _hover: {
    bgColor: "primary.50",
  },
  _disabled: {
    opacity: "0.8",
    bgColor: "secondary.800",
  },
});

const stateSearch = {
  field: {
    ...stateFilled,
    border: "1px solid",
    borderColor: "primary.200",
    bgColor: "primary.50",
  },
};

const inputTheme = defineMultiStyleConfig({
  variants: {
    filled: definePartsStyle(stateFilled),
    search: definePartsStyle(stateSearch),
  },
  defaultProps: {
    variant: "filled",
  },
});

export default inputTheme;
