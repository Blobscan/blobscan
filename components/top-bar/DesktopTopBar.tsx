import { Flex, Icon } from "@chakra-ui/react";

import { MdSettings } from "react-icons/md";

import { EnableAccount } from "../button/EnableAccount";

import Icons from "../../assests/Icon.svg";

export const DesktopTopBar = () => {
  return (
    <Flex alignItems={"center"} justify="center">
      <EnableAccount />
      <Icon as={MdSettings} fill="neutral.700" ml="24px" w="17px" h="17px" />
    </Flex>
  );
};
