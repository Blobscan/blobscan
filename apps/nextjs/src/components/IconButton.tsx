import React from "react";
import {
  IconButton as ChakraIconButton,
  type IconButtonProps,
} from "@chakra-ui/react";

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  ...props
}) => (
  <ChakraIconButton
    variant="ghost"
    padding="2"
    borderRadius="100%"
    color="icon"
    icon={icon}
    onClick={onClick}
    {...props}
  />
);
