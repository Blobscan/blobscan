import React from "react";
import { Text, useColorModeValue } from "@chakra-ui/react";

const Footer = () => {
  const color = useColorModeValue("nuetral.700", "neutral.dark.100");
  return (
    <Text
      position={"fixed"}
      bottom={"0px"}
      align={"center"}
      py="30px"
      textStyle={"paragraph.sm"}
      mt="40px"
      w="100%"
      color={color}
    >
      Blobscan @ 2022 | v1.0.0
    </Text>
  );
};

export default Footer;
