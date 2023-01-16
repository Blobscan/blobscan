import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

const baseStyle = {
  fontWeight: "medium",
  p: "0",
  _light: {
    bgColor: "shades.0",
  },
  _dark: {
    bgColor: "body", //example, need figma for dark-mode
  },
};

const sizes = {
  sm: defineStyle({
    maxW: "390px", // TODO:the min widths on iphone is 490px ...check with rafael this size
    px: "20px",
    mt: "56px",
  }),
  md: defineStyle({
    maxW: "1156px",
  }),
  lg: defineStyle({
    maxW: "1181px",
  }),
};

const shadowWithRadius = defineStyle((props) => {
  return {
    borderRadius: "8px",
    shadow: "0px 4px 12px 0px #EEEBEB",
    p: "20px",
    mt: "50px",
    _dark: {},
  };
});

const variants = {
  shadow: shadowWithRadius,
};

export const containerTheme = defineStyleConfig({ baseStyle, sizes, variants });
