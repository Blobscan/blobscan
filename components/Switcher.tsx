import {
  Flex,
  Text,
  Switch,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";

import Image from "next/image";

type SwitcherProps = {
  title?: string;
};
import IconMoonLight from "../assests/moon-light.svg";
import IconMoonDark from "../assests/moon-dark.svg";

const Switcher: React.FC<SwitcherProps> = ({ title = "Dark Mode" }) => {
  const { toggleColorMode, colorMode } = useColorMode();

  const textColor = useColorModeValue("body", "shades.100");
  const bgColor = useColorModeValue("body", "neutral.dark.200");
  const bgColorHover = useColorModeValue("primary.100", "primary.dark.300");
  const bgColorActive = useColorModeValue("primary.50", "primary.dark.400");

  return (
    <Flex
      maxW="237px"
      alignItems="center"
      justifyContent="space-between"
      borderRadius="50px"
      h="2.5rem"
      py="8px"
      pl="9px"
      pr="12px"
      cursor={"pointer"}
      bgColor={bgColor}
      _hover={{ bgColor: bgColorHover }}
      _active={{ bgColor: bgColorActive }}
    >
      <Flex alignItems="center" justifyContent="space-between">
        {colorMode === "light" ? (
          <Image src={IconMoonLight} alt="light-mode"></Image>
        ) : (
          <Image src={IconMoonDark} alt="dark-mode"></Image>
        )}
        <Text
          textStyle={"md"}
          fontWeight="regular"
          fontFamily={"sans"}
          lineHeight="16px"
          letterSpacing={"0.25px"}
          pl="10px"
          pr="80px"
          color={textColor}
        >
          {title}
        </Text>
      </Flex>
      <Switch
        size="md"
        onChange={toggleColorMode}
        defaultChecked={colorMode === "light" ? false : true}
      />
    </Flex>
  );
};

export default Switcher;
