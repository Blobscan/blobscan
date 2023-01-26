import { defineStyleConfig } from "@chakra-ui/react";

export const Container = defineStyleConfig({
  baseStyle: {
    fontWeight: "medium",
    overflow: "hidden",
    bgColor: "surface",
    border: "border",
  },
  sizes: {
    sm: {
      maxW: "390px",
      px: "20px",
      mt: "56px",
    },
    md: {
      maxW: "768",
    },
    lg: {
      minW: "1181px",
    },
  },
  variants: {
    shadow: {
      borderRadius: "8px",
      shadow: "0px 4px 12px 0px surfaceShadow",
      p: "20px",
      mt: "-158px",
      bgColor: "surface",
    },
  },
});
