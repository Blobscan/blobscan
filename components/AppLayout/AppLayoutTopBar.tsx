import { Flex, Container, useMediaQuery } from "@chakra-ui/react";
import { useRouter } from "next/router";

import { InputSearch } from "../InputSearch";
import { Logo } from "../BlobscanLogo";
import { DarkModeButton } from "../DarkModeButton";

export const AppLayoutTopBar: React.FC = () => {
  const { pathname } = useRouter();
  const isHomePage = pathname === "/";
  const [isDeskTop] = useMediaQuery("(min-width: 834px)", {
    ssr: true,
    fallback: false,
  });

  const homePageProps = isHomePage
    ? {
        border: 0,
        bgColor: "background",
        justify: "end",
        mb: ["60px", "198px"],
      }
    : {
        borderColor: "border",
        bgColor: "surface",
        justify: "space-between",
        mb: ["10px", "30px", "40px"],
      };

  return (
    <>
      <Flex
        maxW="100vw"
        py="10px"
        px={["16px", "16px", "41px"]}
        borderBottom="1px solid"
        alignItems={"center"}
        {...homePageProps}
      >
        {!isHomePage && isDeskTop ? (
          <>
            <Logo size="sm" />
            <InputSearch />
          </>
        ) : !isHomePage && !isDeskTop ? (
          <Logo size="sm" />
        ) : null}

        <DarkModeButton />
      </Flex>

      {!isDeskTop && !isHomePage ? (
        <Container
          maxW="100%"
          pl={"16px"}
          pr={"16px"}
          centerContent={true}
          mb={["60px", "50px"]}
        >
          <InputSearch />
        </Container>
      ) : null}
    </>
  );
};
