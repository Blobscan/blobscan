import React from "react";
import { Container, Box } from "@chakra-ui/react";

import { PageTopBar } from "../top-bar/PageTopBar";
import Footer from "../Footer";

interface LayoutProps {
  children: React.ReactNode;
}

//index a blobscanTheme
const PageLayout = ({ children }: LayoutProps) => {
  return (
    <Box pos="absolute" bgColor="neutral.50" minW="100vw" minH="100vh">
      <PageTopBar />
      <Container size={["sm", "lg"]} variant="shadow">
        {children}
      </Container>
      <Footer />
    </Box>
  );
};

export default PageLayout;
