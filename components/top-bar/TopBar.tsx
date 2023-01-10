import { HStack, Flex } from "@chakra-ui/react";

import { MobileNav } from "./MobileTopBar";
import { DesktopTopBar } from "./DesktopTopBar";
export const TopBar = () => {
  return (
    <HStack
      justify={"end"}
      maxW="100vw"
      py="10px"
      px={["16px", "40px"]}
      mb={["60px", "198px"]}
      borderBottom="1px solid"
      borderColor={"neutral.200"}
    >
      <Flex display={["none", "block"]}>
        <DesktopTopBar />
      </Flex>
      <Flex display={["block", "none"]}>
        <MobileNav />
      </Flex>
    </HStack>
  );
};

//waiting for design to finish ...
