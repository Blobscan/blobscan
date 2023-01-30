import { Container } from "@chakra-ui/react";
import { useRouter } from "next/router";

import { AppLayoutTopBar } from "./AppLayoutTopBar";
import { AppLayoutBottomBar } from "./AppLayoutBottomBar";

interface LayoutProps {
  children: React.ReactNode;
  variant?: string;
}

const AppLayout = ({ children }: LayoutProps) => {
  const { pathname } = useRouter();
  const isHomePage = pathname === "/";

  const containerProps = !isHomePage && {
    mt: "-158px",
    variant: "shadow",
  };

  return (
    <>
      <AppLayoutTopBar />
      <Container {...containerProps}>{children}</Container>
      <AppLayoutBottomBar />
    </>
  );
};

export default AppLayout;
