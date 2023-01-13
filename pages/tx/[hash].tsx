import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Heading,
  Button,
  Box,
  Tag,
} from "@chakra-ui/react";
import Link from "next/link";

import LinkLayout from "../../components/AppLayouts/linkLayout";
import { connectToDatabase } from "../../util/mongodb";

const Tx = (props: any) => {
  const { tx, blobs } = props;

  return (
    <LinkLayout>
      <Box ml="20px">
        <Breadcrumb separator="-" fontWeight="medium" fontSize="md" mb="5px">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem>
            <BreadcrumbLink href={`/block/${tx.block}`}>
              Block #{tx.block}
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href="#">Tx {tx.index}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <Heading
          as="h1"
          color="#502eb4"
          width="100%"
          mb="15px"
          fontSize="1.5rem"
        >
          Transaction {tx.hash}
        </Heading>
        <Box mb="3px">
          <Tag color="#502eb4" mb="3px">
            From:
          </Tag>{" "}
          <Link href={`/address/${tx.from}`}>{tx.from}</Link>
        </Box>
        <Box mb="3px">
          <Tag color="#502eb4" mb="3px">
            To:
          </Tag>{" "}
          <Link href={`/address/${tx.to}`}>{tx.to}</Link>
        </Box>
      </Box>

      <Box>
        <Heading
          as="h2"
          color="#502eb4"
          width="xs"
          fontSize="1.2rem"
          mt="50px"
          ml="20px"
        >
          Blobs
        </Heading>
        {!blobs.length ? (
          <Text color="#502eb4" ml="20px" mt="20px">
            No blobs in this transaction
          </Text>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Data Hash</Th>
                <Th>Size</Th>
              </Tr>
            </Thead>
            <Tbody>
              {blobs?.map((blob: any) => {
                return (
                  <Tr key={blob.hash} fontSize="0.9rem">
                    <Td>
                      <Link href={`/blob/${blob.tx}-${blob.index}`}>
                        {blob.hash}
                      </Link>
                    </Td>
                    <Td>{blob.data.length}</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Box>
    </LinkLayout>
  );
};

export const getServerSideProps = async ({ query }: any) => {
  try {
    const { db } = await connectToDatabase();
    const { hash } = query;
    const txs = await db.collection("txs").find({ hash }).limit(1).toArray();

    const blobs = await db.collection("blobs").find({ tx: hash }).toArray();

    return {
      props: {
        tx: JSON.parse(JSON.stringify(txs[0])),
        blobs: JSON.parse(JSON.stringify(blobs)),
      },
    };
  } catch (e) {
    console.error(e);
  }
};

export default Tx;
