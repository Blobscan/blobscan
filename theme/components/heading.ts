import { defineStyleConfig } from "@chakra-ui/react";

export const Heading = defineStyleConfig({
  baseStyle: {
    fontFamily: "heading",
    fontWeight: "medium",
    lineHeight: "none",
    color: "contentSecondary",
  },
  variants: {
    primary: {
      color: "contentSecondary",
    },
  },
  sizes: {
    md: {
      fontSize: "1rem",
    },
  },
});
