import {
  Box,
  Heading,
  Input,
  InputGroup,
  Text,
  Link,
  Flex,
  Container,
  Spacer,
} from "@chakra-ui/react";
import NextLink from "next/link"

import Search from "./search";

import { BiSearchAlt } from "react-icons/fa";

const LinkLayout = ({ children }) => (
  <>
    <Flex mt="50px" pl="120px" pr="120px" pt="20px" pb="25px" bg="#f4f4f4">
      <Box>
        <Heading as="h1" textAlign="center" fontSize="7xl" color="#502eb4">
          <Link href="/">bl<span>⍥</span>bscan</Link>
        </Heading>
        <Text fontSize="xs" textAlign="center" mt="5px" color="#502eb4">
          Blob transactions explorer for{" "}
          <Link href="https://www.eip4844.com/">EIP-4844</Link>
        </Text>
      </Box>

      <Spacer />
      <Box>
        <Search noButton />
      </Box>
    </Flex>
    <Box ml="100px" mr="100px" mt="50px">
      {children}
    </Box>
    {/* <Container minWidth="100%">{children}</Container> */}
  </>
);

export default LinkLayout;
