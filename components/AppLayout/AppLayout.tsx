import { Container, Box } from "@chakra-ui/react";
import { useRouter } from "next/router";

import { TopBar } from "./AppLayoutTopBar";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  variant?: string;
}

const AppLayout = ({ children }: LayoutProps) => {
  const { pathname } = useRouter();

  return (
    <>
      {pathname === "/" ? <TopBar /> : <TopBar withLogoInput={true} />}
      {pathname === "/" ? (
        //TODO: isolate containers in components ?
        <Container size={["sm", "md"]} centerContent={true}>
          {children}
        </Container>
      ) : (
        <>
          <Box
            pos={"absolute"}
            top="61px"
            bgColor="neutral.50"
            w="100%"
            minH="100vh"
          >
            <Container size={["sm", "lg"]} variant="shadow">
              {children}
            </Container>
          </Box>
        </>
      )}
      <Footer />
    </>
  );
};

export default AppLayout;
