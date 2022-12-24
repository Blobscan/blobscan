import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

const baseStyle = {
  fontWeight: "medium",
  p: "0",
  _light: {
    bgColor: "shades.0o0",
  },
  _dark: {
    bgColor: "success.200", //example, need figma for dark-mode
  },
};

const sizes = {
  sm: defineStyle({
    minW: "390px", // the min widths on iphone is 490px ...check with rafael this size
    px: "20px",
  }),
  md: defineStyle({
    minW: "864px",
  }),
  lg: defineStyle({
    minW: "1024px",
  }),
};

const shadowWithRadiusVariant = defineStyle((props) => {
  return {
    borderRadius: "8px",
    shadow: "0px 4px 12px 0px #EEEBEB",
    p: "20px",
    _dark: {
      // ...
    },
  };
});

const variants = {
  shadows: shadowWithRadiusVariant,
};

export const containerTheme = defineStyleConfig({ baseStyle, sizes, variants });
