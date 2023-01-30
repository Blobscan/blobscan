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

import { Link } from "./Link";
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
      maxW={["full", "full", "282px"]}
      onClick={() => router.push(`/block/${block.number}`)}
    >
      <Stack>
        <CardHeader>
          <Text textStyle={"lg"}>Block #{number}</Text>
        </CardHeader>
        <CardBody>
          <Text variant="secondary" textStyle={"sm"}>
            {dayjs.unix(timestamp).fromNow()} {transactions.length} Transaction
            {isOne ? "" : "s"}
          </Text>

          <Flex mt="8px">
            <Text textStyle={"sm"} variant="secondary">
              Miner
            </Text>

            <Text
              textStyle="sm"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              ml={1}
            >
              <Link
                href={`/address/${miner}`}
                passHref
                onClick={(e) => {
                  console.log("clicking link");
                  e.stopPropagation();
                }}
              >
                {miner}
              </Link>
            </Text>
          </Flex>
        </CardBody>
      </Stack>
    </ChakraCard>
  );
};
