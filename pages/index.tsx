/* eslint-disable @typescript-eslint/no-explicit-any */
import { Stack } from "@chakra-ui/react";

import type { NextPage } from "next";

import MainLayout from "../components/layouts/MainLayout";
import { Header } from "../components/heading/Header";
import { Card } from "../components/card/Card";

import Link from "next/link";

import { connectToDatabase } from "../util/mongodb";

const Home: NextPage = ({}: any) => {
  return (
    <>
      <MainLayout>
        <Header />

        {/* testing ui visibiulity, note real data */}
        <Stack w="full" direction={["column", "row"]} border="3px solid black">
          <Card />
          <Card />
          <Card />
          <Card />
        </Stack>
      </MainLayout>

      {/*link to test page component  */}
      {/* <Link href="/testing">GO TO TEST pages layout</Link> */}
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
