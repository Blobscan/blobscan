import { cardAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(cardAnatomy.keys);

const baseStyle = definePartsStyle({
  container: {
    backgroundColor: "none",
    border: "1px solid",
    borderColor: "neutral.200",
    borderRadius: "8px",
    p: "0px",
    shadow: "none",
    _hover: {
      borderColor: "primary.200",
      cursor: "pointer",
    },
    _dark: {
      borderColor: "neutral.dark.200",
      _hover: {
        borderColor: "primary.dark.300",
      },
    },
  },
  header: {
    bgColor: "primary.50",
    borderTopRadius: "8px",
    p: "14px",
    _dark: {
      bgColor: "primary.dark.400",
      _active: {
        bgColor: "primary.dark.300",
      },
    },
  },
  body: {
    p: "14px",
  },
});

const variants = {
  expanded: definePartsStyle({
    container: {
      flexDirection: "row",
    },
    header: {
      borderBottomLeftRadius: "8px",
      borderTopRightRadius: "none",
      flexBasis: "15%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
    },
    body: {
      p: "20px",
    },
  }),
};

const defaultProps = {
  size: "",
};

export const Card = defineMultiStyleConfig({
  baseStyle,
  variants,
  defaultProps,
});
