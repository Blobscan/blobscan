import { cardAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(cardAnatomy.keys);

const baseStyle = definePartsStyle({
  // define the part you're going to style
  container: {
    backgroundColor: "#e7e7e7",
    border: "3px solid",
    borderColor: "red",
  },
  header: {
    paddingBottom: "2px",
  },
  body: {
    paddingTop: "2px",
  },
  footer: {
    paddingTop: "2px",
  },
});

const sizes = definePartsStyle({
  xl: {
    container: {
      width: "100%",
    },
  },
});

const defaultProps = {
  size: "xl",
};

export const cardTheme = defineMultiStyleConfig({
  baseStyle,
  sizes,
  defaultProps,
});
