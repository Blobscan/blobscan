import {
  Flex,
  Text,
  Switch,
  Button,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";

import Image from "next/image";
import { ImageProps } from "next/image";

import IconMoonLight from "../assests/moon-light.svg";
import IconMoonDark from "../assests/moon-dark.svg";

type SwitcherProps = {
  title?: string;
};
const Switcher: React.FC<SwitcherProps> = ({ title = "Dark Mode" }) => {
  const { toggleColorMode, colorMode } = useColorMode();
  const textColor = useColorModeValue("nuetral.700", "shades.100");

  const imageProps: ImageProps =
    colorMode === "light"
      ? {
          src: IconMoonLight,
          alt: "icon-light",
        }
      : {
          src: IconMoonDark,
          alt: "icon-dark",
        };

  return (
    <Button variant={"switch"} maxW="237px" py="8px" pl="9px" pr="12px">
      <Flex alignItems="center" justifyContent="space-between">
        <Image {...imageProps} />
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
