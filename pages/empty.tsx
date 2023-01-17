import { Center, Flex, Heading } from "@chakra-ui/react";
import Image from "next/image";
import LinkLayout from "../components/linkLayout";
import emptyImg from "../public/logo.png";

const Empty = () => {
  return (
    <LinkLayout>
      <Center>
        <Flex direction="column" flexWrap="wrap">
          <Heading
            as="h3"
            textAlign="center"
            fontSize="7xl"
            color="#502eb4"
            marginBottom={75}
          >
            No results
          </Heading>
          <Image width={350} height={350} src={emptyImg} alt="" />
        </Flex>
      </Center>
    </LinkLayout>
  );
};

export default Empty;
