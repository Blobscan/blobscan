import { IconButton, useDisclosure } from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";

import { Drawer } from "../Drawer/Drawer";

export const MobileNav = () => {
  const { onClose, isOpen, onOpen, onToggle } = useDisclosure();
  return (
    <>
      {/* TODO: variante  */}
      {/* <IconButton
        onClick={onToggle}
        icon={
          isOpen ? <CloseIcon boxSize={5} /> : <HamburgerIcon w={5} h={5} />
        }
        size={"sm"}
        aria-label={"Toggle Navigation"}
        color={"black"}
        _hover={{
          color: "primary.300",
        }}
      /> */}
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
      <Drawer onOpen={onOpen} onClose={onClose} isOpen={isOpen} />
    </>
  );
};
