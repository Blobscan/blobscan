import type { NextPage } from "next";
import NextError from "next/error";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  Heading,
  Spinner,
  Table,
  Tag,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";

import { api } from "~/utils/api";
import { formatDate } from "~/utils/helpers";

const Block: NextPage = () => {
  const router = useRouter();
  const id = router.query.id as string;

  const blockQuery = api.block.byId.useQuery({ id: id });

  if (blockQuery.error) {
    return (
      <NextError
        title={blockQuery.error.message}
        statusCode={blockQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (blockQuery.status !== "success") {
    return <Spinner />;
  }

  const { data: block } = blockQuery;

  return (
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
            <BreadcrumbLink href="/">Block #{block.number}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        <Heading as="h1" width="xs" mb="5px" fontSize="1.5rem">
          Block: #{block.number}
        </Heading>
        <Box>
          <Tag mb="3px">Timestamp:</Tag> {formatDate(block.timestamp)}
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
            {block.Transaction.map((tx, i) => {
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
};

export default Block;
