import React from "react";
import { Flex, Heading } from "@chakra-ui/react";

import InputSearch from "../Input-search";

import Switcher from "../Switcher";

//no tenemos la version mobile ...
export const PageTopBar = () => {
  return (
    <>
      <Flex
        maxW="100vw"
        borderBottom="1px solid"
        borderColor={"neutral.200"}
        py="10px"
        px="20px"
        // mb={["20px", "40px"]}
        alignItems={"center"}
        justifyContent="space-between"
        bgColor="white"
      >
        <Heading>LOGO</Heading>
        <InputSearch />
        <Switcher />
      </Flex>
    </>
  );
};
