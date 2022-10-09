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
import LinkLayout from "../../components/linkLayout";
import { connectToDatabase } from "../../util/mongodb";

const Address = (props: any) => {
  const { txs, address } = props;

  return (
    <LinkLayout>
      <Breadcrumb ml="20px" mb="5px">
        <BreadcrumbItem separator="-" fontWeight="medium" fontSize="lg">
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      <Heading
        as="h1"
        color="#502eb4"
        width="100%"
        mb="15px"
        ml="20px"
        fontSize="1.5rem"
      >
        Transactions for address: {address}
      </Heading>

      <Table variant="simple" mt="50px">
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
    </LinkLayout>
  );
};

export const getServerSideProps = async ({ query }: any) => {
  try {
    const { db } = await connectToDatabase();
    const { address } = query;

    const txs = await db
      .collection("txs")
      .find({ $or: [{ from: address }, { to: address }] })
      .toArray();

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
