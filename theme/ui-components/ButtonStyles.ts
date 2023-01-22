import { defineStyleConfig, defineStyle } from "@chakra-ui/react";

const normal = defineStyle({
  fontSize: "14px",
  lineHeight: "20px",
});

const Button = defineStyleConfig({
  baseStyle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: "6px",
    py: "10px",
    px: "16px",
    fontWeight: "medium",
    color: "white",
    animationTimingFunction: "ease-in-out",
    animationDuration: "400ms",
  },
  variants: {
    primary: {
      bgColor: "primary.300",
      _active: {
        color: "primary.200",
      },
      _hover: {
        bgColor: "primary.200",
      },
      _disabled: {
        color: "neutral.400",
        bgColor: "neutral.500",
      },

      _dark: {
        bgColor: "primary.dark.300",
        color: "shades.100",
        _active: {
          color: "primary.dark.300",
        },
        _hover: {
          bgColor: "primary.dark.200",
        },
        _disabled: {
          bgColor: "neutral.dark.400",
          color: "neutral.dark.300",
        },
      },
    },
    outline: {
      color: "primary.300",
      bgColor: "transparent",
      border: "1px solid",
      borderColor: "primary.300",
      _active: {
        color: "primary.200",
        bgColor: "transparent",
      },
      _hover: {
        bgColor: "transparent",
        color: "primary.200",
        borderColor: "primary.200",
      },
      _disabled: {
        borderColor: "neutral.400",

        color: "neutral.400",
        bgColor: "transparent",
      },
      _dark: {
        bgColor: "shades.200",
        color: "primary.dark.300",
        borderColor: "primary.dark.300",
        _active: {
          bgColor: "shades.200",
          color: "primary.dark.200",
        },
        _hover: {
          bgColor: "primary.dark.200",
          color: "shades.100",
        },
        _disabled: {
          bgcolor: "shades.dark.200",
          color: "neutral.dark.300",
        },
      },
    },
    switch: {
      justifyContent: "space-between",
      borderRadius: "50px",
      bgColor: "shades.white",
      color: "neutral.700",
      _hover: { bgColor: "primary.100" },
      _active: { bgColor: "primary.50" },

      _dark: {
        bgColor: "neutral.dark.200",
        _hover: {
          bgColor: "primary.dark.300",
        },
        _active: {
          bgColor: "primary.dark.400",
        },
      },
    },
  },
  sizes: { normal },
  defaultProps: {
    size: "normal",
    variant: "primary",
  },
});

export default Button;
