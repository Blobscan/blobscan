import { VStack, Text, Box, Flex } from "@chakra-ui/react";
import Image from "next/image";

import InputSearch from "../Input-search";

import Logo from "../../assests/logo-light.svg";

export const Header = () => {
  return (
    <VStack as={"header"} w="full" mb="100px">
      <Box mb="22px">
        <Image src={Logo} alt="blobscan-logo" />
      </Box>
      <InputSearch />
      <Flex>
        <Text textStyle={"md"} mt="4px">
          Blob transaction explorer for{" "}
        </Text>
        <Text mt="4px" pl="4px" textStyle={"md"} variant="primary">
          EIP-4844
        </Text>
      </Flex>
    </VStack>
  );
};
