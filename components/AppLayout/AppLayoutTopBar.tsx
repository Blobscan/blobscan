import { HStack, useMediaQuery, useColorModeValue } from "@chakra-ui/react";

import { DesktopNav } from "./DesktopTopBar";
import { MobileNav } from "./MobileTopBar";

export const TopBar = () => {
  const [isDeskTop] = useMediaQuery("(min-width: 490px)", {
    ssr: true,
    fallback: false,
  });
  const bgColor = useColorModeValue("body", "neutral.dark.500");
  const bordeColor = useColorModeValue("neutral.200", "neutral.dark.400");

  return (
    <HStack
      justify={"end"}
      maxW="100vw"
      py="10px"
      px={["16px", "41px"]}
      mb={["60px", "198px"]}
      borderBottom="1px solid"
      borderColor={bordeColor}
      bgColor={bgColor}
    >
      {isDeskTop ? <DesktopNav /> : <MobileNav />}
    </HStack>
  );
};
