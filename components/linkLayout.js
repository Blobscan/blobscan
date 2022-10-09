import {
  Box,
  Heading,
  Input,
  InputGroup,
  Text,
  Link,
  Flex,
  Spacer,
} from "@chakra-ui/react";
import Search from './search'

import { BiSearchAlt } from "react-icons/fa";

const LinkLayout = ({ children }) => (
  <>
    <Flex mt="50px" pl="100px" pr="100px" pt="20px" pb="25px" bg="#f4f4f4">
      <Box>
        <Heading as="h1" textAlign="center" fontSize="7xl">
          bl<span>⍥</span>bscan
          {/* blöbscan */}
        </Heading>
        <Text fontSize="xs" textAlign="center" mt="5px">
          Blob transactions explorer for{" "}
          <Link href="https://www.eip4844.com/">EIP-4844</Link>
        </Text>
      </Box>
      <Spacer />
      <Search noButton />
    </Flex>
    {children}
  </>
);

export default LinkLayout;
