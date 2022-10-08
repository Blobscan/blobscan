import { Box, Heading, Text, Link, Input, InputGroup, Button, InputRightElement, Grid, GridItem, Container } from "@chakra-ui/react";
import type { NextPage } from "next";
import Layout from '../components/layout'
import { connectToDatabase } from "../util/mongodb";

const Home: NextPage = ({ blocks }: any) => {
  return (
    <Layout>

<Grid templateColumns='repeat(5, 1fr)' gap={6} mt="30">
    {blocks?.map((b: any) => {
      return (
        <GridItem>
          <Box>
        <Link href={`/block/${b.number}`}>
        Block #{b.number}
        </Link>
        </Box>
        </GridItem>
        );
      })}
      </Grid>
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
        .limit(5)
        .toArray();
        
        return {
          props: { blocks: JSON.parse(JSON.stringify(blocks)) },
        };
      } catch (e) {
        console.error(e);
      }
    };
    
    export default Home;
    