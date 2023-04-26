import { defineStyleConfig, type SystemProps } from "@chakra-ui/react";

export const Button = defineStyleConfig({
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
    _active: {
      transform: "translateY(2px)",
      transition: "transform 0.5s",
      _disabled: {
        transform: "scale(1)",
      },
    },
  },
  variants: {
    primary: {
      bgColor: "accent",
      color: "accentContent",
      _active: {
        ...baseActiveStyles(),
        ...primaryDisabledStyles(),
      },
      _hover: {
        ...baseHoverStyles(),
        ...primaryDisabledStyles(),
      },
      ...primaryDisabledStyles(),
    },
    outline: {
      bgColor: "trasparent",
      border: "1px solid",
      borderColor: "accent",
      color: "accent",
      _active: {
        ...baseActiveStyles(),
        _disabled: {
          color: "accentDisabled",
        },
      },
      _hover: {
        ...baseHoverStyles(),
        color: "accentContent",
        ...outlineDisabledStyles(),
      },
      _disabled: {
        ...outlineDisabledStyles(),
      },
    },
  },
  sizes: { normal: { fontSize: "14px", lineHeight: "20px" } },
  defaultProps: {
    size: "normal",
    variant: "primary",
  },
});

function baseHoverStyles(): SystemProps {
  return {
    bgColor: "accentHighlight",
    borderColor: "accentHighlight",
  };
}

function baseActiveStyles(): SystemProps {
  return {
    bgColor: "accent",
  };
}

function primaryDisabledStyles(): SystemProps {
  return {
    _disabled: {
      bgColor: "accentDisabled",
    },
  };
}

function outlineDisabledStyles(): SystemProps {
  return {
    _disabled: {
      borderColor: "accentDisabled",
      color: "accentDisabled",
    },
  };
}
