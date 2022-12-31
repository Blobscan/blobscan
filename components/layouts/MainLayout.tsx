import React from "react";
import { Container } from "@chakra-ui/react";

import Footer from "../Footer";
import { TopBar } from "../top-bar/TopBar";

interface LayoutProps {
  children: React.ReactNode;
  variant?: string;
}

const MainLayout = ({ children }: LayoutProps) => {
  return (
    <>
      <TopBar />
      <Container size={["sm", "md"]} centerContent={true}>
        {children}
      </Container>
      <Footer />
    </>
  );
};

export default MainLayout;
