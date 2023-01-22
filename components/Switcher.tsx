import {
  Flex,
  Text,
  Switch,
  Button,
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

  const textColor = useColorModeValue("nuetral.700", "shades.100");

  return (
    <Button variant={"switch"} maxW="237px" py="8px" pl="9px" pr="12px">
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
        defaultChecked={colorMode !== "light" && true}
      />
    </Button>
  );
};

export default Switcher;
