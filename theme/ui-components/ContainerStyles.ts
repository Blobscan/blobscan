import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

const baseStyle = {
  fontWeight: "medium",
  // margin: "0",
  _light: {
    //works ok..
  },
  _dark: {
    //works ok ..
  },
};

const sizes = {
  sm: defineStyle({
    minW: "390px", // the min widths on iphone is 490px ...check with rafael this size
    px: "20px",
  }),
  md: defineStyle({
    minW: "864px",
    // p: "6" ... ???
  }),
  lg: defineStyle({
    minW: "1024px",
    // p: "8" ... ?
  }),
};

const shadowRadiusVariant = defineStyle((props) => {
  return {
    borderRadius: "8px",
    border: "2px solid",
    borderColor: "neutral.200",
  };
});

const variants = {
  border: shadowRadiusVariant,
};

export const containerTheme = defineStyleConfig({ baseStyle, sizes, variants });
