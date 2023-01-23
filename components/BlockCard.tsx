import {
  Card as ChakraCard,
  CardHeader,
  CardBody,
  Stack,
  Flex,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { Block } from "../types";

dayjs.extend(relativeTime);

type CardProps = {
  block: Block;
};

export const BlockCard: React.FC<CardProps> = ({ block }) => {
  const router = useRouter();
  const { number, timestamp, miner, transactions } = block;
  const isOne = transactions.length === 1;

  return (
    <ChakraCard
      maxW={["full", "282px"]}
      onClick={() => router.push(`/block/${block.number}`)}
    >
      <Stack>
        <CardHeader>
          <Text variant={"title1"} textStyle={"lg"}>
            Block #{number}
          </Text>
        </CardHeader>
        <CardBody>
          <Text textStyle={"sm"} fontWeight={"regular"}>
            {dayjs.unix(timestamp).fromNow()} {transactions.length} Transaction
            {isOne ? "" : "s"}
          </Text>

          <Flex mt="8px">
            <Text textStyle={"sm"}>Miner</Text>
            <Text
              variant={"primary"}
              textStyle={"sm"}
              whiteSpace={"nowrap"}
              overflow="hidden"
              textOverflow="ellipsis"
              pl="4px"
            >
              {miner}
            </Text>
          </Flex>
        </CardBody>
      </Stack>
    </ChakraCard>
  );
};
