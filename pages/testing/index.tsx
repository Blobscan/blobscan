import { Container, Box, Heading } from "@chakra-ui/react";

import { PageTopBar } from "../../components/top-bar/PageTopBar";
import PageLayout from "../../components/layouts/PageLayout";

const index = () => {
  return (
    <>
      <PageLayout>
        <Box>
          <Heading>TESTING PAGES</Heading>
        </Box>
      </PageLayout>
    </>
  );
};

export default index;
