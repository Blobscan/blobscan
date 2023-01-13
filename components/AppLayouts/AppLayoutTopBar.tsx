import { HStack, Flex, Icon, Text, useMediaQuery } from "@chakra-ui/react";
import { MdSettings } from "react-icons/md";

import { EnableAccount } from "../Button/EnableAccount";
import { MobileNav } from "./AppLayoutMobileTopBar";

export const TopBar = () => {
  const [isDeskTop] = useMediaQuery("(min-width: 490px)", {
    ssr: true,
    fallback: false,
  });
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
      {isDeskTop ? <DesktopNav /> : <MobileNav />}
    </HStack>
  );
};

export const DesktopNav = () => {
  return (
    <Flex alignItems={"center"} justify="center">
      <EnableAccount />
      <Icon as={MdSettings} fill="neutral.700" ml="24px" w="17px" h="17px" />
    </Flex>
  );
};
