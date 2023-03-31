import {
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Box,
  Flex,
  Heading,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Tag,
} from "@chakra-ui/react";
import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { Block, Transaction } from "@prisma/client";

import prisma from "@/lib/prisma";
import { formatDate } from "@/util/helpers";

type BlockProps = {
  block: Block;
  txs: Transaction[];
};

export const getServerSideProps: GetServerSideProps<BlockProps> = async ({
  query,
}) => {
  const blockId = query.block as string;
  const blocks = await prisma.block.findMany({
    where: { OR: [{ number: parseInt(blockId) }, { hash: blockId }] },
    take: 1,
  });

  const txs = await prisma.transaction.findMany({
    where: { block: blocks[0].number },
  });

  return {
    props: { block: blocks[0], txs },
  };
};

const Block: NextPage<BlockProps> = ({ block, txs }) => (
  <>
    <Flex
      direction="column"
      flexWrap="wrap"
      width="100vw"
      mr="20px"
      ml="20px"
      mb="30px"
    >
      <Breadcrumb mb="5px" separator="-" fontWeight="medium" fontSize="md">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="/">Block #{block?.number}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      <Heading as="h1" width="xs" mb="5px" fontSize="1.5rem">
        Block: #{block?.number}
      </Heading>
      <Box>
        <Tag mb="3px">Timestamp:</Tag> {formatDate(block?.timestamp)}
      </Box>
      <Box>
        <Tag mb="3px">Slot:</Tag> {block?.slot}
      </Box>
      <Box>
        <Tag mb="3px">Block hash:</Tag> {block?.hash}
      </Box>
    </Flex>

    <Box>
      <Heading as="h2" width="xs" fontSize="1.2rem" mt="50px" ml="20px">
        Transactions
      </Heading>
      <Table variant="simple" mt="5px">
        <Thead>
          <Tr>
            <Th>Index</Th>
            <Th>Hash</Th>
            <Th>From</Th>
            <Th>To</Th>
          </Tr>
        </Thead>
        <Tbody>
          {txs?.map((tx, i) => {
            return (
              <Tr key={tx.hash} fontSize="0.9rem">
                <Td>
                  <p>{i}</p>
                </Td>
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
  </>
);

export default Block;
