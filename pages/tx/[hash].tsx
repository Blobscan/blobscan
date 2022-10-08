import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, Table, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import Link from "next/link";
import Layout from "../../components/layout";
import { connectToDatabase } from "../../util/mongodb";

const Tx = (props: any) => {
  const { tx, blobs } = props;
  return (
    <Layout>
      <h3>Transaction Info</h3>
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href='/'>Home</BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbItem>
          <BreadcrumbLink href={`/block/${tx.block}`}>Block #{tx.block}</BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href='#'>Tx {tx.index}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
        <p>Hash: {tx.hash}</p>
        <p>From: <Link href={`/address/${tx.from}`}>{tx.from}</Link></p>
        <p>To: <Link href={`/address/${tx.to}`}>{tx.to}</Link></p>
        {!blobs.length ?
        <Text>No blobs in this transaction</Text> : 
        
        <Table variant='simple'>
          <Thead>
            <Tr>
              <Th>Hash</Th>
              <Th>Size</Th>
            </Tr>
          </Thead>
          <Tbody>
        
            {blobs?.map((blob: any) => {
              return (
            <Tr>
              <Td><Link
                      href={`/blob/${blob.hash}`}
                    >
                      {blob.hash}
                    </Link></Td>
                    <Td>{blob.data.length}</Td>
            </Tr>
              );
            })}
            </Tbody>
        </Table>
      }
        
    </Layout>
  );
};

export const getServerSideProps = async ({ query }: any) => {
  try {
    const { db } = await connectToDatabase();
    const { hash } = query;
    const txs = await db
      .collection("txs")
      .find({ hash })
      .limit(1)
      .toArray();

    const blobs = await db
    .collection("blobs")
    .find({tx: hash})
    .toArray();

    return {
      props: { tx: JSON.parse(JSON.stringify(txs[0])),
      blobs: JSON.parse(JSON.stringify(blobs)) },
    };
  } catch (e) {
    console.error(e);
  }
};

export default Tx;
