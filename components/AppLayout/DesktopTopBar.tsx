import { Flex, useColorMode, IconButton } from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";

import InputSearch from "../InputSearch";
import { Logo } from "../BlobscanLogo";

type DesktopNavProps = {
  displayLogo: boolean;
};

export const DesktopNav: React.FC<DesktopNavProps> = ({ displayLogo }) => {
  const { toggleColorMode, colorMode } = useColorMode();

  return (
    <>
      <Flex
        alignItems={"center"}
        justify={displayLogo ? "space-between" : "end"}
        w="100%"
      >
        {displayLogo && (
          <>
            <Logo size="sm" />
            <InputSearch />
          </>
        )}

        <IconButton
          variant="ghost"
          padding="2"
          borderRadius="100%"
          icon={colorMode === "light" ? <MoonIcon /> : <SunIcon boxSize={4} />}
          aria-label="Color mode switcher"
          onClick={toggleColorMode}
        />
      </Flex>
    </>
  );
};
