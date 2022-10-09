import {
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr,
  Container,
  Box,
} from "@chakra-ui/react";
import Link from "next/link";
import LinkLayout from "../../components/linkLayout";
import { connectToDatabase } from "../../util/mongodb";

const Block = (props: any) => {
  const { block, txs } = props;

  return (
    <LinkLayout>
      <Container maxW="2xl" centerContent mt="50px">
        <Box>
          <h3>Block #{block?.number}</h3>
          <p>Slot: {block?.slot}</p>
          <p>Time: {block?.timestamp}</p>
          <p>Block hash: {block?.hash}</p>
        </Box>
      </Container>
      <Container maxW="2xl" centerContent>
        <Table variant="simple" mt="50px">
          <Thead>
            <Tr>
              <Th>Hash</Th>
              <Th>From</Th>
              <Th>To</Th>
            </Tr>
          </Thead>
          <Tbody>
            {txs?.map((tx: any) => {
              // TODO: Change the tx hash to one from the database
              return (
                <Tr key={tx.hash}>
                  <Td>
                    <Link href={`/tx/${tx.hash}`}>{tx.hash}</Link>
                  </Td>
                  <Td>
                    <Link href={`/address/${tx.from}`}>{tx.from}</Link>
                  </Td>
                  <Td>
                    <Link href={`/address/${tx.to}`}>{tx.to}</Link>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Container>
      {/* <Container maxW="2xl" centerContent mt="50px">
        <Box ml="0px">
          <h3>Block: #{block?.number}</h3>
          <Box>Time: {block?.timestamp}</Box>
          <Box>Slot: {block?.slot}</Box>
          <Box>Block hash: {block?.hash}</Box>
        </Box>

        <Box>
          <Table variant="simple" mt="50px">
            <Thead>
              <Tr>
                <Th>Hash</Th>
                <Th>From</Th>
                <Th>To</Th>
              </Tr>
            </Thead>
            <Tbody>
              {txs?.map((tx: any) => {
                // TODO: Change the tx hash to one from the database
                return (
                  <Tr key={tx.hash}>
                    <Td>
                      <Link href={`/tx/${tx.hash}`}>{tx.hash}</Link>
                    </Td>
                    <Td>
                      <Link href={`/address/${tx.from}`}>{tx.from}</Link>
                    </Td>
                    <Td>
                      <Link href={`/address/${tx.to}`}>{tx.to}</Link>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      </Container> */}
    </LinkLayout>
  );
};

export const getServerSideProps = async ({ query }: any) => {
  try {
    const { db } = await connectToDatabase();
    const { block } = query;
    const blocks = await db
      .collection("blocks")
      .find({ $or: [ { number: parseInt(block) }, { hash: block }]})
      .limit(1)
      .toArray();

    const txs = await db.collection("txs").find({block: blocks[0].number}).toArray()

    return {
      props: {
        block: JSON.parse(JSON.stringify(blocks[0])),
        txs: JSON.parse(JSON.stringify(txs)),
      },
    };
  } catch (e) {
    console.error(e);
  }
};

export default Block;
