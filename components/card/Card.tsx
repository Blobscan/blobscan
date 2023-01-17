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
    <ChakraCard w={["full", "282px"]}>
      <Stack>
        <CardHeader>
          <Text textStyle={"md"}>{title}</Text>
        </CardHeader>
        {/* TODO: fix 8px from body to header card */}
        <CardBody>
          <Text textStyle={"sm"} fontWeight="regular">
            19 seconds ago 118 Transactions
          </Text>

          <Text textStyle={"sm"} fontWeight="regular" mt="8px">
            Miner 0xDAFEA492D9c6733ae3d56b7Efj...
          </Text>
          <Text textStyle={"sm"} fontWeight="regular" mt="4px">
            Reward 0.034811301196471468 ETH
          </Text>
        </CardBody>
      </Stack>
    </ChakraCard>
  );
};
