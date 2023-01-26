import { Flex } from "@chakra-ui/react";

import { InputSearch } from "../InputSearch";
import { Logo } from "../BlobscanLogo";
import { DarkModeButton } from "../DarkModeButton";

type DesktopNavProps = {
  isHomePage: boolean;
};

export const DesktopNav: React.FC<DesktopNavProps> = ({ isHomePage }) => {
  return (
    <>
      <Flex
        alignItems={"center"}
        justify={!isHomePage ? "space-between" : "end"}
        w="100%"
      >
        {!isHomePage && (
          <>
            <Logo size="sm" />
            <InputSearch />
          </>
        )}

        <DarkModeButton />
      </Flex>
    </>
  );
};
