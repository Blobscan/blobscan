import { Container, Box } from "@chakra-ui/react";
import { useRouter } from "next/router";

import { TopBar } from "./AppLayoutTopBar";
import { PageTopBar } from "./AppLayoutPageTopBar";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  variant?: string;
}

const AppLayout = ({ children }: LayoutProps) => {
  const { pathname } = useRouter();

  return (
    <>
      {pathname === "/" ? <TopBar /> : <PageTopBar />}
      {pathname === "/" ? (
        //TODO: isolate containers in components ?
        <Container size={["sm", "md"]} centerContent={true}>
          {children}
        </Container>
      ) : (
        <Box pos={"absolute"} bgColor="neutral.50" w="100%" minH="100vh">
          <Container size={["sm", "lg"]} variant="shadow">
            {children}
          </Container>
        </Box>
      )}

      {/* <Footer /> */}
    </>
  );

  // TODO: alternative to code above ... which is better?
  // if (pathname === "/") {
  //   return (
  //     <>
  //       <TopBar />
  //       <Container size={["sm", "md"]} centerContent={true}>
  //         {children}
  //       </Container>
  //     </>
  //   );
  // }
  // if (pathname !== "/") {
  //   return (
  //     <>
  //       <PageTopBar />
  //       <Box pos="absolute" bgColor="neutral.50" minW="100vw" minH="100vh">
  //         <Container size={["sm", "lg"]} variant="shadow">
  //           {children}
  //         </Container>
  //       </Box>
  //     </>
  //   );
  // }
};

export default AppLayout;
