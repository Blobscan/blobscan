import React from "react";
import { Text, useColorModeValue } from "@chakra-ui/react";

const Footer = () => {
  //ver color para dark-mode:
  const color = useColorModeValue("nuetral.700", "git c");
  return (
    <Text
      align={"center"}
      py="30px"
      position={"fixed"}
      bottom={"0px"}
      textStyle={"paragraph.sm"}
      w="100%"
      color={color}
    >
      Blobscan @ 2022 | v1.0.0
    </Text>
  );
};

export default Footer;
