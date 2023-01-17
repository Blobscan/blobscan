import {
  HStack,
  Flex,
  useMediaQuery,
  useColorModeValue,
} from "@chakra-ui/react";
import { MdSettings } from "react-icons/md";

import { EnableAccount } from "../Button/EnableAccount";
import { MobileNav } from "./AppLayoutMobileTopBar";
import Switcher from "../Switcher";

export const TopBar = () => {
  const [isDeskTop] = useMediaQuery("(min-width: 490px)", {
    ssr: true,
    fallback: false,
  });
  const bgColor = useColorModeValue("body", "neutral.dark.500");
  const bordeColor = useColorModeValue("neutral.200", "neutral.dark.400");

  return (
    <HStack
      justify={"end"}
      maxW="100vw"
      py="10px"
      px={["16px", "41px"]}
      mb={["60px", "198px"]}
      borderBottom="1px solid"
      borderColor={bordeColor}
      bgColor={bgColor}
    >
      {isDeskTop ? <DesktopNav /> : <MobileNav />}
    </HStack>
  );
};

export const DesktopNav = () => {
  return (
    <Flex alignItems={"center"} justify="center">
      {/* TODO: uncomment this  */}
      {/* <EnableAccount /> */}
      <Switcher />
      {/* TODO: optimize Icon Setting  */}
      {/* <Icon as={MdSettings} fill="neutral.700" ml="24px" w="17px" h="17px" /> */}
    </Flex>
  );
};
