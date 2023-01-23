import { IconButton, useDisclosure, Flex } from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";

export const MobileNav = () => {
  const { onOpen } = useDisclosure();

  return (
    <>
      <Flex w={"100%"} justifyContent={"end"}>
        <IconButton
          onClick={onOpen}
          aria-label="Toogle Mobile Menu"
          p={"0px"}
          bgColor="white"
          border={"1px solid"}
          borderColor="neutral.200"
          borderRadius={"6px"}
          dropShadow="sm"
        >
          <HamburgerIcon
            h="36px"
            w="36px"
            p="8px"
            borderRadius={"8px"}
            color="neutral.500"
          />
        </IconButton>
      </Flex>
    </>
  );
};
