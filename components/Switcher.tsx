import { MoonIcon } from "@chakra-ui/icons";

import {
  Box,
  Flex,
  Text,
  Switch,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";

type SwitcherProps = {
  title?: string;
  //TODO: defaultChecked: string; // como aplico un type a un react component de chackra ? onChange: () => boolean
};

const Switcher: React.FC<SwitcherProps> = ({ title = "Dark Mode" }) => {
  const { toggleColorMode } = useColorMode();

  const borderColor = useColorModeValue("neutral.200", "error.200");
  const iconMoonColor = useColorModeValue("neutral.300", "");

  return (
    <Box
      borderRadius="8px"
      border="1px solid"
      borderColor={borderColor}
      w="10.625rem"
      h="2.5rem"
      //review sizes de padding con figma
      py="8px"
      px="4px"
    >
      <Flex alignItems="center" justifyContent="space-between">
        <MoonIcon boxSize="1rem" color={iconMoonColor} />
        <Text fontSize={"14px"} fontWeight="regular" fontFamily={"sans"}>
          {title}
        </Text>
        <Switch size="md" onChange={toggleColorMode} defaultChecked={false} />
      </Flex>
    </Box>
  );
};

export default Switcher;
