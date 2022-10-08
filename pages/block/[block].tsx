import { Table, TableCaption, TableContainer, Tbody, Td, Tfoot, Th, Thead, Tr } from "@chakra-ui/react";
import Link from "next/link";
import Layout from "../../components/layout";
import { connectToDatabase } from "../../util/mongodb";

const Block = (props: any) => {
  const { block, txs } = props;

  return (
    
   <Layout>
      <h3>Transactions for block #{block?.number}</h3>

      <p>Block hash: {block?.hash}</p>
      <p>Slot: {block?.slot}</p>
      <p>Time: {block?.timestamp}</p>
     
      <Table variant='simple'>
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
        <Td><Link
                href={`/tx/${tx.hash}`}
              >
                {tx.hash}
              </Link></Td>
        <Td><Link
                href={`/address/${tx.from}`}
              >{tx.from}</Link></Td>
        <Td><Link
                href={`/address/${tx.to}`}
              >{tx.to}</Link></Td>
      </Tr>
        );
      })}
      </Tbody>
  </Table>
      </Layout>
  );
};

export const getServerSideProps = async ({ query }: any) => {
  try {
    const { db } = await connectToDatabase();
    const { block } = query;
    let mongoQuery
    if (/^\d+$/.test(block)) {
      mongoQuery = { number: parseInt(block) }
    } else if (/^0x[a-fA-F0-9]+$/.test(block)) {
      mongoQuery = { hash: block }
    }
    const blocks = await db
      .collection("blocks")
      .find(mongoQuery)
      .limit(1)
      .toArray();

    const txs = await db.collection("txs").find({block: parseInt(block)}).toArray()

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
