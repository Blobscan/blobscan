/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Link,
  SimpleGrid,
  Switch,
  useColorMode,
  Heading,
  Container,
} from "@chakra-ui/react";

import { SearchIcon, CheckIcon, PhoneIcon } from "@chakra-ui/icons";
import type { NextPage } from "next";

import Layout from "../components/layouts/layout";

import Switcher from "../components/dark-mode-switcher/Switcher";
import InputSearch from "../components/input-search";

import { connectToDatabase } from "../util/mongodb";

const Home: NextPage = ({}: any) => {
  return (
    <>
      <Layout>
        <SimpleGrid columns={{ sm: 2, md: 4, xl: 6 }} gap={6} mt="140">
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
      <Switcher />
      <br></br>
      <InputSearch />
    </>
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
