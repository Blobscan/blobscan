import { defineStyleConfig } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";

const Text = defineStyleConfig({
  baseStyle: (props) => ({
    fontFamily: "body",
    lineHeight: "none",
    color: mode("neutral.700", "neutral.dark.100")(props),
  }),

  variants: {
    primary: {
      color: "success.200",
      _dark: {
        color: "primary.dark.200",
      },
    },
  },
});

export default Text;
