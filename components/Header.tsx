import { VStack, Text, Box, Flex } from "@chakra-ui/react";

import InputSearch from "./InputSearch";
import { Logo } from "./BlobscanLogo";

export const Header = () => {
  return (
    <VStack as={"header"} w="full" mb="100px">
      <Box mb="22px">
        <Logo size="md" />
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
