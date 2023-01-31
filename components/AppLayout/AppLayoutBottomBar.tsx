import React from "react";
import { Text } from "@chakra-ui/react";

export const AppLayoutBottomBar = () => {
  return (
    <Text
      position={"relative"}
      bottom={"0px"}
      align={"center"}
      py="30px"
      textStyle={"md"}
      mt="40px"
      w="100%"
      color="contentSecondary"
    >
      Blobscan @ 2022 | v1.0.0
    </Text>
  );
};
