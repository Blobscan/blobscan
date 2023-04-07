import { useRouter } from "next/router";
import { Container } from "@chakra-ui/react";

import { AppLayoutBottomBar } from "./AppLayoutBottomBar";
import { AppLayoutTopBar } from "./AppLayoutTopBar";

interface LayoutProps {
  children: React.ReactNode;
  variant?: string;
}

const AppLayout = ({ children }: LayoutProps) => {
  const { pathname } = useRouter();
  const isHomePage = pathname === "/";

  return (
    <>
      <AppLayoutTopBar />
      {isHomePage ? (
        <Container maxWidth="90vw" bgColor="background">
          {children}
        </Container>
      ) : (
        <>
          <Container size={["sm", "lg"]} variant="shadow">
            {children}
          </Container>
        </>
      )}
      <AppLayoutBottomBar />
    </>
  );
};

export default AppLayout;
