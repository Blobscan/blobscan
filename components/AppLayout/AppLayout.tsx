import { Container, Box, useColorModeValue } from "@chakra-ui/react";
import { useRouter } from "next/router";

import { TopBar } from "./AppLayoutTopBar";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  variant?: string;
}

const AppLayout = ({ children }: LayoutProps) => {
  const { pathname } = useRouter();
  const bgColor = useColorModeValue("neutral.50", "shades.200");
  return (
    <>
      <TopBar withLogoInput={pathname === "/" ? false : true} />

      {pathname === "/" ? (
        //TODO: isolate containers in components ?
        <Container size={["sm", "md"]} centerContent={true}>
          {children}
        </Container>
      ) : (
        <>
          {/* <Box
            pos={"absolute"}
            top="61px"
            bgColor={bgColor}
            w="100%"
            minH="100vh"
          > */}
          <Container size={["sm", "lg"]} variant="shadow">
            {children}
          </Container>
          {/* </Box> */}
        </>
      )}
      {/* TODO: Footer breaks on pages ...fix  ==> ver de cambiar el fonde con el router en el body?*/}
      <Footer />
    </>
  );
};

export default AppLayout;
