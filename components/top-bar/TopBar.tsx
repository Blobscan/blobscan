import { HStack, Flex, Button } from "@chakra-ui/react";

import Switcher from "../Switcher";
import { MobileNav } from "./MobileNav";
import { EnableAccount } from "../button/EnableAccount";
export const TopBar = () => {
  return (
    <HStack
      justify={"end"}
      maxW="100vw"
      py="10px"
      px={["16px", "40px"]}
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

//waiting for design to finish ...
export const DesktopNav = () => {
  return <EnableAccount />;
};
