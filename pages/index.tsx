/* eslint-disable @typescript-eslint/no-explicit-any */
import {} from "@chakra-ui/react";
import type { NextPage } from "next";

import MainLayout from "../components/layouts/MainLayout";
import InputSearch from "../components/input-search";
import { DesktopNav, MobileNav, TopNav } from "../components/top-navbar/index";

import { connectToDatabase } from "../util/mongodb";

const Home: NextPage = ({}: any) => {
  return (
    <>
      <TopNav />
      {/* <DesktopNav />
      <MobileNav /> */}
      <MainLayout>
        <InputSearch />
      </MainLayout>
    </>
  );
};

export default Home;

//codigo anterior de la hackaton: ..

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

{
  /* <SimpleGrid columns={{ sm: 2, md: 4, xl: 6 }} gap={6} mt="140">
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
  </SimpleGrid> */
}
