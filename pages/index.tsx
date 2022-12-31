/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NextPage } from "next";

import MainLayout from "../components/layouts/MainLayout";
import InputSearch from "../components/input-search";
import { Card } from "../components/card/Card";

import Link from "next/link";

import { connectToDatabase } from "../util/mongodb";

const Home: NextPage = ({}: any) => {
  return (
    <>
      <MainLayout>
        <InputSearch />
        <Card />
      </MainLayout>
      {/* link page to test layouts and ui-components */}
      <Link href="/testing">GO TO TEST pages layout</Link>
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
