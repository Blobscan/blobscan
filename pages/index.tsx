/* eslint-disable @typescript-eslint/no-explicit-any */
import { Stack } from "@chakra-ui/react";
import type { GetServerSideProps, NextPage } from "next";

import { Header } from "../components/Header";
import { BlockCard } from "../components/BlockCard";

import { connectToDatabase } from "../util/mongodb";
import { Block } from "../types";

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

const Home: NextPage<HomeProps> = ({ blocks = [] }: HomeProps) => (
  <>
    <Header />
    <Stack direction={["column", "row"]}>
      {blocks.map((b: any) => (
        <BlockCard key={b.hash} block={b} />
      ))}
    </Stack>
  </>
);

export default Home;
