import {
  HStack,
  Flex,
  IconButton,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";

import Switcher from "../Switcher";

export const TopNav = () => {
  return (
    <HStack
      justify={"end"}
      maxW="100vw"
      pt={["10px", "19px"]}
      px={["10px", "40px"]}
      mb={["60px", "171px"]}
    >
      <Flex display={["none", "block"]}>
        <DesktopNav />
      </Flex>
      <Flex display={["block", "none"]}>
        <MobileNav />
      </Flex>
    </HStack>
  );
};

export const DesktopNav = () => {
  return <Switcher />;
};

export const MobileNav = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      {/* Posible varainte para icon Button <IconButton
            onClick={onToggle}
            icon={
              isOpen ? <CloseIcon boxSize={5} /> : <HamburgerIcon w={5} h={5} />
            }
            variant={"link"}
            size={"sm"}
            aria-label={"Toggle Navigation"}
            color={"white"}
            _hover={{
              color: "primary.300",
            }}
          /> */}
      <IconButton
        onClick={onOpen}
        aria-label="Toogle Mobile Menu"
        p={"0px"}
        bgColor="shades.0"
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

      {/*posible componente Drawer para mobile -- ejemplo de test -- armar component aparte, los styles van en DrawerHeader y DrawerBody*/}

      <Drawer
        placement="left"
        size="xs"
        onClose={onClose}
        isOpen={isOpen}
        closeOnEsc={true}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">Basic Drawer Test</DrawerHeader>
          <DrawerBody>
            <DrawerCloseButton>close</DrawerCloseButton>
            <p>Some contents...</p>
            <p>Some contents...</p>
            <p>Some contents...</p>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};
