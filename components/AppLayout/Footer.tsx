import React from "react";
import { Text, Box, useColorModeValue } from "@chakra-ui/react";

const Footer = () => {
  const color = useColorModeValue("nuetral.700", "");
  return (
    <Box position={"relative"} bottom={"0px"}>
      <Text
        align={"center"}
        py="30px"
        textStyle={"paragraph.sm"}
        mt="40px"
        w="100%"
        color={color}
      >
        Blobscan @ 2022 | v1.0.0
      </Text>
    </Box>
  );
};

export default Footer;
