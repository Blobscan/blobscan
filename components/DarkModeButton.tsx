import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { useColorMode } from "@chakra-ui/react";
import React from "react";

import { IconButton } from "./IconButton";

export const DarkModeButton: React.FC = () => {
  const { toggleColorMode, colorMode } = useColorMode();

  return (
    <IconButton
      icon={
        colorMode === "light" ? (
          <MoonIcon color="icon" />
        ) : (
          <SunIcon boxSize={4} />
        )
      }
      onClick={toggleColorMode}
      aria-label="Color mode switcher"
    />
  );
};
