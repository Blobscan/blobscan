import { useRouter } from "next/router";
import {
  CardBody,
  CardHeader,
  Card as ChakraCard,
  Stack,
  Text,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import type { Block } from "~/types";

dayjs.extend(relativeTime);

type CardProps = {
  block: Block;
};

export const BlockCard: React.FC<CardProps> = ({ block }) => {
  const router = useRouter();
  const { number, timestamp, Transaction } = block;
  const isOne = Transaction.length === 1;

  return (
    <ChakraCard
      maxW={["full", "282px"]}
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onClick={() => router.push(`/block/${block.number}`)}
    >
      <Stack>
        <CardHeader>
          <Text textStyle={"lg"}>Block #{number}</Text>
        </CardHeader>
        <CardBody>
          <Text variant="secondary" textStyle={"sm"}>
            {dayjs.unix(timestamp).fromNow()} {Transaction.length} Transaction
            {isOne ? "" : "s"}
          </Text>
        </CardBody>
      </Stack>
    </ChakraCard>
  );
};
