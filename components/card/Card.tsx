import {
  Card as ChakraCard,
  CardHeader,
  CardBody,
  Stack,
  Text,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";

type CardProps = {
  title: string;
};

export const Card: React.FC<CardProps> = ({ title = "Block #71645" }) => {
  const titleColor = useColorModeValue("neutral.900", "shades.100");

  return (
    <ChakraCard w={["full", "282px"]}>
      <Stack>
        <CardHeader>
          <Text textStyle={"lg"} color={titleColor}>
            {title}
          </Text>
        </CardHeader>
        {/* TODO: fix 8px from body to header card */}
        <CardBody>
          <Text textStyle={"sm"} fontWeight="regular">
            19 seconds ago 118 Transactions
          </Text>
          <Flex>
            <Text textStyle={"sm"} fontWeight="regular" mt="8px" pr={"4px"}>
              Miner
            </Text>
            <Text
              textStyle={"sm"}
              fontWeight="regular"
              mt="8px"
              variant={"primary"}
            >
              0xDAFEA492D9c6733ae3d56b7Efj...
            </Text>
          </Flex>

          <Text fontSize={"12px"} fontWeight="regular" mt="4px">
            Reward 0.034811301196471468 ETH
          </Text>
        </CardBody>
      </Stack>
    </ChakraCard>
  );
};
