import { cardAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(cardAnatomy.keys);

const baseStyle = definePartsStyle({
  container: {
    bgColor: "surface",
    border: "1px solid",
    borderColor: "border",
    borderRadius: "8px",
    shadow: "none",
    _hover: {
      borderColor: "controlBorderActive",
      cursor: "pointer",
    },
  },
  header: {
    bgColor: "surfaceHeader",
    borderTopRadius: "8px",
    p: "14px",
  },
  body: {
    px: "14px",
    pt: "6px",
    pb: "14px",
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
