import { Box, Button, Center, Container, Link, SimpleGrid, Spinner } from "@chakra-ui/react";
import { Signer } from "ethers";
import type { NextPage } from "next";
import { DonateButton } from "../components/DonateButton";
import Layout from "../components/layout";
import { connectToDatabase } from "../util/mongodb";

const Home: NextPage = ({ blocks }: any) => {
  return (
    <Layout>
      <SimpleGrid columns={{ sm: 2, md: 4, xl: 6 }} gap={6} mt="140">
        {blocks.map((b: any) => {
          return (
            <Box
              key={b.hash}
              as="button"
              borderRadius="md"
              bg="#502eb4"
              color="white"
              px={10}
              h={20}
            >
              <Link href={`/block/${b.number}`}>Block #{b.number}</Link>
            </Box>
          );
        })}
      </SimpleGrid>
      <Container marginTop="20">
        <Center>
          <DonateButton />
        </Center>
      </Container>
    </Layout>
  );
};

export const getServerSideProps = async () => {
  try {
    const { db } = await connectToDatabase();
    const blocks = await db
      .collection("blocks")
      .find({})
      //   .sort({ metacritic: -1 })
      .limit(12)
      .toArray();

    return {
      props: { blocks: JSON.parse(JSON.stringify(blocks)) },
    };
  } catch (e) {
    console.error(e);
  }

  return {
    props: {}
  }
};

export default Home;
