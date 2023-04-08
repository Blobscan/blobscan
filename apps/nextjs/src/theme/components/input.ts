import { inputAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

import { chakraFocusRingDisabledStyles } from "../helpers";

const helpers = createMultiStyleConfigHelpers(inputAnatomy.keys);

export const Input = helpers.defineMultiStyleConfig({
  variants: {
    outline: helpers.definePartsStyle({
      field: {
        ...chakraFocusRingDisabledStyles(),
        fontSize: "0.875rem",
        color: "content",
        borderLeftRadius: "6px",
        borderRightRadius: "none",
        border: "1px solid",
        fontWeight: "regular",
        borderColor: "border",
        background: "background",
        h: "40px",
        p: "10px",
        pl: "1rem",
        _placeholder: {
          color: "hint",
        },
        _focus: {
          borderColor: "controlBorderActive",
          background: "controlActive",
          _hover: {
            borderColor: "controlBorderActive",
            background: "controlActive",
          },
        },
        _hover: {
          borderColor: "controlBorderHighlight",
          // bgColor: color(colorMode, "background"),
        },
        _disabled: {
          color: "neutral.200",
          borderColor: "neutral.300",
          bgColor: "neutral.200",
          opacity: "0.9",
        },
      },

      addon: {
        w: "52px",
        h: "40px",
        borderLeftRadius: "none",
        borderRightRadius: "6px",
        cursor: "pointer",
        bgColor: "accent",
        color: "accentContent",
        // transition: "background-color 1000s"
        _hover: {
          bgColor: "accentHighlight",
        },
        _active: {
          bgColor: "accent",
        },
      },
    }),
  },

  defaultProps: {
    variant: "outline",
  },
});
