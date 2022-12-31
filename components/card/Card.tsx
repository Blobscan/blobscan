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

//TO DO: ... bastara solo con pasar via props el la data , pero ya va  estar toda customizada
export const Card: React.FC<CardProps> = () => {
  return (
    <ChakraCard w={["full", "280px"]} mt={"50px"}>
      <Stack>
        <CardHeader>
          <Text fontSize={"14px"}>Block #71645</Text>
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
