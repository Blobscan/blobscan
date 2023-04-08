import type { NextPage } from "next";
import NextError from "next/error";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Link, Spinner, Stack, Text, VStack } from "@chakra-ui/react";

import { api } from "~/utils/api";
import { Logo } from "~/components/BlobscanLogo";
import { BlockCard } from "~/components/BlockCard";
import { InputSearch } from "~/components/InputSearch";

const Home: NextPage = () => {
  const blocksQuery = api.block.getAll.useQuery({ take: 4 });

  if (blocksQuery.error) {
    return (
      <NextError
        title={blocksQuery.error.message}
        statusCode={blocksQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (blocksQuery.status !== "success") {
    return <Spinner />;
  }

  const { data: blocks } = blocksQuery;

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
        {blocks.map((block) => (
          <BlockCard key={block.id} block={block} />
        ))}
      </Stack>
    </VStack>
  );
};

export default Home;
