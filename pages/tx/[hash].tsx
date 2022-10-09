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
import ethers, { BigNumber } from "ethers";
import LinkLayout from "../../components/linkLayout";
import { connectToDatabase } from "../../util/mongodb";

const Tx = (props: any) => {
  const { tx, blobs, block } = props;

  const txHasBlobs = blobs.length;

  const gas = BigNumber.from(tx.gas).toNumber();

  const baseFee = BigNumber.from(block.baseFeePerGas).toNumber();

  let dataGas;
  let callDataEstimation;
  let reductionPrc;
  if (txHasBlobs) {
    dataGas = 120000 * blobs.length;
    callDataEstimation = baseFee * 16 * 4096 * blobs.length;
    reductionPrc = Number(
      (1 - (dataGas + gas) / callDataEstimation) * 100
    ).toFixed(2);
  }

  return (
    <LinkLayout>
      <Box ml="20px">
        <Breadcrumb separator="-" fontWeight="medium" fontSize="lg" mb="5px">
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
          Transaction: {tx.hash}
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
        <Box mb="3px">
          <Tag color="#502eb4" mb="3px">
            Gas:
          </Tag>{" "}
          {gas} gas
        </Box>
        {txHasBlobs && (
          <Box>
            <Box mb="3px">
              <Tag color="#502eb4" mb="3px">
                Data gas:
              </Tag>{" "}
              {dataGas} gas
            </Box>
            <Text color="#502eb4" mt="5px">
              Compare with {callDataEstimation} when using <span>calldata</span>{" "}
              ({reductionPrc}% reduction)
            </Text>
          </Box>
        )}
      </Box>

      {!txHasBlobs ? (
        <Text color="#502eb4" ml="20px" mt="20px">
          No blobs in this transaction
        </Text>
      ) : (
        <Table variant="simple" mt="50px">
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
                    <Link href={`/blob/${blob.hash}`}>{blob.hash}</Link>
                  </Td>
                  <Td>{blob.data.length}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </LinkLayout>
  );
};

export const getServerSideProps = async ({ query }: any) => {
  try {
    const { db } = await connectToDatabase();
    const { hash } = query;
    const txs = await db.collection("txs").find({ hash }).limit(1).toArray();

    const parsedTx = JSON.parse(JSON.stringify(txs[0]));

    const block = parsedTx.block;

    const blocks = await db
      .collection("blocks")
      .find({ number: parseInt(block) })
      .limit(1)
      .toArray();

    const blobs = await db.collection("blobs").find({ tx: hash }).toArray();

    return {
      props: {
        tx: parsedTx,
        blobs: JSON.parse(JSON.stringify(blobs)),
        block: JSON.parse(JSON.stringify(blocks[0])),
      },
    };
  } catch (e) {
    console.error(e);
  }
};

export default Tx;
