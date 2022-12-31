import { Container, Box, Heading } from "@chakra-ui/react";

import { PageTopBar } from "../../components/navbar/PageTopBar";

const index = () => {
  return (
    <>
      <PageTopBar />
      <Container size={"lg"} variant="shadow">
        <Box>
          <Heading>Test</Heading>
        </Box>
      </Container>
    </>
  );
};

export default index;
