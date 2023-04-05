import Image from "next/image";
import { Box, Container } from "@chakra-ui/react";

import notFoundImg from "@/public/404.png";

export default function Custom404() {
  return (
    <Container marginTop="10%">
      <Container centerContent>
        <Image width={380} height={380} src={notFoundImg} alt="" />
        <Box color="lightgrey" marginTop={10} fontSize={20}>
          The requested path was not found on blobscan.
        </Box>
      </Container>
    </Container>
  );
}
