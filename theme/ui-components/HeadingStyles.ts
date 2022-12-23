import { defineStyleConfig } from "@chakra-ui/react";

const Heading = defineStyleConfig({
  baseStyle: {
    fontFamily: "heading",
    fontWeight: "medium",
    lineHeight: "none",
    color: "neutral.700",
  },
  variants: {
    primary: {
      color: "primary.200",
    },
  },
  sizes: {
    md: {
      fontSize: "1rem",
    },
  },
});

export default Heading;
