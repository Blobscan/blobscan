import Image from "next/image";
import { Center, Flex, Heading } from "@chakra-ui/react";

const Empty = () => {
  return (
    <>
      <Center>
        <Flex direction="column" flexWrap="wrap">
          <Heading as="h3" textAlign="center" fontSize="7xl" marginBottom={75}>
            No results
          </Heading>
          <Image width={350} height={350} src="/logo.png" alt="" />
        </Flex>
      </Center>
    </>
  );
};

export default Empty;
