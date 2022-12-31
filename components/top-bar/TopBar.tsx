import { HStack, Flex } from "@chakra-ui/react";

import Switcher from "../Switcher";
import { MobileNav } from "./MobileNav";
export const TopBar = () => {
  return (
    <HStack
      justify={"end"}
      maxW="100vw"
      py="10px"
      px={["10px", "20px"]}
      mb={["60px", "171px"]}
      borderBottom="1px solid"
      borderColor={"neutral.200"}
    >
      <Flex display={["none", "block"]}>
        <DesktopNav />
      </Flex>
      <Flex display={["block", "none"]}>
        <MobileNav />
      </Flex>
    </HStack>
  );
};

export const DesktopNav = () => {
  return <Switcher />;
};
