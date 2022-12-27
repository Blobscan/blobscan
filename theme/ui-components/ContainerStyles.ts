import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

const baseStyle = {
  fontWeight: "medium",
  p: "0",

  //borders for visualization, delete afterwards
  border: "2px solid",
  borderColor: "neutral.200",
  //

  mt: "230px", //14.375rem",
  _light: {
    bgColor: "shades.0",
  },
  _dark: {
    bgColor: "body", //example, need figma for dark-mode
  },
};

const sizes = {
  sm: defineStyle({
    minW: "390", // the min widths on iphone is 490px ...check with rafael this size
    px: "20px",
  }),
  md: defineStyle({
    minW: "864px",
  }),
  lg: defineStyle({
    minW: "1165px",
  }),
};

const shadowWithRadiusVariant = defineStyle((props) => {
  return {
    borderRadius: "8px",
    shadow: "0px 4px 12px 0px #EEEBEB",
    p: "20px",
    mt: "110px",
    _dark: {
      // ...
    },
  };
});

const variants = {
  shadow: shadowWithRadiusVariant,
};

export const containerTheme = defineStyleConfig({ baseStyle, sizes, variants });
