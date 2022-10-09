import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  Link,
} from "@chakra-ui/react";

const Layout = ({ children }) => (
  <Container minWidth="100%" centerContent>
    <Box maxW="2xl" m="0 auto">
      <Heading as="h1" textAlign="center" fontSize="9xl" mt="100px" mb="50px">
        bl<span>⍥</span>bscan
        {/* blöbscan */}
      </Heading>
      <InputGroup size="lg" mt="30px">
        <Input
          width="lg"
          placeholder="Block hash, Transaction hash, address  or blob hash"
          variant="filled"
          _placeholder={{ opacity: 0.3, color: "inherit" }}
        />
        <InputRightElement width="4.5rem" mr={"1rem"}>
          <Button h="1.75rem" size="sm">
            Search
          </Button>
        </InputRightElement>
      </InputGroup>
      <Text fontSize="xl" textAlign="center" mt="30px">
        Blob transactions explorer for{" "}
        <Link href="https://www.eip4844.com/">EIP-4844</Link>
      </Text>
    </Box>
    {children}
  </Container>
);

export default Layout;
