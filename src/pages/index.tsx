import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Link, Stack, Text, VStack, Spinner } from "@chakra-ui/react";
import type { NextPage } from "next";

import { BlockCard } from "~/components/BlockCard";
import { Logo } from "~/components/BlobscanLogo";
import { InputSearch } from "~/components/InputSearch";

import { api } from "~/utils/api";

const Home: NextPage = () => {
  const { data: blocks } = api.block.getAll.useQuery({ take: 4 });

  if (!blocks) {
    return <Spinner />;
  }

  return (
    <VStack maxW="90vw" h="700px" spacing="150">
      <VStack spacing={12} bgColor="background" as={"header"} w="100%">
        <Logo size="md" />
        <VStack w="100%">
          <InputSearch />
          <Text textStyle={"md"}>
            Blob transaction explorer for{" "}
            <Link
              mt="4px"
              pl="4px"
              textStyle={"md"}
              href="https://www.eip4844.com/"
              isExternal
            >
              EIP-4844 <ExternalLinkIcon verticalAlign="middle" mx="2px" />
            </Link>
          </Text>
        </VStack>
      </VStack>
      <Stack
        direction={["column", "column", "row"]}
        justifyContent="center"
        width="100%"
      >
        {blocks?.map((block) => (
          <BlockCard key={block.id} block={block} />
        ))}
      </Stack>
    </VStack>
  );
};

export default Home;
