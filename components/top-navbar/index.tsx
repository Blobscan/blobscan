import { HStack, Flex, Text, useMediaQuery, Box } from "@chakra-ui/react";

import Switcher from "../dark-mode-switcher/Switcher";

export const DesktopNav = () => {
  return <Switcher />;
};

export const MobileNav = () => {
  return <Text>Mobile</Text>;
};

export const TopNav = () => {
  //   const [isDesktopMode] = useMediaQuery("(min-width: 491px)");

  return (
    <HStack
      border="1px solid black"
      justify={"end"}
      maxW="100vw"
      pt={["2px", "19px"]}
      px={["2px", "40px"]}
      mb={["", "171px"]}
    >
      <Flex display={["none", "block"]}>
        <DesktopNav />
      </Flex>
      <Flex display={["block", "none"]}>
        <MobileNav />
      </Flex>
    </HStack>

    // <Flex mt={["0", "19px"]} px="40px" justify="end">

    /* <Flex border={"2px solid black"}>
        <DesktopNav />
      </Flex> */

    // </Flex>
  );
};
