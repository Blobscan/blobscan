import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Link, Stack, Text, VStack } from "@chakra-ui/react";
import type { GetServerSideProps, NextPage } from "next";

import { BlockCard } from "@/components/BlockCard";
import { Logo } from "@/components/BlobscanLogo";
import { InputSearch } from "@/components/InputSearch";
import { connectToDatabase } from "@/util/mongodb";
import { Block } from "@/types";

type HomeProps = {
  blocks: Block[];
};

// TODO: handle possible server-side errors on the client
export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  const { db } = await connectToDatabase();
  const blocks = await db
    .collection("blocks")
    .find({})
    .sort({ number: -1 })
    .limit(4)
    .toArray();

  return {
    props: { blocks },
  };
};

const Home: NextPage<HomeProps> = ({ blocks = [] }) => {
  return (
    <VStack height="900px" spacing={100} width="100%">
      <VStack spacing={8} bgColor="background" as={"header"} w="100%">
        <Logo size="md" />
        <VStack w="100%" spacing={3}>
          <InputSearch />
          <Text textStyle={"md"} color="surfaceContentSecondary">
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
        spacing={2.5}
      >
        {blocks.map((b) => (
          <BlockCard key={b.hash} block={b} />
        ))}
      </Stack>
    </VStack>
  );
};

export default Home;
