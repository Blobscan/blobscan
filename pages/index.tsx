import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Link, Stack, Text, VStack } from "@chakra-ui/react";
import { Block } from "@prisma/client";
import type { GetServerSideProps, NextPage } from "next";

import { BlockCard } from "@/components/BlockCard";
import { Logo } from "@/components/BlobscanLogo";
import { InputSearch } from "@/components/InputSearch";
import prisma from "@/lib/prisma";

type HomeProps = {
  blocks: Block[];
};

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  const blocks = await prisma.block.findMany({
    orderBy: { number: "desc" },
    take: 4,
  });

  return {
    props: { blocks },
  };
};

const Home: NextPage<HomeProps> = ({ blocks = [] }) => {
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
        {blocks.map((b) => (
          <BlockCard key={b.hash} block={b} />
        ))}
      </Stack>
    </VStack>
  );
};

export default Home;
