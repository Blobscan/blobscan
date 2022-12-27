import React from "react";
import { Container } from "@chakra-ui/react";

interface LayoutProps {
  children: React.ReactNode;
}

const InnerPagesLayout = ({ children }: LayoutProps) => {
  return (
    <Container size={["sm", "lg"]} variant="shadow">
      {children}
    </Container>
  );
};

export default InnerPagesLayout;
