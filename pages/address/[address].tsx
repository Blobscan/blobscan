import {
  Table,
  Tag,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Heading,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import Link from "next/link";
import { GetServerSideProps, NextPage } from "next";
import { Transaction } from "@prisma/client";

import prisma from "@/lib/prisma";

type AddressProps = {
  address: string;
  txs: Transaction[];
};

export const getServerSideProps: GetServerSideProps<AddressProps> = async ({
  query,
}) => {
  const address = query.address as string;

  const txs = await prisma.transaction.findMany({
    where: { OR: [{ from: address }, { to: address }] },
  });

  return {
    props: { address, txs },
  };
};

const Address: NextPage<AddressProps> = ({ address, txs }) => {
  return (
    <>
      <Breadcrumb
        ml="20px"
        mb="5px"
        separator="-"
        fontWeight="medium"
        fontSize="md"
      >
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="/">Address {address}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      <Heading as="h1" width="100%" mb="15px" ml="20px" fontSize="1.5rem">
        Address {address}
      </Heading>

      <Heading as="h2" width="xs" fontSize="1.2rem" mt="50px" ml="20px">
        Transactions
      </Heading>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Hash</Th>
            <Th>Type</Th>
            <Th>From</Th>
            <Th></Th>
            <Th>To</Th>
          </Tr>
        </Thead>
        <Tbody>
          {txs?.map((tx: any) => {
            return (
              <Tr key={tx.hash} fontSize="0.9rem">
                <Td>
                  <Link href={`/tx/${tx.hash}`}>{tx.hash}</Link>
                </Td>
                <Td>
                  <Tag
                    size="md"
                    textAlign="center"
                    variant="subtle"
                    colorScheme={tx.to === address ? "green" : "red"}
                  >
                    {tx.to === address ? "IN" : "OUT"}
                  </Tag>
                </Td>
                <Td>
                  <Link href={`/address/${tx.from}`}>{tx.from}</Link>
                </Td>
                <Td>
                  <ArrowForwardIcon color="green.700" w={5} h={5} />
                </Td>
                <Td>
                  <Link href={`/address/${tx.to}`}>{tx.to}</Link>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </>
  );
};

export default Address;
