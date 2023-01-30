import { defineStyleConfig } from "@chakra-ui/react";

export const Container = defineStyleConfig({
  baseStyle: {
    fontWeight: "medium",
    overflow: "hidden",
    bgColor: "background",
    border: "border",
    centerContent: "true",
    maxW: "80vw",
    p: "0px",
  },

  variants: {
    shadow: {
      borderRadius: "8px",
      shadow: "0px 4px 12px 0px #EEEBEB",
      p: "20px",
      bgColor: "surface",
      maxW: ["92vw", "94vw", "82vw"],
      _dark: {
        shadow: "none",
      },
    },
  },
});
