import {
  Card as ChakraCard,
  CardHeader,
  CardBody,
  Stack,
  Text,
} from "@chakra-ui/react";

type CardProps = {
  title: string;
  // ....
};

//... bastara solo con pasar via props la data , pero ya va  estar toda customizada
export const Card: React.FC<CardProps> = ({ title = "Block #71645" }) => {
  return (
    <ChakraCard w={["full", "280px"]} mt={"50px"}>
      <Stack>
        <CardHeader>
          <Text fontSize={"14px"}>{title}</Text>
        </CardHeader>
        <CardBody>
          <Text fontSize={"12px"}>19 seconds ago 118 Transactions</Text>

          <Text fontSize={"12px"} mt="8px">
            Miner 0xDAFEA492D9c6733ae3d56b7Efj...
          </Text>
          <Text fontSize={"12px"} mt="4px">
            Reward 0.034811301196471468 ETH
          </Text>
        </CardBody>
      </Stack>
    </ChakraCard>
  );
};
