/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Link, SimpleGrid, Switch, useColorMode } from "@chakra-ui/react";

import { SearchIcon, CheckIcon, PhoneIcon } from "@chakra-ui/icons";
import type { NextPage } from "next";

import Layout from "../components/layout";
import { connectToDatabase } from "../util/mongodb";

const Home: NextPage = ({}: any) => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Layout>
      <SimpleGrid columns={{ sm: 2, md: 4, xl: 6 }} gap={6} mt="140">
        <Switch onChange={toggleColorMode} />
        Toggle {colorMode === "light" ? "Dark" : "Light"}
        <p></p>
        {/* {blocks.map((b: any) => {
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
        })} */}
      </SimpleGrid>
    </Layout>
  );
};

// export const getServerSideProps = async () => {
//   try {
//     const { db } = await connectToDatabase();
//     const blocks = await db
//       .collection("blocks")
//       .find({})
//       .sort({ number: -1 })
//       .limit(12)
//       .toArray();

//     return {
//       props: { blocks: JSON.parse(JSON.stringify(blocks)) },
//     };
//   } catch (e) {
//     console.error(e);
//   }
// };

export default Home;
