import { Flex, useMediaQuery, useColorModeValue } from "@chakra-ui/react";

import { DesktopNav } from "./DesktopTopBar";
import { MobileNav } from "./MobileTopBar";

type TopBarProps = {
  displayLogo: boolean;
};

export const TopBar: React.FC<TopBarProps> = ({ displayLogo }) => {
  const [isDeskTop] = useMediaQuery("(min-width: 490px)", {
    ssr: true,
    fallback: false,
  });
  const bgColor = useColorModeValue("shades.white", "neutral.dark.500");
  const bordeColor = useColorModeValue("neutral.200", "neutral.dark.400");

  return (
    <Flex
      maxW="100vw"
      py="10px"
      px={["16px", "41px"]}
      mb={["60px", "198px"]}
      borderBottom="1px solid"
      borderColor={bordeColor}
      bgColor={bgColor}
    >
      {isDeskTop ? <DesktopNav displayLogo={displayLogo} /> : <MobileNav />}
    </Flex>
  );
};
