import { Flex, useMediaQuery } from "@chakra-ui/react";
import { useRouter } from "next/router";

import { DesktopNav } from "./DesktopTopBar";
import { MobileNav } from "./MobileTopBar";

export const AppLayoutTopBar: React.FC = () => {
  const { pathname } = useRouter();
  const isHomePage = pathname === "/";
  const homePageProps = isHomePage
    ? { border: 0, bgColor: "background" }
    : { borderColor: "border", bgColor: "surface" };

  const [isDeskTop] = useMediaQuery("(min-width: 490px)", {
    ssr: true,
    fallback: false,
  });

  return (
    <Flex
      maxW="100vw"
      py="10px"
      px={["16px", "41px"]}
      mb={["60px", "198px"]}
      borderBottom="1px solid"
      {...homePageProps}
    >
      {isDeskTop ? <DesktopNav isHomePage={isHomePage} /> : <MobileNav />}
    </Flex>
  );
};
