import { Table, TableCaption, TableContainer, Tbody, Td, Tfoot, Th, Thead, Tr } from "@chakra-ui/react";
import Link from "next/link";
import Layout from "../../components/layout";
import { connectToDatabase } from "../../util/mongodb";

const Address = (props: any) => {
  const { txs, address } = props;

  return (
    
   <Layout>
      <h3>Transactions for address {address}</h3>
     
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
    const { address } = query;

    const txs = await db.collection("txs").find({ $or: [ { from: address }, { to: address }]}).toArray()

    return {
      props: {
        address,
        txs: JSON.parse(JSON.stringify(txs)),
      },
    };
  } catch (e) {
    console.error(e);
  }
};

export default Address;
