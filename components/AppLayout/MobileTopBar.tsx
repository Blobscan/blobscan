import { Flex } from "@chakra-ui/react";

import { DarkModeButton } from "../DarkModeButton";

export const MobileNav = () => {
  return (
    <Flex w={"100%"} justifyContent={"end"}>
      <DarkModeButton />
    </Flex>
  );
};
