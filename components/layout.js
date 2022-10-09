import {
  Box,
  Container,
  Heading,
  Text,
  Link,
} from "@chakra-ui/react";

import Search from './search'



const Layout = ({ children }) => (
    <Container minWidth="100%" centerContent>
        <Box maxW="2xl" m="0 auto">
        <Heading as="h1" textAlign="center" fontSize="9xl" mt="100px" mb="50px">
            bl<span>⍥</span>bscan
            {/* blöbscan */}
        </Heading>
        <Search></Search>
        <Text fontSize="xl" textAlign="center" mt="30px">
            Blob transactions explorer for{" "}
            <Link href="https://www.eip4844.com/">EIP-4844</Link>
        </Text>
        </Box>
        {children}
    </Container>
    )

export default Layout;
