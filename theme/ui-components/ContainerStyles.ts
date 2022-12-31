import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

const baseStyle = {
  fontWeight: "medium",
  p: "0",

  // borders for visualization, delete afterwards
  // border: "2px solid",
  // borderColor: "neutral.400",
  //
  _light: {
    bgColor: "shades.0",
  },
  _dark: {
    bgColor: "body", //example, need figma for dark-mode
  },
};

const sizes = {
  sm: defineStyle({
    maxW: "390px", // the min widths on iphone is 490px ...check with rafael this size
    px: "20px",
    mt: "56px",

    // borders for visualization, delete afterwards
    // border: "2px solid",
    // borderColor: "success.200",
  }),
  md: defineStyle({
    maxW: "1156px",
  }),
  lg: defineStyle({
    maxW: "1181px",
  }),
};

const shadowWithRadiusVariant = defineStyle((props) => {
  return {
    borderRadius: "8px",
    shadow: "0px 4px 12px 0px #EEEBEB",
    p: "20px",
    mt: "110px",
    mb: "120px",
    _dark: {
      // ...
    },
  };
});

const variants = {
  shadow: shadowWithRadiusVariant,
};

export const containerTheme = defineStyleConfig({ baseStyle, sizes, variants });
