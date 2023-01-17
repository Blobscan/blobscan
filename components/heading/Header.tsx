import { VStack, Text, Box, Flex, useColorMode } from "@chakra-ui/react";
import Image from "next/image";

import InputSearch from "../Input-search";

import Logo from "../../assests/logo-light.svg";
import LogoDark from "../../assests/logo-dark.svg";

export const Header = () => {
  const { colorMode } = useColorMode();
  return (
    <VStack as={"header"} w="full" mb="100px">
      <Box mb="22px">
        {/* TODO: check logo width and height */}
        {colorMode === "light" ? (
          <Image src={Logo} alt="blobscan-logo-light" />
        ) : (
          <Image src={LogoDark} alt="blobscan-logo-dark" />
        )}
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
