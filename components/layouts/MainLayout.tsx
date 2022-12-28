import React from "react";
import { Container } from "@chakra-ui/react";

import Footer from "../footer/Footer";

interface LayoutProps {
  children: React.ReactNode;
  variant?: string;
}

const MainLayout = ({ children }: LayoutProps) => {
  return (
    <>
      <Container size={["sm", "md"]} centerContent={true}>
        {children}
      </Container>
      <Footer />
    </>
  );
};

export default MainLayout;
