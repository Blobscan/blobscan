import {
  Card as ChakraCard,
  CardHeader,
  CardBody,
  Stack,
  Text,
  useTheme,
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
  const { colors } = useTheme();
  const isOne = transactions.length === 1;

  return (
    <ChakraCard
      w={["full", "282px"]}
      onClick={() => router.push(`/block/${block.number}`)}
    >
      <Stack>
        <CardHeader>
          <Text fontSize={"18px"}>Block #{number}</Text>
        </CardHeader>
        {/* TODO: fix 8px from body to header card */}
        <CardBody>
          <Text fontSize={"12px"} color={colors.neutral[600]}>
            {dayjs.unix(timestamp).fromNow()} {transactions.length} Transaction
            {isOne ? "" : "s"}
          </Text>

          <Text
            fontSize={"12px"}
            mt="8px"
            whiteSpace={"nowrap"}
            overflow="hidden"
            textOverflow="ellipsis"
          >
            Miner {miner}
          </Text>
        </CardBody>
      </Stack>
    </ChakraCard>
  );
};
