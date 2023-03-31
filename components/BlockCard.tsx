import {
  Card as ChakraCard,
  CardHeader,
  CardBody,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Block, Transaction } from "@prisma/client";

dayjs.extend(relativeTime);

type CardProps = {
  block: Block & { Transactions: Transaction[] };
};

export const BlockCard: React.FC<CardProps> = ({ block }) => {
  const router = useRouter();
  const { number, timestamp, Transactions } = block;
  const isOne = Transactions.length === 1;

  return (
    <ChakraCard
      maxW={["full", "282px"]}
      onClick={() => router.push(`/block/${block.number}`)}
    >
      <Stack>
        <CardHeader>
          <Text textStyle={"lg"}>Block #{number}</Text>
        </CardHeader>
        <CardBody>
          <Text variant="secondary" textStyle={"sm"}>
            {dayjs.unix(timestamp).fromNow()} {Transactions.length} Transaction
            {isOne ? "" : "s"}
          </Text>
        </CardBody>
      </Stack>
    </ChakraCard>
  );
};
