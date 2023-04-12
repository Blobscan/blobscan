import { defineStyleConfig } from "@chakra-ui/react";

export const Text = defineStyleConfig({
  baseStyle: {
    fontFamily: "body",
    lineHeight: "none",
    color: "content",
    mt: "0px",
  },

  variants: {
    secondary: {
      fontWeight: "regular",
      color: "contentSecondary",
    },
  },
});
