/* eslint-disable @typescript-eslint/no-explicit-any */
import { Stack } from "@chakra-ui/react";
import type { NextPage } from "next";

import { Header } from "../components/Heading/Header";

import { Card } from "../components/Card/Card";

import { connectToDatabase } from "../util/mongodb";

const Home: NextPage = ({}: any) => {
  return (
    <>
      <Header />
      {/*TODO: testing ui visibiulity with <Card /> component, note real data */}
      <Stack w="full" direction={["column", "row"]}>
        <Card />
        <Card />
        <Card />
        <Card />
      </Stack>
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
