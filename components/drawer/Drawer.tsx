import {
  Drawer as ChakraDrawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from "@chakra-ui/react";

type DrawerProps = {
  isOpen: boolean;
  onClose(): void;
};

export const Drawer = ({ isOpen, onClose }: DrawerProps) => {
  return (
    <ChakraDrawer
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
          <p>blobscan...</p>
          <p>Is currently...</p>
          <p>In Building Mode...</p>
        </DrawerBody>
      </DrawerContent>
    </ChakraDrawer>
  );
};
